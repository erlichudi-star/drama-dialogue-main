import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  Brain,
  BookOpen,
  GraduationCap,
  Ticket,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GeneralKnowledgeTab } from "@/components/knowledge/GeneralKnowledgeTab";
import { CoursesTab } from "@/components/knowledge/CoursesTab";
import { ShowsTab } from "@/components/knowledge/ShowsTab";
import { AddKnowledgeTab } from "@/components/knowledge/AddKnowledgeTab";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  embedding: number[] | null;
  created_at: string;
  source_url?: string;
}

export default function Knowledge() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isTraining, setIsTraining] = useState(false);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching knowledge:", error);
      return;
    }

    setItems(
      (data || []).map((item) => {
        const sourceMatch = item.content.match(/^מקור: (https?:\/\/[^\n]+)/);
        return {
          ...item,
          embedding: item.embedding ? (item.embedding as unknown as number[]) : null,
          source_url: sourceMatch ? sourceMatch[1] : undefined,
        };
      })
    );
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleTrain = async () => {
    const untrainedItems = items.filter((item) => !item.embedding);
    if (untrainedItems.length === 0) {
      toast.info("כל הפריטים כבר מאומנים!");
      return;
    }

    setIsTraining(true);
    toast.info(`מאמן ${untrainedItems.length} פריטים...`);

    try {
      const { error } = await supabase.functions.invoke("train-knowledge", {
        body: { itemIds: untrainedItems.map((i) => i.id) },
      });

      if (error) throw error;

      toast.success("האימון הושלם!");
      fetchItems();
    } catch (error) {
      console.error("Training error:", error);
      toast.error("האימון נכשל. ודא שמפתחות ה-API מוגדרים.");
    } finally {
      setIsTraining(false);
    }
  };

  const untrainedCount = items.filter((item) => !item.embedding).length;

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              בסיס ידע
            </h1>
            <p className="mt-1 text-muted-foreground">
              אמן את ה-AI עם מידע על בית הספר לתיאטרון
            </p>
          </div>
          <div className="flex items-center gap-3">
            {untrainedCount > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                <AlertCircle className="ml-1 h-3 w-3" />
                {untrainedCount} לא מאומנים
              </Badge>
            )}
            <Button
              onClick={handleTrain}
              disabled={isTraining || untrainedCount === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isTraining ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Brain className="ml-2 h-4 w-4" />
              )}
              אמן AI
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="theater-card theater-glow p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                איך זה עובד
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                הוסף תוכן על בית הספר לתיאטרון - קורסים, הצגות, מחירי כרטיסים, שאלות נפוצות - ולחץ &quot;אמן AI&quot; כדי ליצור embeddings. 
                ה-AI ישתמש בידע הזה כדי לענות לשאלות לקוחות בצורה חכמה.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="general" className="flex items-center gap-2 py-3">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">כללי</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2 py-3">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">קורסים</span>
            </TabsTrigger>
            <TabsTrigger value="shows" className="flex items-center gap-2 py-3">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">הצגות</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2 py-3">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">הוסף ידע</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="general" className="mt-0 focus-visible:ring-0">
              <div className="theater-card p-6 overflow-visible">
                <GeneralKnowledgeTab 
                  items={items} 
                  isTraining={isTraining} 
                  onRefresh={fetchItems} 
                />
              </div>
            </TabsContent>
            
            <TabsContent value="courses" className="mt-0 focus-visible:ring-0">
              <div className="theater-card p-6 overflow-visible">
                <CoursesTab onSyncComplete={fetchItems} />
              </div>
            </TabsContent>
            
            <TabsContent value="shows" className="mt-0 focus-visible:ring-0">
              <div className="theater-card p-6 overflow-visible">
                <ShowsTab onSyncComplete={fetchItems} />
              </div>
            </TabsContent>
            
            <TabsContent value="add" className="mt-0 focus-visible:ring-0">
              <div className="theater-card p-6 overflow-visible">
                <AddKnowledgeTab onAdd={fetchItems} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
