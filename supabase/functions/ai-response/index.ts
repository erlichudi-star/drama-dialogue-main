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

// Convert Markdown formatting to WhatsApp formatting
function convertToWhatsAppFormatting(text: string): string {
  let result = text;
  
  // Convert **bold** to *bold* (WhatsApp uses single asterisk for bold)
  result = result.replace(/\*\*([^*]+)\*\*/g, '*$1*');
  
  // Convert [text](url) to "text: url" format for clearer links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2');
  
  // Ensure URLs are not broken across lines
  result = result.replace(/(\bhttps?:\/\/[^\s]+)/g, (url) => url.trim());
  
  return result;
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

    const { leadId, userMessage } = await req.json();
    console.log("AI Response requested for lead:", leadId, "Message:", userMessage);

    // Get the lead info with new interest fields
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (!lead) {
      throw new Error("Lead not found");
    }

    // Get conversation history (last 10 messages for context)
    const { data: messageHistory } = await supabase
      .from("messages")
      .select("sender, content")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get system prompt and contact phone from settings
    const { data: settingsData } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["system_prompt", "contact_phone"]);

    const systemPromptSetting = settingsData?.find(s => s.key === "system_prompt");
    const contactPhoneSetting = settingsData?.find(s => s.key === "contact_phone");
    const contactPhone = contactPhoneSetting?.value || "";

    const baseSystemPrompt = systemPromptSetting?.value || 
      "אתה נציג ידידותי של בית ספר לתיאטרון. עזור ללקוחות עם מידע על קורסים, לוח הצגות ומחירי כרטיסים.";

    // Fetch active courses with all relevant details
    const { data: courses } = await supabase
      .from("courses")
      .select("name, description, price, start_date, end_date, schedule, instructor, age_group, max_participants, payment_link")
      .eq("is_active", true)
      .order("start_date", { ascending: true });

    console.log("Fetched courses:", courses?.length || 0);

    // Fetch shows with their performances
    const { data: shows } = await supabase
      .from("shows")
      .select("id, name, description, venue, price, vip_price, duration_minutes, age_restriction, ticket_link")
      .eq("is_active", true);

    // Fetch upcoming performances
    const { data: performances } = await supabase
      .from("show_performances")
      .select("show_id, performance_date, venue, seats_available, ticket_link, is_cancelled")
      .gte("performance_date", new Date().toISOString())
      .eq("is_cancelled", false)
      .order("performance_date", { ascending: true });

    console.log("Fetched shows:", shows?.length || 0, "performances:", performances?.length || 0);

    // Combine shows with their performances
    const showsWithPerformances = shows?.map((show) => ({
      ...show,
      performances: performances?.filter((p) => p.show_id === show.id) || [],
    })) || [];

    // Search knowledge base for relevant context
    const { data: knowledgeItems } = await supabase
      .from("knowledge_base")
      .select("title, content")
      .limit(5);

    // Build rich context for AI - COURSES
    const coursesContext = courses?.length
      ? `\n### קורסים פעילים (${courses.length}):\n${courses.map((c) => {
          const startDate = c.start_date ? new Date(c.start_date).toLocaleDateString("he-IL") : "טרם נקבע";
          const endDate = c.end_date ? new Date(c.end_date).toLocaleDateString("he-IL") : "";
          let details = `- **${c.name}**`;
          if (c.price) details += ` | מחיר: ${c.price}₪`;
          if (c.schedule) details += ` | מועד: ${c.schedule}`;
          if (c.instructor) details += ` | מדריך: ${c.instructor}`;
          if (c.age_group) details += ` | גילאים: ${c.age_group}`;
          details += ` | מתחיל: ${startDate}`;
          if (endDate) details += ` עד ${endDate}`;
          if (c.max_participants) details += ` | עד ${c.max_participants} משתתפים`;
          if (c.description) details += `\n  תיאור: ${c.description}`;
          if (c.payment_link) details += `\n  לינק לרישום: ${c.payment_link}`;
          return details;
        }).join("\n\n")}`
      : "\n### קורסים: אין קורסים פעילים כרגע";

    // Build rich context for AI - SHOWS WITH PERFORMANCES
    const showsContext = showsWithPerformances.length
      ? `\n### הצגות קרובות:\n${showsWithPerformances.map((s) => {
          let details = `- **"${s.name}"**`;
          if (s.price) details += ` | מחיר: ${s.price}₪`;
          if (s.vip_price) details += ` (VIP: ${s.vip_price}₪)`;
          if (s.duration_minutes) details += ` | אורך: ${s.duration_minutes} דקות`;
          if (s.age_restriction) details += ` | גיל: ${s.age_restriction}`;
          if (s.venue) details += ` | מיקום ברירת מחדל: ${s.venue}`;
          if (s.description) details += `\n  תיאור: ${s.description}`;
          if (s.ticket_link) details += `\n  לינק לכרטיסים: ${s.ticket_link}`;
          
          // Add performances
          if (s.performances.length > 0) {
            details += `\n  **מופעים קרובים (${s.performances.length}):**`;
            s.performances.slice(0, 5).forEach((p) => {
              const perfDate = new Date(p.performance_date).toLocaleDateString("he-IL", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              details += `\n    - ${perfDate}`;
              if (p.venue) details += ` | ${p.venue}`;
              if (p.seats_available !== null) details += ` | ${p.seats_available} מקומות`;
              if (p.ticket_link) details += ` | לינק: ${p.ticket_link}`;
            });
            if (s.performances.length > 5) {
              details += `\n    - ועוד ${s.performances.length - 5} מופעים נוספים...`;
            }
          } else {
            details += `\n  אין מופעים מתוכננים כרגע`;
          }
          
          return details;
        }).join("\n\n")}`
      : "\n### הצגות: אין הצגות פעילות כרגע";

    const knowledgeContext = knowledgeItems?.length
      ? `\n### מידע נוסף מבסיס הידע:\n${knowledgeItems.map((k) => `**${k.title}**: ${k.content}`).join("\n\n")}`
      : "";

    // Build lead context
    const leadContext = `
### פרטי הלקוח:
- שם: ${lead.name}
- מקור הפנייה: ${lead.source}
- התעניינות: ${lead.interest || "לא ידוע"}
${lead.ad_name ? `- מודעה: ${lead.ad_name}` : ""}
`;

    // Build enhanced system prompt
    const fullSystemPrompt = `${baseSystemPrompt}

${leadContext}
${coursesContext}
${showsContext}
${knowledgeContext}

### הנחיות חשובות:
1. אם הלקוח שואל על קורס ספציפי - תן פרטים מלאים: מחיר, תאריך התחלה, ומה כולל
2. אם הלקוח שואל על הצגה - הצע להזמין כרטיסים, ציין את המופעים הקרובים עם תאריכים ומיקומים
3. אם הלקוח שואל "מתי ההצגה?" - תן את תאריכי המופעים הקרובים
4. אם הלקוח מתלבט - המלץ על הקורס/הצגה הכי קרובים
5. אם שואל על מחיר - תן מחיר מדויק מהרשימות למעלה

### הפניה לנציג אנושי / שיחה טלפונית:
- **קודם כל תנסה לענות בעצמך** על כל שאלה מהמידע שברשותך
- **אל תפנה לטלפון בהודעה הראשונה** - קודם נסה לעזור
- הפנה לשיחה טלפונית כאשר:
  • אין לך מידע מספיק לענות על השאלה
  • הלקוח מבקש במפורש לדבר עם מישהו
  • הלקוח שואל שאלה מורכבת שדורשת ייעוץ אישי
  • הלקוח לא מרוצה מהתשובה או מתעקש
- ${contactPhone ? `מספר הטלפון ליצירת קשר: ${contactPhone}` : "הצע ללקוח שנחזור אליו בהקדם"}
- נסח את ההפניה בצורה טבעית, לדוגמה: "אשמח לעזור! לפרטים נוספים אפשר גם להתקשר ל-${contactPhone || "המשרד"} 😊"
- אל תהיה דוחפני - תציע את זה כאפשרות, לא כדרישה

### סגנון לוואטסאפ (חשוב מאוד!):
- ענה בעברית
- תשובות קצרות וממוקדות (3-4 משפטים)
- טון חם, ידידותי ואמנותי
- אימוג'ים במידה - 🎭✨🎫
- **לבולד השתמש בכוכבית בודדת**: *טקסט* (לא **טקסט**)
- **לינקים**: כאשר יש לינק לרישום או לכרטיסים - הכלל אותו מלא כפי שהוא מופיע במידע למעלה. לא לקצר לינקים!
- תמיד הצע את הצעד הבא עם הלינק הרלוונטי
- אם אינך יודע לענות, אל תמציא - הצע שיחה טלפונית`;

    // Build conversation for AI
    const conversationMessages = (messageHistory || [])
      .reverse()
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.content,
      }));

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...conversationMessages,
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded");
      }
      if (aiResponse.status === 402) {
        throw new Error("Payment required");
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const botMessage = aiData.choices?.[0]?.message?.content;

    if (!botMessage) {
      throw new Error("No response from AI");
    }

    console.log("AI response:", botMessage);

    // Save bot message to database
    await supabase.from("messages").insert({
      lead_id: leadId,
      sender: "bot",
      content: botMessage,
    });

    // Get Whapi settings
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .eq("key", "whapi_token")
      .single();

    const whapiToken = settings?.value;

    if (whapiToken) {
      // Normalize phone number for WhatsApp
      const waPhone = normalizeWhatsAppPhone(lead.phone);
      console.log("Sending WhatsApp to:", waPhone, "(original:", lead.phone, ")");
      
      // Send response via Whapi with retry
      let lastError = "";
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);
          
          const whapiResponse = await fetch(
            "https://gate.whapi.cloud/messages/text",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${whapiToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: `${waPhone}@s.whatsapp.net`,
                body: convertToWhatsAppFormatting(botMessage),
              }),
              signal: controller.signal,
            }
          );
          
          clearTimeout(timeoutId);

          if (whapiResponse.ok) {
            console.log("Message sent via WhatsApp successfully");
            break;
          } else {
            lastError = await whapiResponse.text();
            console.error(`Whapi send error (attempt ${attempt}/3):`, lastError);
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : "Unknown error";
          console.error(`Whapi fetch error (attempt ${attempt}/3):`, lastError);
        }
        
        // Small backoff before retry
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 800 * attempt));
        }
      }
    } else {
      console.log("Whapi not configured, message saved to DB only");
    }

    // Update lead's last interaction
    await supabase
      .from("leads")
      .update({ last_interaction_at: new Date().toISOString() })
      .eq("id", leadId);

    return new Response(JSON.stringify({ success: true, message: botMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Response error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
