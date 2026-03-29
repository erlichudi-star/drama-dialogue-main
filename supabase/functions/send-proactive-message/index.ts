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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { leadId, message, type = "whatsapp" } = await req.json();
    console.log("Proactive message requested for lead:", leadId, "Type:", type);

    if (!leadId || !message) {
      return new Response(
        JSON.stringify({ error: "leadId and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lead info
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Whapi token from settings
    const { data: whapiSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "whapi_token")
      .single();

    const whapiToken = whapiSetting?.value;

    if (!whapiToken) {
      return new Response(
        JSON.stringify({ error: "WhatsApp not configured. Please add whapi_token in settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone number
    const cleanPhone = lead.phone.replace(/\D/g, "");
    
    // Send via Whapi
    const whapiResponse = await fetch(
      "https://gate.whapi.cloud/messages/text",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whapiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: `${cleanPhone}@s.whatsapp.net`,
          body: message,
        }),
      }
    );

    if (!whapiResponse.ok) {
      const errorText = await whapiResponse.text();
      console.error("Whapi error:", errorText);
      return new Response(
        JSON.stringify({ error: `WhatsApp send failed: ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Proactive message sent to:", cleanPhone);

    // Save message to database
    await supabase.from("messages").insert({
      lead_id: leadId,
      sender: "bot",
      content: message,
    });

    // Log activity
    await supabase.from("activities").insert({
      lead_id: leadId,
      type: "message_sent",
      description: `הודעה יזומה נשלחה: ${message.substring(0, 50)}...`,
      metadata: { type, full_message: message },
    });

    // Update lead's last interaction
    await supabase
      .from("leads")
      .update({ 
        last_interaction_at: new Date().toISOString(),
        status: lead.status === "New" ? "Chatting" : lead.status
      })
      .eq("id", leadId);

    return new Response(
      JSON.stringify({ success: true, message: "Message sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send proactive message error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
