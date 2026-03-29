import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface EAEventForContent {
  title: string;
  cpt_type: string;
  event_date: string | null;
  location: string | null;
  price: number | null;
  early_bird_price: number | null;
  url: string | null;
}

interface CampaignStep {
  days_before: number;
  phase: string;
  platforms: string[];
  content_hint?: string;
}

type ScheduledPostWithEvent = {
  platforms: string[] | null;
  phase: string | null;
  ea_events: EAEventForContent | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_id, template_id, post_id, platform } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Mode 1: Generate content for a single post
    if (post_id) {
      const { data: post } = await supabase
        .from("ea_scheduled_posts")
        .select("*, ea_events(*)")
        .eq("id", post_id)
        .single();

      if (!post) {
        return new Response(JSON.stringify({ success: false, error: "Post not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const event = (post as ScheduledPostWithEvent).ea_events;
      if (!event) {
        return new Response(JSON.stringify({ success: false, error: "Event not linked to post" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const platforms = platform ? [platform] : (post.platforms || []);

      const content = await generateContentForPlatforms(LOVABLE_API_KEY, event, post.phase || "פרסום", platforms as string[]);

      const updateData: Record<string, string | null> = {};
      if (content.email) updateData.content_email = content.email;
      if (content.facebook) updateData.content_facebook = content.facebook;
      if (content.instagram) updateData.content_instagram = content.instagram;
      if (content.whatsapp) updateData.content_whatsapp = content.whatsapp;

      await supabase.from("ea_scheduled_posts").update(updateData).eq("id", post_id);

      return new Response(JSON.stringify({ success: true, content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mode 2: Create full campaign from event + template
    if (!event_id) {
      return new Response(JSON.stringify({ success: false, error: "event_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: event } = await supabase
      .from("ea_events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (!event) {
      return new Response(JSON.stringify({ success: false, error: "Event not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get template steps
    let steps: CampaignStep[] = [];
    if (template_id) {
      const { data: template } = await supabase
        .from("ea_campaign_templates")
        .select("*")
        .eq("id", template_id)
        .single();

      if (template && Array.isArray(template.steps)) {
        steps = template.steps as CampaignStep[];
      }
    }

    // Default steps if no template
    if (steps.length === 0) {
      steps = [
        { days_before: 60, phase: "הכרזה", platforms: ["facebook", "instagram", "email"], content_hint: "הכרזה ראשונית" },
        { days_before: 14, phase: "מכירת כרטיסים", platforms: ["facebook", "email", "whatsapp"], content_hint: "מכירת כרטיסים" },
        { days_before: 3, phase: "תזכורת", platforms: ["whatsapp"], content_hint: "תזכורת אחרונה" },
      ];
    }

    // Create campaign
    const { data: campaign, error: campErr } = await supabase
      .from("ea_campaigns")
      .insert({
        event_id,
        template_id: template_id || null,
        status: "active",
      })
      .select()
      .single();

    if (campErr || !campaign) {
      return new Response(JSON.stringify({ success: false, error: "Failed to create campaign" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create scheduled posts for each step with AI content
    const eventDate = event.event_date ? new Date(event.event_date) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const postsCreated: { id: string }[] = [];

    for (const step of steps) {
      const targetDate = new Date(eventDate.getTime() - step.days_before * 24 * 60 * 60 * 1000);
      
      // Skip dates in the past
      if (targetDate < new Date()) {
        continue;
      }

      const content = await generateContentForPlatforms(LOVABLE_API_KEY, event, step.phase, step.platforms);

      const { data: post } = await supabase
        .from("ea_scheduled_posts")
        .insert({
          campaign_id: campaign.id,
          event_id,
          target_date: targetDate.toISOString().split("T")[0],
          phase: step.phase,
          platforms: step.platforms,
          content_email: content.email || null,
          content_facebook: content.facebook || null,
          content_instagram: content.instagram || null,
          content_whatsapp: content.whatsapp || null,
          status: "pending",
        })
        .select()
        .single();

      if (post) postsCreated.push(post);
    }

    // Log
    await supabase.from("ea_logs").insert({
      log_type: "system",
      level: "success",
      source: "campaign",
      message: `קמפיין חדש נוצר: "${event.title}" - ${postsCreated.length} פוסטים`,
      metadata: { campaign_id: campaign.id, event_id, posts: postsCreated.length },
    });

    return new Response(
      JSON.stringify({ success: true, campaign_id: campaign.id, posts_created: postsCreated.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ea-generate-campaign error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unexpected error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateContentForPlatforms(
  apiKey: string,
  event: EAEventForContent,
  phase: string,
  platforms: string[]
): Promise<Record<string, string>> {
  const eventInfo = `
שם האירוע: ${event.title}
סוג: ${event.cpt_type}
תאריך: ${event.event_date || "לא נקבע"}
מיקום: ${event.location || "לא נקבע"}
מחיר: ${event.price ? `₪${event.price}` : "לא נקבע"}
מחיר ארלי בירד: ${event.early_bird_price ? `₪${event.early_bird_price}` : "לא רלוונטי"}
קישור: ${event.url || ""}
`.trim();

  const platformInstructions: Record<string, string> = {
    email: "כתוב מייל שיווקי מקצועי בעברית. כולל כותרת, גוף הודעה ו-CTA. פורמט: טקסט רגיל.",
    facebook: "כתוב פוסט פייסבוק בעברית. קצר, מושך, עם אימוג'ים. עד 280 תווים.",
    instagram: "כתוב כיתוב לאינסטגרם בעברית. כולל האשטגים רלוונטיים. מושך ויזואלי.",
    whatsapp: "כתוב הודעת וואטסאפ קצרה בעברית. אישית, ידידותית, עם אימוג'י אחד או שניים. עד 160 תווים.",
  };

  const requestedPlatforms = platforms.filter(p => platformInstructions[p]);
  if (requestedPlatforms.length === 0) return {};

  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `אתה קופירייטר מקצועי לשיווק אירועים בעברית. צור תוכן שיווקי עבור כל פלטפורמה שנבקשת.`,
          },
          {
            role: "user",
            content: `צור תוכן שיווקי לשלב "${phase}" עבור האירוע הבא:\n\n${eventInfo}\n\nצור תוכן עבור הפלטפורמות: ${requestedPlatforms.join(", ")}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_content",
              description: "Save generated marketing content for each platform",
              parameters: {
                type: "object",
                properties: {
                  email: { type: "string", description: "Email content" },
                  facebook: { type: "string", description: "Facebook post content" },
                  instagram: { type: "string", description: "Instagram caption" },
                  whatsapp: { type: "string", description: "WhatsApp message" },
                },
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_content" } },
      }),
    });

    if (!aiRes.ok) {
      console.error("AI content generation error:", aiRes.status);
      return {};
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return {};

    const content = JSON.parse(toolCall.function.arguments);
    return content;
  } catch (err) {
    console.error("Content generation error:", err);
    return {};
  }
}
