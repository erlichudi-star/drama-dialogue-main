import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { target_name, target_type, target_id, message_type } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Gather context
    let context = `שם: ${target_name}\nסוג: ${target_type === "lead" ? "ליד" : "לקוח"}\nסוג הודעה: ${message_type}\n`;

    if (target_type === "lead" && target_id) {
      const { data: lead } = await supabase.from("leads").select("*").eq("id", target_id).single();
      if (lead) {
        context += `מקור: ${lead.source}\nעניין: ${lead.interest || "לא צוין"}\nסטטוס: ${lead.status}\n`;
      }
      // Get recent messages
      const { data: messages } = await supabase.from("messages").select("sender, content").eq("lead_id", target_id).order("created_at", { ascending: false }).limit(5);
      if (messages?.length) {
        context += "\nהודעות אחרונות:\n";
        messages.reverse().forEach(m => { context += `${m.sender}: ${m.content}\n`; });
      }
    }

    // Get courses/shows for context
    const { data: courses } = await supabase.from("courses").select("name, schedule, price").eq("is_active", true).limit(5);
    if (courses?.length) {
      context += "\nקורסים פעילים:\n";
      courses.forEach(c => { context += `- ${c.name} (${c.price ? `₪${c.price}` : "מחיר לא צוין"})\n`; });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const typeInstructions: Record<string, string> = {
      reminder: "צור הודעת תזכורת ידידותית וחמה",
      promotion: "צור הודעת קידום מכירות עם הצעה אטרקטיבית",
      follow_up: "צור הודעת מעקב לאחר שיחה קודמת",
    };

    const instruction = typeInstructions[message_type] || "צור הודעת פולואפ מותאמת אישית";

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `אתה עוזר ליצור הודעות WhatsApp עבור עסק תיאטרון/בית ספר למשחק. ${instruction}. כתוב בעברית, בטון חם ומקצועי. ההודעה צריכה להיות קצרה (2-4 משפטים), לכלול את שם הנמען, ולהתאים להקשר. אל תכתוב כלום מלבד ההודעה עצמה.`,
          },
          {
            role: "user",
            content: `צור הודעת WhatsApp מותאמת אישית עבור:\n\n${context}`,
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} - ${errText}`);
    }

    const aiData = await aiResponse.json();
    const message = aiData.choices?.[0]?.message?.content?.trim();

    return new Response(JSON.stringify({ success: true, message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating message:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
