import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Normalize phone for WhatsApp (972 format)
function normalizeWhatsAppPhone(phoneDigits: string): string {
  const digits = (phoneDigits || "").replace(/\D/g, "");
  if (!digits) return "";

  // Convert 00 prefix to international
  if (digits.startsWith("00")) return digits.slice(2);

  // Israel local mobile/landline often arrives as 0XXXXXXXXX
  if (digits.length === 10 && digits.startsWith("0")) {
    return `972${digits.slice(1)}`;
  }

  return digits;
}

// Detect intent from message content
function detectIntentFromMessage(message: string): string {
  const msgLower = message.toLowerCase();
  
  // Course keywords
  const courseKeywords = ["קורס", "לימוד", "סדנה", "ללמוד", "להירשם", "רישום", "course", "workshop", "class", "אימפרוביזציה", "אימפרו", "משחק", "דרמה", "תיאטרון"];
  for (const keyword of courseKeywords) {
    if (msgLower.includes(keyword)) {
      return "course";
    }
  }
  
  // Show keywords
  const showKeywords = ["הצגה", "מופע", "כרטיס", "כרטיסים", "להזמין", "הזמנה", "show", "ticket", "theater"];
  for (const keyword of showKeywords) {
    if (msgLower.includes(keyword)) {
      return "show";
    }
  }
  
  // Price keywords
  const priceKeywords = ["מחיר", "עולה", "עלות", "כמה", "price", "cost"];
  for (const keyword of priceKeywords) {
    if (msgLower.includes(keyword)) {
      return "price";
    }
  }
  
  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();

    const incomingChannelId = body?.channel_id;
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    console.log(
      "Whapi webhook:",
      JSON.stringify({
        channel_id: incomingChannelId,
        event: body?.event,
        messages_count: messages.length,
      })
    );

    // Get allowed channel ID from settings
    const { data: channelSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "whapi_channel_id")
      .single();

    const allowedChannelId = (channelSetting?.value ?? "").trim();

    // CRITICAL: Only process messages from our configured channel
    // If this isn't configured, we ignore EVERYTHING to prevent cross-account contamination.
    if (!allowedChannelId) {
      console.warn("Webhook ignored: whapi_channel_id is not configured in settings.");
      return new Response(
        JSON.stringify({ success: true, ignored: true, reason: "missing_channel_id" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!incomingChannelId || incomingChannelId !== allowedChannelId) {
      console.log(
        `Ignoring message from unauthorized channel: ${incomingChannelId}. Expected: ${allowedChannelId}`
      );
      return new Response(
        JSON.stringify({ success: true, ignored: true, reason: "unauthorized_channel" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (messages.length === 0) {
      console.log("No messages in webhook");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const msg of messages) {
      // Skip outgoing messages (from_me = true)
      if (msg.from_me) {
        console.log("Skipping outgoing message");
        continue;
      }

      // Skip group chats (we only want 1:1 customer conversations)
      const chatId = typeof msg.chat_id === "string" ? msg.chat_id : "";
      if (chatId.endsWith("@g.us") || chatId.endsWith("@broadcast")) {
        console.log("Skipping group/broadcast message. chat_id:", chatId, "chat_name:", msg.chat_name);
        continue;
      }

      // Only process text messages
      if (msg.type !== "text" || !msg.text?.body) {
        console.log("Skipping non-text message, type:", msg.type);
        continue;
      }

      const phone = msg.from?.replace("@s.whatsapp.net", "") || msg.chat_id?.replace("@s.whatsapp.net", "");
      const message = msg.text.body;

      if (!phone || !message) {
        console.log("Missing phone or message");
        continue;
      }

      // Clean and normalize phone number
      const cleanPhone = phone.replace(/\D/g, "");
      const waPhone = normalizeWhatsAppPhone(cleanPhone);
      const last9Digits = cleanPhone.slice(-9);
      
      console.log("Processing message from:", cleanPhone, "normalized:", waPhone, "Message:", message);

      // Detect intent from message
      const detectedIntent = detectIntentFromMessage(message);
      console.log("Detected intent:", detectedIntent);

      // Find lead with multiple phone format variations
      let { data: lead } = await supabase
        .from("leads")
        .select("*")
        .or(`phone.eq.${cleanPhone},phone.eq.${waPhone},phone.ilike.%${last9Digits}`)
        .single();

      const isNewLead = !lead;
      console.log("Lead found:", !!lead, "isNewLead:", isNewLead);

      if (!lead) {
        // Create new lead from incoming message with detected intent
        const { data: newLead, error } = await supabase
          .from("leads")
          .insert({
            name: `WhatsApp ${cleanPhone.slice(-4)}`,
            phone: waPhone, // Store normalized phone
            source: "WhatsApp",
            status: "Chatting",
            interest: detectedIntent || null,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating lead:", error);
          throw error;
        }
        lead = newLead;
        console.log("Created new lead from WhatsApp:", lead.id, "phone:", waPhone, "interest:", detectedIntent);
      } else if (detectedIntent && !lead.interest) {
        // Update existing lead's interest if we detected one and they don't have one
        await supabase
          .from("leads")
          .update({ interest: detectedIntent })
          .eq("id", lead.id);
        lead.interest = detectedIntent;
        console.log("Updated lead interest to:", detectedIntent);
      }

      // Save the incoming message
      const { error: messageError } = await supabase.from("messages").insert({
        lead_id: lead.id,
        sender: "user",
        content: message,
      });

      if (messageError) {
        console.error("Error saving message:", messageError);
        throw messageError;
      }

      // Update lead's last interaction
      await supabase
        .from("leads")
        .update({ 
          last_interaction_at: new Date().toISOString(),
          status: "Chatting"
        })
        .eq("id", lead.id);

      console.log("Message saved for lead:", lead.id, "triggering AI response...");

      // Trigger AI response - DON'T await so we return quickly to Whapi
      fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-response`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leadId: lead.id,
            userMessage: message,
          }),
        }
      ).then(async (res) => {
        if (!res.ok) {
          console.error("AI response error:", await res.text());
        } else {
          console.log("AI response triggered successfully for lead:", lead.id);
        }
      }).catch((err) => {
        console.error("AI response fetch error:", err);
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
