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
    const { url, maxDepth = 2, limit = 30, category = "general" } = await req.json();
    
    if (!url) {
      throw new Error("URL is required");
    }

    console.log("Starting deep crawl for URL:", url, "maxDepth:", maxDepth, "limit:", limit, "category:", category);

    // Determine title prefix based on category
    let titlePrefix = "";
    if (category === "course") titlePrefix = "קורס: ";
    else if (category === "show") titlePrefix = "הצגה: ";

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    // Start the crawl job
    const crawlResponse = await fetch("https://api.firecrawl.dev/v1/crawl", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        limit,
        maxDepth,
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
        },
      }),
    });

    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text();
      console.error("Firecrawl crawl error:", errorText);
      throw new Error(`Failed to start crawl: ${crawlResponse.status}`);
    }

    const crawlData = await crawlResponse.json();
    console.log("Crawl started:", crawlData);

    // The crawl API returns a job ID, we need to poll for results
    const crawlId = crawlData.id;
    if (!crawlId) {
      throw new Error("No crawl ID returned");
    }

    // Poll for completion (max 60 seconds)
    let attempts = 0;
    const maxAttempts = 30;
    let crawlResult = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
      
      const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${firecrawlApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      console.log("Crawl status:", statusData.status, "pages:", statusData.data?.length || 0);

      if (statusData.status === "completed") {
        crawlResult = statusData;
        break;
      } else if (statusData.status === "failed") {
        throw new Error("Crawl failed");
      }

      attempts++;
    }

    if (!crawlResult) {
      throw new Error("Crawl timed out - try a smaller limit or depth");
    }

    const pages = crawlResult.data || [];
    console.log("Crawl completed, found pages:", pages.length);

    // Save to database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const insertedItems: { id: string; title: string; url: string }[] = [];
    const baseHostname = new URL(url).hostname;

    for (const page of pages) {
      const markdown = page.markdown || "";
      const pageUrl = page.metadata?.sourceURL || page.url || url;
      const pageTitle = page.metadata?.title || new URL(pageUrl).pathname || "Page";

      if (!markdown || markdown.length < 50) {
        console.log("Skipping page with little content:", pageUrl);
        continue;
      }

      // Limit content to 2000 chars per page
      const content = markdown.substring(0, 2000);

      const { data, error } = await supabase
        .from("knowledge_base")
        .insert({
          title: `${titlePrefix}${pageTitle} (${baseHostname})`.substring(0, 100),
          content: `מקור: ${pageUrl}\n\n${content}`,
        })
        .select("id, title")
        .single();

      if (error) {
        console.error("Error inserting page:", error);
        continue;
      }

      if (data) {
        insertedItems.push({ ...data, url: pageUrl });
      }
    }

    console.log("Inserted items:", insertedItems.length);

    return new Response(
      JSON.stringify({
        success: true,
        message: `נסרקו ${insertedItems.length} עמודים מ-${baseHostname}`,
        items: insertedItems,
        totalPagesFound: pages.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Crawl error:", error);
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
