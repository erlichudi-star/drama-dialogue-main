import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Trash2, Check, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  embedding: number[] | null;
  created_at: string;
}

interface KnowledgeListProps {
  items: KnowledgeItem[];
  onDelete: (id: string) => void;
  onRescrape?: (sourceUrl: string) => void;
  isTraining?: boolean;
  rescrapingUrl?: string | null;
}

export function KnowledgeList({ items, onDelete, isTraining }: KnowledgeListProps) {
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("knowledge_base").delete().eq("id", id);
      if (error) throw error;
      onDelete(id);
      toast.success("Knowledge item deleted");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  return (
    <Card className="theater-card">
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Knowledge Base
          <Badge variant="secondary" className="ml-2">
            {items.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                No knowledge added yet. Start adding content!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-lg border border-border bg-muted/20 p-4 transition-all hover:border-primary/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">
                          {item.title}
                        </h4>
                        {item.embedding ? (
                          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            <Check className="mr-1 h-3 w-3" />
                            Trained
                          </Badge>
                        ) : isTraining ? (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Training...
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Not Trained
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {item.content}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground/70">
                        Added {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
