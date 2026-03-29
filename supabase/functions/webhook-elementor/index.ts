import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type GlobalWithEdgeRuntime = typeof globalThis & {
  EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void };
};

// waitUntil helper (EdgeRuntime is available in production, but not always typed during build)
const waitUntil = (promise: Promise<unknown>) => {
  const er = (globalThis as GlobalWithEdgeRuntime).EdgeRuntime;
  return er?.waitUntil ? er.waitUntil(promise) : promise;
};

// Helper to detect interest from form name or page URL
function detectInterest(formName: string, pageUrl: string): { type: string; formName: string } {
  const combined = `${formName} ${pageUrl}`.toLowerCase();
  
  // Extended course keywords - includes common class types
  const courseKeywords = [
    "קורס", "לימוד", "סדנה", "סדנא", "workshop", "course", "class", "registration",
    "אימפרוביזציה", "אימפרו", "improv", "משחק", "דרמה", "תיאטרון", "בובות",
    "הרשמה", "שיעור", "חוג", "אולפן"
  ];
  for (const keyword of courseKeywords) {
    if (combined.includes(keyword)) {
      return { type: "course", formName };
    }
  }
  
  const showKeywords = ["הצגה", "מופע", "הופעה", "show", "theater", "כרטיס", "ticket", "הזמנת מקום"];
  for (const keyword of showKeywords) {
    if (combined.includes(keyword)) {
      return { type: "show", formName };
    }
  }
  
  return { type: "general", formName };
}

// Helper to parse URL-encoded form data
function parseFormData(formDataString: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pairs = formDataString.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key) {
      result[decodeURIComponent(key)] = decodeURIComponent(value || "").replace(/\+/g, " ");
    }
  }
  return result;
}

// Normalize phone for WhatsApp JID (best-effort, defaults to Israel if local format)
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get content type to determine how to parse the body
    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, unknown>;

    const rawBody = await req.text();

    if (contentType.includes("application/json")) {
      // Some Elementor setups incorrectly send URL-encoded bodies with JSON content-type
      try {
        body = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        body = parseFormData(rawBody);
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      body = parseFormData(rawBody);
    } else {
      // Try JSON first, fallback to URL-encoded
      try {
        body = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        body = parseFormData(rawBody);
      }
    }

    console.log("Elementor webhook received:", JSON.stringify(body));

    // Elementor sends form data - extract fields
    // Support both English and Hebrew field names
    const name = body.name || body.full_name || body["שם"] || body["שם מלא"] || 
                 body.fields?.name || body.fields?.full_name || "New Lead";
    const phone = body.phone || body.tel || body["טלפון"] || body["נייד"] || body["מספר טלפון"] ||
                  body.fields?.phone || body.fields?.tel || "";
    const email = body.email || body["אימייל"] || body["מייל"] || body["דואר אלקטרוני"] ||
                  body.fields?.email || null;
    const formName = body.form_name || body.form_id || "";
    const pageUrl = body.page_url || body.referrer || "";
    const pageTitle = body.page_title || body["כותרת"] || formName; // Use form_name as fallback for page context

    if (!phone) {
      console.log("No phone number found, skipping");
      return new Response(JSON.stringify({ success: true, message: "No phone number" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect interest from form/page
    const interestResult = detectInterest(formName, pageUrl);
    const interest = interestResult.type;
    console.log("Detected interest:", interest, "from form:", formName);

    // Check if lead already exists
    const cleanPhone = phone.replace(/\D/g, "");
    const waPhone = normalizeWhatsAppPhone(cleanPhone);

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .or(`phone.eq.${phone},phone.eq.${cleanPhone},phone.eq.${waPhone}`)
      .single();

    let leadId: string;

    if (existingLead) {
      leadId = existingLead.id;
      // Store both interest type and the specific context (form/page name)
      const interestWithContext = pageTitle ? `${interest}:${pageTitle}` : interest;
      await supabase
        .from("leads")
        .update({
          interest: interestWithContext,
          last_interaction_at: new Date().toISOString(),
        })
        .eq("id", leadId);
      console.log("Existing lead updated:", leadId, "interest:", interestWithContext);
    } else {
      // Create new lead with specific interest context
      const interestWithContext = pageTitle ? `${interest}:${pageTitle}` : interest;
      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          name,
          phone: cleanPhone,
          email,
          source: "Website",
          status: "New",
          interest: interestWithContext,
        })
        .select("id")
        .single();

      if (leadError) {
        console.error("Error creating lead:", leadError);
        throw leadError;
      }

      leadId = newLead.id;
      console.log("New lead created:", leadId);

      // Create notification
      await supabase.from("notifications").insert({
        type: "new_lead",
        title: `ליד חדש מהאתר: ${name}`,
        message: `התעניינות: ${interest === "course" ? "קורס" : interest === "show" ? "הצגה" : "כללי"}`,
        link: `/chat?lead=${leadId}`,
      });

      // Log activity
      await supabase.from("activities").insert({
        lead_id: leadId,
        type: "lead_created",
        description: `ליד חדש נוצר מטופס אלמנטור: ${formName || "ללא שם"}`,
      });
    }

    // Run WhatsApp welcome message in background so Elementor won't timeout
    waitUntil(
      (async () => {
        try {
          // Get Whapi settings
          const { data: settings } = await supabase
            .from("settings")
            .select("key, value")
            .eq("key", "whapi_token")
            .single();

          const whapiToken = settings?.value;
          if (!whapiToken) return;

          let welcomeMessage: string;

          if (interest === "course") {
            // Use the form name/page title as the specific course interest
            const courseContext = pageTitle || formName;
            
            // Try to find a matching course by name
            const { data: matchingCourses } = await supabase
              .from("courses")
              .select("name, price, start_date")
              .eq("is_active", true)
              .ilike("name", `%${courseContext.split(" ")[0]}%`)
              .limit(1);

            const matchedCourse = matchingCourses?.[0];
            
            if (matchedCourse) {
              const startDate = new Date(matchedCourse.start_date).toLocaleDateString("he-IL");
              welcomeMessage = `🎭 היי ${name}!

שמחים שמילאת את הטופס עבור *${courseContext}*!

📅 תאריך פתיחה: ${startDate}
💰 מחיר: ${matchedCourse.price}₪

רוצה לשמוע עוד פרטים או להירשם?`;
            } else {
              // Course not in system, but we know what they're interested in
              welcomeMessage = `🎭 היי ${name}!

שמחים שהתעניינת ב*${courseContext}*!

אשמח לספר לך עוד פרטים על הקורס - מה תרצה לדעת?`;
            }
          } else if (interest === "show") {
            const showContext = pageTitle || formName;
            
            // Try to find a matching show
            const { data: matchingShows } = await supabase
              .from("shows")
              .select("id, name, price")
              .eq("is_active", true)
              .ilike("name", `%${showContext.split(" ")[0]}%`)
              .limit(1);

            const matchedShow = matchingShows?.[0];

            if (matchedShow) {
              // Get upcoming performances
              const { data: performances } = await supabase
                .from("show_performances")
                .select("performance_date, venue, seats_available")
                .eq("show_id", matchedShow.id)
                .eq("is_cancelled", false)
                .gte("performance_date", new Date().toISOString())
                .order("performance_date", { ascending: true })
                .limit(3);

              let datesInfo = "";
              if (performances && performances.length > 0) {
                const datesList = performances.map(p => {
                  const d = new Date(p.performance_date);
                  return d.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" });
                }).join(", ");
                datesInfo = `\n📅 תאריכים קרובים: ${datesList}`;
              }

              welcomeMessage = `🎭 היי ${name}!

שמחים שהתעניינת ב*"${matchedShow.name}"*!
🎫 כרטיסים מ-${matchedShow.price}₪${datesInfo}

לאיזה תאריך תרצה להזמין?`;
            } else {
              welcomeMessage = `🎭 היי ${name}!

שמחים שהתעניינת ב*${showContext}*!
אשמח לעזור עם פרטים והזמנת כרטיסים 🎫`;
            }
          } else {
            const context = pageTitle || formName || "האתר";
            welcomeMessage = `🎭 שלום ${name}!

תודה שפנית אלינו דרך ${context}!

איך אוכל לעזור לך?
• מידע על קורסים
• לוח הצגות וכרטיסים
• כל שאלה אחרת`;
          }

          console.log("Preparing welcome message for lead:", leadId, "to:", waPhone);

          const sendOnce = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);

            try {
              const res = await fetch("https://gate.whapi.cloud/messages/text", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${whapiToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: `${waPhone}@s.whatsapp.net`,
                  body: welcomeMessage,
                }),
                signal: controller.signal,
              });

              const text = await res.text().catch(() => "");
              return { ok: res.ok, status: res.status, text };
            } finally {
              clearTimeout(timeoutId);
            }
          };

          let lastError = "";
          for (let attempt = 1; attempt <= 3; attempt++) {
            const result = await sendOnce();
            if (result.ok) {
              await supabase.from("messages").insert({
                lead_id: leadId,
                sender: "bot",
                content: welcomeMessage,
              });

              await supabase
                .from("leads")
                .update({ status: "Chatting", last_interaction_at: new Date().toISOString() })
                .eq("id", leadId);

              console.log("Welcome message sent successfully");
              return;
            }

            lastError = `status=${result.status} body=${result.text}`;
            console.error(`Whapi send failed (attempt ${attempt}/3):`, lastError);

            // small backoff before retry
            await new Promise((r) => setTimeout(r, 800 * attempt));
          }

          // Surface the failure inside the app (so you don't need to check logs)
          await supabase.from("notifications").insert({
            type: "whapi_error",
            title: "נכשל שליחת וואטסאפ לליד",
            message: `לא הצלחתי לשלוח הודעת פתיחה ל-${name} (${phone}). ${lastError}`,
            link: `/chat?lead=${leadId}`,
          });
        } catch (err) {
          console.error("Welcome message background error:", err);
        }
      })(),
    );

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
