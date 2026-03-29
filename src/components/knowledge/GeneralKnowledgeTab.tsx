import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  Loader2, 
  Check, 
  AlertCircle, 
  Trash2,
  Globe,
  Pencil,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { UrlScraper } from "./UrlScraper";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  embedding: number[] | null;
  created_at: string;
  source_url?: string;
}

interface GeneralKnowledgeTabProps {
  items: KnowledgeItem[];
  isTraining: boolean;
  onRefresh: () => void;
}

export function GeneralKnowledgeTab({ items, isTraining, onRefresh }: GeneralKnowledgeTabProps) {
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [rescrapingUrl, setRescrapingUrl] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRescrape = async (sourceUrl: string) => {
    if (!sourceUrl) return;
    
    setRescrapingUrl(sourceUrl);
    toast.info("מעדכן תוכן מהמקור...");

    try {
      const itemsToDelete = items.filter(item => item.source_url === sourceUrl);
      for (const item of itemsToDelete) {
        await supabase.from("knowledge_base").delete().eq("id", item.id);
      }

      const { data, error } = await supabase.functions.invoke("scrape-url", {
        body: { url: sourceUrl },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("התוכן עודכן בהצלחה!");
        onRefresh();
      } else {
        throw new Error(data.error || "שגיאה בסריקה מחדש");
      }
    } catch (error) {
      console.error("Rescrape error:", error);
      toast.error("שגיאה בסריקה מחדש");
    } finally {
      setRescrapingUrl(null);
    }
  };

  const handleEditItem = (item: KnowledgeItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditContent(item.content);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from("knowledge_base")
        .update({
          title: editTitle.trim(),
          content: editContent.trim(),
          embedding: null,
        })
        .eq("id", editingItem.id);

      if (error) throw error;

      toast.success("הפריט עודכן בהצלחה!");
      setEditingItem(null);
      onRefresh();
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("שגיאה בעדכון");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("knowledge_base").delete().eq("id", id);
      if (error) throw error;
      toast.success("הפריט נמחק");
      onRefresh();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("שגיאה במחיקה");
    }
  };

  // Filter out items that are synced from courses or shows
  const generalItems = items.filter(item => 
    !item.title.startsWith("קורס: ") && !item.title.startsWith("הצגה: ")
  );

  return (
    <div dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-semibold">ידע כללי</h3>
        <Badge variant="secondary">{generalItems.length} פריטים</Badge>
      </div>

      {/* URL Scraper */}
      <div className="mb-4">
        <UrlScraper category="general" onComplete={onRefresh} compact />
      </div>

      <div className="space-y-3">
        {generalItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm text-muted-foreground">
              אין ידע כללי עדיין. עבור לטאב "הוסף ידע" כדי להתחיל!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {generalItems.map((item) => {
              const isExpanded = expandedIds[item.id] || false;
              const cleanContent = item.content.replace(/^מקור: https?:\/\/[^\n]+\n\n/, "");
              const isLongContent = cleanContent.length > 200;
              
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-border bg-muted/20 p-4 transition-all hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-foreground">{item.title}</h4>
                        {item.source_url && (
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30 shrink-0">
                            <Globe className="ml-1 h-3 w-3" />
                            נסרק
                          </Badge>
                        )}
                        {item.embedding ? (
                          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shrink-0">
                            <Check className="ml-1 h-3 w-3" />
                            מאומן
                          </Badge>
                        ) : isTraining ? (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 shrink-0">
                            <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                            מאמן...
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30 shrink-0">
                            <AlertCircle className="ml-1 h-3 w-3" />
                            לא מאומן
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      {item.source_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRescrape(item.source_url!)}
                          disabled={rescrapingUrl === item.source_url}
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          title="סריקה מחדש"
                        >
                          {rescrapingUrl === item.source_url ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditItem(item)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="עריכה"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="מחיקה"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className={cn(
                      "text-sm text-foreground/80 text-right whitespace-pre-wrap break-words",
                      !isExpanded && isLongContent && "line-clamp-3"
                    )}>
                      {cleanContent}
                    </p>
                    {isLongContent && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleExpanded(item.id)}
                        className="h-auto p-0 mt-2 text-xs text-primary"
                      >
                        {isExpanded ? "הצג פחות ▲" : "הצג עוד ▼"}
                      </Button>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-border/50 flex items-center gap-3 flex-wrap">
                    <p className="text-xs text-muted-foreground/70">
                      נוסף {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: he })}
                    </p>
                    {item.source_url && (
                      <a 
                        href={item.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        מקור
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">עריכת פריט</DialogTitle>
            <DialogDescription>
              ערוך את המידע ושמור. לאחר העריכה יש לאמן מחדש.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">כותרת</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">תוכן</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[300px] bg-muted/50"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                ביטול
              </Button>
              <Button onClick={handleSaveEdit} className="bg-primary hover:bg-primary/90">
                <Check className="ml-2 h-4 w-4" />
                שמור שינויים
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
