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

    console.log("Processing automations...");

    // ===== 1. Process pending follow-ups =====
    const now = new Date().toISOString();
    const { data: pendingFollowUps, error: followUpsError } = await supabase
      .from("follow_ups")
      .select("*, leads(*)")
      .eq("status", "pending")
      .lte("scheduled_at", now);

    if (followUpsError) {
      console.error("Error fetching follow-ups:", followUpsError);
      throw followUpsError;
    }

    console.log(`Found ${pendingFollowUps?.length || 0} pending follow-ups`);

    // Get Whapi token
    const { data: settings } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "whapi_token")
      .single();

    const whapiToken = settings?.value;

    let processedCount = 0;
    const results: { id: string; success: boolean; error?: string }[] = [];

    if (whapiToken) {
      for (const followUp of pendingFollowUps || []) {
        try {
          const lead = followUp.leads;
          if (!lead?.phone) {
            console.log(`Skipping follow-up ${followUp.id}: no phone number`);
            continue;
          }

          const cleanPhone = lead.phone.replace(/\D/g, "");

          const whapiResponse = await fetch("https://gate.whapi.cloud/messages/text", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${whapiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: `${cleanPhone}@s.whatsapp.net`,
              body: followUp.message,
            }),
          });

          if (whapiResponse.ok) {
            await supabase.from("follow_ups").update({ status: "sent" }).eq("id", followUp.id);
            await supabase.from("messages").insert({ lead_id: lead.id, sender: "bot", content: followUp.message });
            await supabase.from("activities").insert({ lead_id: lead.id, type: "follow_up_sent", description: "הודעת פולואפ נשלחה אוטומטית" });
            await supabase.from("leads").update({ last_interaction_at: new Date().toISOString() }).eq("id", lead.id);
            processedCount++;
            results.push({ id: followUp.id, success: true });
            console.log(`Follow-up ${followUp.id} sent successfully`);
          } else {
            const errorText = await whapiResponse.text();
            console.error(`Failed to send follow-up ${followUp.id}:`, errorText);
            results.push({ id: followUp.id, success: false, error: errorText });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error(`Error processing follow-up ${followUp.id}:`, message);
          results.push({ id: followUp.id, success: false, error: message });
        }
      }
    } else {
      console.log("Whapi not configured, skipping follow-up sending");
    }

    // ===== 2. Process automation rules =====
    let rulesProcessed = 0;
    const { data: activeRules } = await supabase
      .from("automation_rules")
      .select("*, message_templates(content)")
      .eq("is_active", true);

    console.log(`Found ${activeRules?.length || 0} active automation rules`);

    for (const rule of activeRules || []) {
      try {
        const condition = (rule.condition || {}) as Record<string, unknown>;

        if (rule.trigger_type === "new_lead") {
          // Find leads created within delay_minutes window (or last 15 min if no delay)
          const delayMs = (rule.delay_minutes || 0) * 60 * 1000;
          const windowStart = new Date(Date.now() - delayMs - 15 * 60 * 1000).toISOString();
          const windowEnd = new Date(Date.now() - delayMs).toISOString();

          let query = supabase.from("leads").select("id, name, phone").gte("created_at", windowStart).lte("created_at", windowEnd);
          if (condition.source) query = query.eq("source", condition.source as string);

          const { data: newLeads } = await query;

          for (const lead of newLeads || []) {
            // Check if we already processed this lead for this rule
            const { data: existing } = await supabase.from("activities")
              .select("id").eq("lead_id", lead.id).eq("type", `rule_${rule.id}`).maybeSingle();
            if (existing) continue;

            const messageContent = rule.message_templates?.content
              ? (rule.message_templates.content as string).replace(/\{name\}/g, lead.name)
              : (rule.custom_message || "").replace(/\{name\}/g, lead.name);

            if (rule.action_type === "send_message" && whapiToken && lead.phone && messageContent) {
              const cleanPhone = lead.phone.replace(/\D/g, "");
              await fetch("https://gate.whapi.cloud/messages/text", {
                method: "POST",
                headers: { Authorization: `Bearer ${whapiToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({ to: `${cleanPhone}@s.whatsapp.net`, body: messageContent }),
              });
              await supabase.from("messages").insert({ lead_id: lead.id, sender: "bot", content: messageContent });
            } else if (rule.action_type === "create_follow_up" && messageContent) {
              await supabase.from("follow_ups").insert({
                lead_id: lead.id, message: messageContent,
                scheduled_at: new Date(Date.now() + (rule.delay_minutes || 0) * 60000).toISOString(),
                type: "auto_rule", status: "pending",
              });
            } else if (rule.action_type === "notify") {
              await supabase.from("notifications").insert({
                type: "automation", title: `${rule.name}: ${lead.name}`,
                message: messageContent || `כלל אוטומציה הופעל עבור ${lead.name}`,
                link: `/chat?lead=${lead.id}`,
              });
            }

            // Mark as processed
            await supabase.from("activities").insert({ lead_id: lead.id, type: `rule_${rule.id}`, description: `כלל אוטומציה: ${rule.name}` });
            rulesProcessed++;
          }
        } else if (rule.trigger_type === "no_response") {
          const hours = (condition.hours as number) || 48;
          const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

          const { data: staleLeads } = await supabase.from("leads")
            .select("id, name, phone").eq("status", "Chatting").lt("last_interaction_at", cutoff);

          for (const lead of staleLeads || []) {
            const { data: existing } = await supabase.from("activities")
              .select("id").eq("lead_id", lead.id).eq("type", `rule_${rule.id}`)
              .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
              .maybeSingle();
            if (existing) continue;

            const messageContent = rule.message_templates?.content
              ? (rule.message_templates.content as string).replace(/\{name\}/g, lead.name)
              : (rule.custom_message || "").replace(/\{name\}/g, lead.name);

            if (rule.action_type === "notify" || !whapiToken) {
              await supabase.from("notifications").insert({
                type: "follow_up", title: `${lead.name} לא הגיב ${hours} שעות`,
                message: messageContent || "שקול לשלוח הודעת מעקב",
                link: `/chat?lead=${lead.id}`,
              });
            } else if (rule.action_type === "send_message" && whapiToken && lead.phone && messageContent) {
              const cleanPhone = lead.phone.replace(/\D/g, "");
              await fetch("https://gate.whapi.cloud/messages/text", {
                method: "POST",
                headers: { Authorization: `Bearer ${whapiToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({ to: `${cleanPhone}@s.whatsapp.net`, body: messageContent }),
              });
              await supabase.from("messages").insert({ lead_id: lead.id, sender: "bot", content: messageContent });
            }

            await supabase.from("activities").insert({ lead_id: lead.id, type: `rule_${rule.id}`, description: `כלל אוטומציה: ${rule.name}` });
            rulesProcessed++;
          }
        }

        // Update last_run_at
        await supabase.from("automation_rules").update({ last_run_at: new Date().toISOString() }).eq("id", rule.id);
      } catch (error) {
        console.error(`Error processing rule ${rule.id}:`, error);
      }
    }

    // ===== 3. Check stale leads (legacy behavior) =====
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: staleLeads } = await supabase
      .from("leads")
      .select("id, name, phone, last_interaction_at")
      .eq("status", "Chatting")
      .lt("last_interaction_at", twentyFourHoursAgo);

    for (const lead of staleLeads || []) {
      const { data: existingNotification } = await supabase
        .from("notifications").select("id")
        .eq("type", "follow_up").like("link", `%${lead.id}%`).eq("is_read", false).single();
      if (!existingNotification) {
        await supabase.from("notifications").insert({
          type: "follow_up", title: `${lead.name} לא הגיב 24 שעות`,
          message: "שקול לשלוח הודעת פולואפ", link: `/chat?lead=${lead.id}`,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      total: pendingFollowUps?.length || 0,
      staleLeads: staleLeads?.length || 0,
      rulesProcessed,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Automation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
