import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "Firecrawl not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Scrape the URL with Firecrawl
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping URL:", formattedUrl);

    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!scrapeRes.ok) {
      const errData = await scrapeRes.text();
      console.error("Firecrawl error:", scrapeRes.status, errData);
      if (scrapeRes.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "Firecrawl credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: false, error: "Failed to scrape URL" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";

    if (!markdown || markdown.length < 50) {
      return new Response(JSON.stringify({ success: false, error: "No content found on page" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Scraped markdown length:", markdown.length);

    // Step 2: Extract events using AI with tool calling
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an event data extractor. Given website content in Hebrew or English, extract all events, courses, shows, workshops, or conferences you can find. Extract as many as possible. For each event extract: title, type (course/show/conference/seminar/event), date, location, price, early_bird_price, url, and image_url. Dates should be in ISO 8601 format. Prices should be numbers only. If information is missing, use null.`,
          },
          {
            role: "user",
            content: `Extract all events from this page content:\n\n${markdown.substring(0, 15000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_events",
              description: "Save extracted events to the database",
              parameters: {
                type: "object",
                properties: {
                  events: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Event title" },
                        cpt_type: { type: "string", enum: ["course", "show", "conference", "seminar", "event"], description: "Event type" },
                        event_date: { type: "string", description: "ISO 8601 date or null" },
                        location: { type: "string", description: "Event location or null" },
                        price: { type: "number", description: "Price or null" },
                        early_bird_price: { type: "number", description: "Early bird price or null" },
                        url: { type: "string", description: "Event URL or null" },
                        image_url: { type: "string", description: "Image URL or null" },
                      },
                      required: ["title", "cpt_type"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["events"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_events" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "AI rate limit exceeded, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: false, error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({ success: false, error: "AI did not return structured data" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let extractedEvents: Record<string, unknown>[];
    try {
      const parsed = JSON.parse(toolCall.function.arguments);
      extractedEvents = parsed.events || [];
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Failed to parse AI response" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`AI extracted ${extractedEvents.length} events`);

    if (extractedEvents.length === 0) {
      return new Response(JSON.stringify({ success: true, created: 0, updated: 0, total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Save to DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let created = 0;
    let updated = 0;

    for (const evt of extractedEvents) {
      const eventData = {
        title: evt.title || "ללא שם",
        cpt_type: evt.cpt_type || "event",
        event_date: evt.event_date || null,
        location: evt.location || null,
        price: evt.price || null,
        early_bird_price: evt.early_bird_price || null,
        url: evt.url || formattedUrl,
        image_url: evt.image_url || null,
        extra_fields: {},
        synced_at: new Date().toISOString(),
      };

      // Check if event with same title already exists
      const { data: existing } = await supabase
        .from("ea_events")
        .select("id")
        .eq("title", eventData.title)
        .maybeSingle();

      if (existing) {
        await supabase.from("ea_events").update(eventData).eq("id", existing.id);
        updated++;
      } else {
        await supabase.from("ea_events").insert(eventData);
        created++;
      }
    }

    // Log
    await supabase.from("ea_logs").insert({
      log_type: "system",
      level: "success",
      source: "scrape",
      message: `סריקת ${formattedUrl}: ${created} חדשים, ${updated} עודכנו`,
      metadata: { url: formattedUrl, created, updated },
    });

    return new Response(
      JSON.stringify({ success: true, created, updated, total: extractedEvents.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ea-scrape-events error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
