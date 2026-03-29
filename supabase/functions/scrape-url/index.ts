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
    const { url, category = "general" } = await req.json();
    
    if (!url) {
      throw new Error("URL is required");
    }

    console.log("Scraping URL:", url, "Category:", category);

    // Determine title prefix based on category
    let titlePrefix = "";
    if (category === "course") titlePrefix = "קורס: ";
    else if (category === "show") titlePrefix = "הצגה: ";

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    // Call Firecrawl API to scrape the URL
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error("Firecrawl error:", errorText);
      throw new Error(`Failed to scrape URL: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json();
    console.log("Scrape successful, data length:", scrapeData.data?.markdown?.length || 0);

    const markdown = scrapeData.data?.markdown || "";
    const title = scrapeData.data?.metadata?.title || new URL(url).hostname;

    if (!markdown) {
      throw new Error("No content found on page");
    }

    // Parse the content into sections
    const sections: { title: string; content: string; sourceUrl: string }[] = [];

    // Split by headers
    const lines = markdown.split("\n");
    let currentTitle = title;
    let currentContent: string[] = [];

    for (const line of lines) {
      // Check for headers (## or ###)
      const headerMatch = line.match(/^#{1,3}\s+(.+)/);
      if (headerMatch) {
        // Save previous section if it has content
        if (currentContent.length > 0) {
          const content = currentContent.join("\n").trim();
          if (content.length > 50) { // Only save substantial content
            sections.push({
              title: currentTitle.substring(0, 100),
              content: content.substring(0, 2000),
              sourceUrl: url,
            });
          }
        }
        currentTitle = headerMatch[1].replace(/\[|\]|\(.*?\)/g, "").trim();
        currentContent = [];
      } else if (line.trim()) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentContent.length > 0) {
      const content = currentContent.join("\n").trim();
      if (content.length > 50) {
        sections.push({
          title: currentTitle.substring(0, 100),
          content: content.substring(0, 2000),
          sourceUrl: url,
        });
      }
    }

    // If no sections found, save the whole page as one item
    if (sections.length === 0 && markdown.length > 50) {
      sections.push({
        title: title.substring(0, 100),
        content: markdown.substring(0, 2000),
        sourceUrl: url,
      });
    }

    console.log("Parsed sections:", sections.length);

    // Save to database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const insertedItems: { id: string; title: string }[] = [];

    for (const section of sections) {
      const { data, error } = await supabase
        .from("knowledge_base")
        .insert({
          title: `${titlePrefix}${section.title} (${new URL(url).hostname})`,
          content: `מקור: ${section.sourceUrl}\n\n${section.content}`,
        })
        .select("id, title")
        .single();

      if (error) {
        console.error("Error inserting section:", error);
        continue;
      }

      if (data) {
        insertedItems.push(data);
      }
    }

    console.log("Inserted items:", insertedItems.length);

    return new Response(
      JSON.stringify({
        success: true,
        message: `נסרקו ${insertedItems.length} פריטים מ-${url}`,
        items: insertedItems,
        rawSectionsCount: sections.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Scrape error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
