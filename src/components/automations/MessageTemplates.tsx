import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText, Trash2, Edit, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  type: string;
  placeholders: string[];
  is_active: boolean;
  created_at: string;
}

export function MessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState({ name: "", content: "", type: "general" });

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTemplates((data as MessageTemplate[]) || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("שגיאה בטעינת תבניות");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const extractPlaceholders = (content: string): string[] => {
    const matches = content.match(/\{(\w+)\}/g);
    return matches ? [...new Set(matches)] : [];
  };

  const handleSave = async () => {
    if (!form.name || !form.content) {
      toast.error("נא למלא שם ותוכן");
      return;
    }
    try {
      const placeholders = extractPlaceholders(form.content);
      if (editingTemplate) {
        const { error } = await supabase
          .from("message_templates")
          .update({ name: form.name, content: form.content, type: form.type, placeholders, updated_at: new Date().toISOString() })
          .eq("id", editingTemplate.id);
        if (error) throw error;
        toast.success("תבנית עודכנה!");
      } else {
        const { error } = await supabase
          .from("message_templates")
          .insert({ name: form.name, content: form.content, type: form.type, placeholders });
        if (error) throw error;
        toast.success("תבנית נוצרה!");
      }
      setIsDialogOpen(false);
      setEditingTemplate(null);
      setForm({ name: "", content: "", type: "general" });
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("שגיאה בשמירת תבנית");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("message_templates").delete().eq("id", id);
      if (error) throw error;
      toast.success("תבנית נמחקה");
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("שגיאה במחיקת תבנית");
    }
  };

  const openEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setForm({ name: template.name, content: template.content, type: template.type });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingTemplate(null);
    setForm({ name: "", content: "", type: "general" });
    setIsDialogOpen(true);
  };

  return (
    <Card className="theater-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-xl">תבניות הודעה</CardTitle>
          <Button onClick={openNew} size="sm">
            <Plus className="ml-2 h-4 w-4" />
            תבנית חדשה
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm text-muted-foreground">אין תבניות הודעה</p>
            <Button variant="link" onClick={openNew}>צור תבנית ראשונה</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">תוכן</TableHead>
                <TableHead className="text-right">סוג</TableHead>
                <TableHead className="text-right">Placeholders</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    <p className="max-w-[250px] truncate text-sm">{t.content}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.type === "general" ? "כללי" : t.type === "reminder" ? "תזכורת" : t.type === "promotion" ? "קידום" : t.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.placeholders?.map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "עריכת תבנית" : "תבנית חדשה"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם התבנית</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="למשל: ברוכים הבאים" />
            </div>
            <div className="space-y-2">
              <Label>סוג</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">כללי</SelectItem>
                  <SelectItem value="reminder">תזכורת</SelectItem>
                  <SelectItem value="promotion">קידום מכירות</SelectItem>
                  <SelectItem value="follow_up">מעקב</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>תוכן ההודעה</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="שלום {name}, רצינו להזכיר לך על {course_name}..."
                className="min-h-[120px] bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                השתמש ב-{"{name}"}, {"{phone}"}, {"{course_name}"} כ-placeholders
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSave}>{editingTemplate ? "עדכן" : "צור תבנית"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
