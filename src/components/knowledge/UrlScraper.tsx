import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Loader2, Link, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ScraperCategory = "general" | "course" | "show";

interface UrlScraperProps {
  onComplete: () => void;
  category: ScraperCategory;
  showCategorySelector?: boolean;
  compact?: boolean;
}

export function UrlScraper({ 
  onComplete, 
  category, 
  showCategorySelector = false,
  compact = false 
}: UrlScraperProps) {
  const [url, setUrl] = useState("");
  const [deepCrawl, setDeepCrawl] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ScraperCategory>(category);
  const [isScraping, setIsScraping] = useState(false);

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error("נא להזין כתובת URL");
      return;
    }

    try {
      new URL(url);
    } catch {
      toast.error("כתובת URL לא תקינה");
      return;
    }

    setIsScraping(true);
    
    if (deepCrawl) {
      toast.info("מתחיל סריקה עמוקה... זה עשוי לקחת עד דקה");
    } else {
      toast.info("סורק את העמוד...");
    }

    try {
      const functionName = deepCrawl ? "crawl-url" : "scrape-url";
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          url: url.trim(),
          category: selectedCategory,
          ...(deepCrawl ? { maxDepth: 2, limit: 30 } : {})
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        setUrl("");
        onComplete();
      } else {
        throw new Error(data.error || "שגיאה בסריקה");
      }
    } catch (error) {
      console.error("Scrape error:", error);
      toast.error(deepCrawl ? "שגיאה בסריקה העמוקה" : "שגיאה בסריקת ה-URL");
    } finally {
      setIsScraping(false);
    }
  };

  const getCategoryLabel = () => {
    switch (selectedCategory) {
      case "course": return "קורסים";
      case "show": return "הצגות";
      default: return "ידע כללי";
    }
  };

  if (compact) {
    return (
      <div dir="rtl" className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
        <Globe className="h-4 w-4 text-primary shrink-0" />
        <Input
          placeholder="https://www.example.com/page"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="bg-muted/50 flex-1"
          dir="ltr"
        />
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            id={`deep-crawl-${category}`}
            checked={deepCrawl}
            onCheckedChange={setDeepCrawl}
          />
          <Label htmlFor={`deep-crawl-${category}`} className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
            עמוק
          </Label>
        </div>
        <Button
          onClick={handleScrape}
          disabled={isScraping || !url.trim()}
          size="sm"
          className="bg-primary hover:bg-primary/90 shrink-0"
        >
          {isScraping ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : deepCrawl ? (
            <Layers className="h-4 w-4" />
          ) : (
            <Link className="h-4 w-4" />
          )}
          <span className="mr-2">סרוק</span>
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-border bg-muted/10" dir="rtl">
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          סריקת עמוד מהאינטרנט
        </CardTitle>
        <CardDescription>
          הזן כתובת URL והמערכת תסרוק ותייבא את המידע
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <div>
              <Label htmlFor="deep-crawl-full" className="text-sm font-medium cursor-pointer">
                סריקה עמוקה
              </Label>
              <p className="text-xs text-muted-foreground">
                סרוק גם עמודים פנימיים שמקושרים מהעמוד
              </p>
            </div>
          </div>
          <Switch
            id="deep-crawl-full"
            checked={deepCrawl}
            onCheckedChange={setDeepCrawl}
          />
        </div>

        {showCategorySelector && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-3">
            <Label className="text-sm font-medium">שייך לקטגוריה:</Label>
            <RadioGroup 
              value={selectedCategory} 
              onValueChange={(value) => setSelectedCategory(value as ScraperCategory)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="general" id="cat-general" />
                <Label htmlFor="cat-general" className="cursor-pointer text-sm">ידע כללי</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="course" id="cat-course" />
                <Label htmlFor="cat-course" className="cursor-pointer text-sm">קורסים</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="show" id="cat-show" />
                <Label htmlFor="cat-show" className="cursor-pointer text-sm">הצגות</Label>
              </div>
            </RadioGroup>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            placeholder="https://www.example.com/page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-muted/50"
            dir="ltr"
          />
          <Button
            onClick={handleScrape}
            disabled={isScraping || !url.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isScraping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : deepCrawl ? (
              <Layers className="h-4 w-4" />
            ) : (
              <Link className="h-4 w-4" />
            )}
            <span className="mr-2">סרוק</span>
          </Button>
        </div>

        {deepCrawl && (
          <p className="text-xs text-amber-400">
            ⚠️ סריקה עמוקה עשויה לקחת עד דקה ותסרוק עד 30 עמודים
          </p>
        )}

        {showCategorySelector && (
          <p className="text-xs text-muted-foreground">
            התוכן יישמר עם תחילית "{getCategoryLabel()}" כדי שהבוט יזהה אותו
          </p>
        )}
      </CardContent>
    </Card>
  );
}
