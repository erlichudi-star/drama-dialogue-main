import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Sparkles, 
  Loader2, 
  Upload,
  FileSpreadsheet
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { UrlScraper } from "./UrlScraper";

interface AddKnowledgeTabProps {
  onAdd: () => void;
}

export function AddKnowledgeTab({ onAdd }: AddKnowledgeTabProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("נא למלא כותרת ותוכן");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("knowledge_base").insert({
        title: title.trim(),
        content: content.trim(),
      });

      if (error) throw error;

      toast.success("הידע נוסף בהצלחה!");
      setTitle("");
      setContent("");
      onAdd();
    } catch (error) {
      console.error("Error adding knowledge:", error);
      toast.error("שגיאה בהוספת הידע");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      let totalAdded = 0;

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) continue;

        for (const row of jsonData) {
          const rowData = row as Record<string, unknown>;
          const rowText = Object.entries(rowData)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");

          const firstValue = Object.values(rowData)[0];
          const itemTitle = firstValue ? String(firstValue) : `${sheetName} - שורה ${totalAdded + 1}`;

          await supabase.from("knowledge_base").insert({
            title: itemTitle.substring(0, 100),
            content: rowText,
          });

          totalAdded++;
        }
      }

      toast.success(`נוספו ${totalAdded} פריטים מהקובץ!`);
      onAdd();
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("שגיאה בעיבוד הקובץ");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Manual Add Form */}
      <Card className="border-border bg-muted/10">
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            הוספת ידע ידנית
          </CardTitle>
          <CardDescription>
            הוסף מידע על בית הספר לתיאטרון כדי שה-AI ילמד
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">כותרת</Label>
              <Input
                id="title"
                placeholder="לדוגמה: לוח קורסי משחק"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">תוכן</Label>
              <Textarea
                id="content"
                placeholder="הדבק או הקלד את המידע כאן..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] bg-muted/50"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="ml-2 h-4 w-4" />
              )}
              הוסף לבסיס הידע
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* URL Scraping with Category Selector */}
      <UrlScraper 
        category="general" 
        showCategorySelector 
        onComplete={onAdd} 
      />

      {/* Excel Upload */}
      <Card className="border-border bg-muted/10">
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            העלאת קובץ אקסל
          </CardTitle>
          <CardDescription>
            העלה קובץ אקסל עם מידע על קורסים, הצגות ומחירים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full border-primary/30 text-primary hover:bg-primary/10"
          >
            {isUploading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="ml-2 h-4 w-4" />
            )}
            בחר קובץ אקסל
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
