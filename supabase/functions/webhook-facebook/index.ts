import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper to detect interest from ad name
function detectInterestFromAd(adName: string): { interest: string; matchedName: string | null } {
  const adLower = adName.toLowerCase();
  
  // Keywords that indicate course interest
  const courseKeywords = ["קורס", "לימוד", "סדנה", "workshop", "course", "class"];
  for (const keyword of courseKeywords) {
    if (adLower.includes(keyword)) {
      return { interest: "course", matchedName: adName };
    }
  }
  
  // Keywords that indicate show interest
  const showKeywords = ["הצגה", "מופע", "הופעה", "show", "theater", "תיאטרון", "כרטיס"];
  for (const keyword of showKeywords) {
    if (adLower.includes(keyword)) {
      return { interest: "show", matchedName: adName };
    }
  }
  
  return { interest: "general", matchedName: null };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Handle Facebook webhook verification (GET request)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log("Facebook verification request:", { mode, token, challenge });

    // Get verify token from settings
    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "facebook_verify_token")
      .single();

    const verifyToken = setting?.value;

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Facebook webhook verified successfully");
      return new Response(challenge, { status: 200 });
    }

    console.log("Facebook verification failed");
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const body = await req.json();
    console.log("Facebook webhook received:", JSON.stringify(body));

    // Facebook sends different event types
    const leadData = body.entry?.[0]?.changes?.[0]?.value;
    
    if (!leadData) {
      console.log("No lead data found in webhook");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract lead info
    type FieldEntry = { name?: string; values?: string[] };
    const fieldData = leadData.field_data as FieldEntry[] | undefined;
    const name =
      leadData.full_name ||
      fieldData?.find((f) => f.name === "full_name")?.values?.[0] ||
      "New Lead";
    const phone =
      leadData.phone_number || fieldData?.find((f) => f.name === "phone_number")?.values?.[0] || "";
    const email = leadData.email || fieldData?.find((f) => f.name === "email")?.values?.[0] || null;
    
    // Extract ad/campaign info for smart intent recognition
    const adName = leadData.ad_name || leadData.ad_id || "";
    const campaignId = leadData.campaign_id || "";
    const formId = leadData.form_id || "";

    if (!phone) {
      console.log("No phone number found, skipping");
      return new Response(JSON.stringify({ success: true, message: "No phone number" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect interest from ad name
    const { interest, matchedName } = detectInterestFromAd(adName);
    console.log("Detected interest:", interest, "from ad:", adName);

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("phone", phone)
      .single();

    let leadId: string;

    if (existingLead) {
      leadId = existingLead.id;
      // Update existing lead with new ad info
      await supabase
        .from("leads")
        .update({
          ad_name: adName || null,
          interest: interest,
          campaign_id: campaignId || null,
        })
        .eq("id", leadId);
      console.log("Lead updated with ad info:", leadId);
    } else {
      // Create new lead with full context
      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          name,
          phone,
          email,
          source: "Facebook",
          status: "New",
          ad_name: adName || null,
          interest: interest,
          campaign_id: campaignId || null,
        })
        .select("id")
        .single();

      if (leadError) {
        console.error("Error creating lead:", leadError);
        throw leadError;
      }

      leadId = newLead.id;
      console.log("New lead created with intent:", leadId, interest);
    }

    // Get Whapi settings
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .eq("key", "whapi_token")
      .single();

    const whapiToken = settings?.value;

    if (whapiToken) {
      let welcomeMessage: string;

      // Personalized welcome based on detected interest
      if (interest === "course") {
        // Try to find matching course
        const { data: courses } = await supabase
          .from("courses")
          .select("name, price, start_date")
          .eq("is_active", true)
          .order("start_date", { ascending: true })
          .limit(1);

        const course = courses?.[0];
        if (course) {
          const startDate = new Date(course.start_date).toLocaleDateString("he-IL");
          welcomeMessage = `🎭 היי ${name}!

שמחים שהתעניינת בקורסים שלנו!

הקורס הקרוב שלנו: *${course.name}*
📅 תאריך פתיחה: ${startDate}
💰 מחיר: ${course.price}₪

רוצה לשמוע עוד פרטים? או לשריין מקום?`;
        } else {
          welcomeMessage = `🎭 היי ${name}!

שמחים שהתעניינת בקורסים שלנו!

איזה קורס מעניין אותך?
• משחק למתחילים
• משחק מתקדמים
• אימפרוביזציה
• עוד...`;
        }
      } else if (interest === "show") {
        // Try to find upcoming show
        const { data: shows } = await supabase
          .from("shows")
          .select("name, show_date, ticket_price")
          .eq("is_active", true)
          .gte("show_date", new Date().toISOString())
          .order("show_date", { ascending: true })
          .limit(1);

        const show = shows?.[0];
        if (show) {
          const showDate = new Date(show.show_date).toLocaleDateString("he-IL", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          });
          welcomeMessage = `🎭 היי ${name}!

שמחים שהתעניינת בהצגות שלנו!

ההצגה הקרובה: *"${show.name}"*
📅 ${showDate}
🎫 כרטיסים מ-${show.ticket_price}₪

רוצה להזמין כרטיסים? כמה מקומות לשריין?`;
        } else {
          welcomeMessage = `🎭 היי ${name}!

שמחים שהתעניינת בהצגות שלנו!

לאיזו הצגה התעניינת?
אשמח לעזור עם פרטים והזמנת כרטיסים 🎫`;
        }
      } else {
        // General interest
        welcomeMessage = `🎭 שלום ${name}!

תודה שפנית לבית הספר לתיאטרון שלנו!

איך אוכל לעזור לך?
• מידע על קורסים
• לוח הצגות וכרטיסים
• מחירים ורישום
• כל שאלה אחרת`;
      }

      const whapiResponse = await fetch(
        "https://gate.whapi.cloud/messages/text",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${whapiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: `${phone.replace(/\D/g, "")}@s.whatsapp.net`,
            body: welcomeMessage,
          }),
        }
      );

      if (whapiResponse.ok) {
        // Save the welcome message
        await supabase.from("messages").insert({
          lead_id: leadId,
          sender: "bot",
          content: welcomeMessage,
        });

        // Update lead status
        await supabase
          .from("leads")
          .update({ status: "Chatting", last_interaction_at: new Date().toISOString() })
          .eq("id", leadId);

        console.log("Smart welcome message sent successfully");
      } else {
        console.error("Whapi error:", await whapiResponse.text());
      }
    } else {
      console.log("Whapi not configured, skipping welcome message");
    }

    return new Response(JSON.stringify({ success: true, leadId, interest }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
