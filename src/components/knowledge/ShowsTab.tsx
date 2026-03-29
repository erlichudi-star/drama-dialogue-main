import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Ticket, Plus, RefreshCw, Loader2, Globe, Trash2, Check, AlertCircle } from "lucide-react";
import { ShowForm, type ShowFormData } from "@/components/shows/ShowForm";
import { ShowsTable } from "@/components/shows/ShowsTable";
import { useShows } from "@/hooks/useShows";
import { Tables } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UrlScraper } from "./UrlScraper";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface ShowsTabProps {
  onSyncComplete?: () => void;
}

export function ShowsTab({ onSyncComplete }: ShowsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Tables<"shows"> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [scrapedItems, setScrapedItems] = useState<Array<{ id: string; title: string; content: string; embedding: unknown; created_at: string }>>([]);

  const {
    shows,
    isLoading,
    createShow,
    updateShow,
    deleteShow,
    isCreating,
    isUpdating,
    isDeleting,
  } = useShows();

  // Fetch scraped show items from knowledge_base
  const fetchScrapedItems = async () => {
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .like("title", "הצגה:%")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setScrapedItems(data);
    }
  };

  useEffect(() => {
    fetchScrapedItems();
  }, []);

  const handleRefresh = () => {
    fetchScrapedItems();
    onSyncComplete?.();
  };

  const handleDeleteScrapedItem = async (id: string) => {
    const { error } = await supabase.from("knowledge_base").delete().eq("id", id);
    if (error) {
      toast.error("שגיאה במחיקה");
    } else {
      toast.success("פריט נמחק");
      fetchScrapedItems();
    }
  };

  const handleOpenAdd = () => {
    setEditingShow(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (show: Tables<"shows">) => {
    setEditingShow(show);
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: ShowFormData) => {
    if (editingShow) {
      updateShow({ id: editingShow.id, ...data }, {
        onSuccess: () => setIsDialogOpen(false),
      });
    } else {
      createShow(data, {
        onSuccess: () => setIsDialogOpen(false),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteShow(id);
  };

  const syncShowsToKnowledge = async () => {
    setIsSyncing(true);
    
    try {
      let syncedCount = 0;
      
      for (const show of shows) {
        const content = `
הצגה: ${show.name}
מיקום: ${show.venue || 'לא צוין'}
משך: ${show.duration_minutes ? show.duration_minutes + ' דקות' : 'לא צוין'}
הגבלת גיל: ${show.age_restriction || 'אין הגבלה'}
מחיר כרטיס: ${show.price ? show.price + ' ש"ח' : 'לא צוין'}
מחיר VIP: ${show.vip_price ? show.vip_price + ' ש"ח' : 'לא זמין'}
סטטוס: ${show.is_active ? 'פעיל' : 'לא פעיל'}
תיאור: ${show.description || 'אין תיאור'}
קישור לכרטיסים: ${show.ticket_link || 'אין'}
        `.trim();
        
        const title = `הצגה: ${show.name}`;
        
        // Check if entry already exists
        const { data: existing } = await supabase
          .from("knowledge_base")
          .select("id")
          .eq("title", title)
          .maybeSingle();
        
        if (existing) {
          // Update existing
          await supabase
            .from("knowledge_base")
            .update({ content, embedding: null })
            .eq("id", existing.id);
        } else {
          // Insert new
          await supabase
            .from("knowledge_base")
            .insert({ title, content });
        }
        
        syncedCount++;
      }
      
      toast.success(`${syncedCount} הצגות סונכרנו לבסיס הידע!`);
      onSyncComplete?.();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("שגיאה בסנכרון ההצגות");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">הצגות</h3>
          <Badge variant="secondary">{shows.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={syncShowsToKnowledge}
            disabled={isSyncing || shows.length === 0}
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            {isSyncing ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="ml-2 h-4 w-4" />
            )}
            סנכרן לבסיס ידע
          </Button>
          <Button onClick={handleOpenAdd} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            הוסף הצגה
          </Button>
        </div>
      </div>

      {/* URL Scraper for shows */}
      <div className="mb-4">
        <UrlScraper category="show" onComplete={handleRefresh} compact />
      </div>

      {/* Scraped Knowledge Items */}
      {scrapedItems.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">ידע נסרק על הצגות</h4>
              <Badge variant="secondary" className="text-xs">{scrapedItems.length} פריטים</Badge>
            </div>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {scrapedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded bg-background/50 border border-border/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.embedding ? (
                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        <Check className="ml-1 h-3 w-3" />
                        מאומן
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                        <AlertCircle className="ml-1 h-3 w-3" />
                        לא מאומן
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    נוסף {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: he })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteScrapedItem(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="w-full">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <ShowsTable
              shows={shows}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingShow ? "עריכת הצגה" : "הוספת הצגה חדשה"}
            </DialogTitle>
          </DialogHeader>
          <ShowForm
            show={editingShow}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            isLoading={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
