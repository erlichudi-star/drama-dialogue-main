import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Zap, Trash2, Edit, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface AutomationRule {
  id: string;
  name: string;
  trigger_type: string;
  condition: Record<string, unknown>;
  action_type: string;
  template_id: string | null;
  custom_message: string | null;
  delay_minutes: number;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  new_lead: "ליד חדש נכנס",
  no_response: "ליד לא הגיב",
  enrollment: "לקוח נרשם לקורס",
  status_change: "שינוי סטטוס ליד",
};

const ACTION_LABELS: Record<string, string> = {
  send_message: "שלח הודעת WhatsApp",
  create_follow_up: "צור פולואפ",
  notify: "צור התראה",
};

/** Radix Select does not support empty string as value — use sentinels and map on save */
const SOURCE_ALL = "__all_sources__";
const TEMPLATE_NONE = "__no_template__";

export function AutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const [form, setForm] = useState({
    name: "",
    trigger_type: "new_lead",
    action_type: "send_message",
    template_id: TEMPLATE_NONE,
    custom_message: "",
    delay_minutes: 0,
    condition_hours: 48,
    condition_source: SOURCE_ALL,
    condition_status: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    const [rulesRes, templatesRes] = await Promise.all([
      supabase.from("automation_rules").select("*").order("created_at", { ascending: false }),
      supabase.from("message_templates").select("id, name, content").eq("is_active", true),
    ]);
    setRules((rulesRes.data as AutomationRule[]) || []);
    setTemplates(templatesRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingRule(null);
    setForm({
      name: "",
      trigger_type: "new_lead",
      action_type: "send_message",
      template_id: TEMPLATE_NONE,
      custom_message: "",
      delay_minutes: 0,
      condition_hours: 48,
      condition_source: SOURCE_ALL,
      condition_status: "",
    });
    setIsDialogOpen(true);
  };

  const openEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    const cond = rule.condition as Record<string, unknown>;
    const source = (cond.source as string) || "";
    setForm({
      name: rule.name,
      trigger_type: rule.trigger_type,
      action_type: rule.action_type,
      template_id: rule.template_id || TEMPLATE_NONE,
      custom_message: rule.custom_message || "",
      delay_minutes: rule.delay_minutes,
      condition_hours: (cond.hours as number) || 48,
      condition_source: source || SOURCE_ALL,
      condition_status: (cond.status as string) || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("נא להזין שם לכלל"); return; }

    const condition: Record<string, string | number> = {};
    if (form.trigger_type === "no_response") condition.hours = form.condition_hours;
    if (form.condition_source && form.condition_source !== SOURCE_ALL) {
      condition.source = form.condition_source;
    }
    if (form.condition_status) condition.status = form.condition_status;

    const templateId =
      form.template_id && form.template_id !== TEMPLATE_NONE ? form.template_id : null;

    const payload: TablesInsert<"automation_rules"> = {
      name: form.name,
      trigger_type: form.trigger_type,
      action_type: form.action_type,
      template_id: templateId,
      custom_message: form.custom_message || null,
      delay_minutes: form.delay_minutes,
      condition: condition as Json,
    };

    if (editingRule) {
      const updatePayload: TablesUpdate<"automation_rules"> = payload;
      const { error } = await supabase.from("automation_rules").update(updatePayload).eq("id", editingRule.id);
      if (error) { toast.error("שגיאה בעדכון"); return; }
      toast.success("כלל עודכן בהצלחה");
    } else {
      const { error } = await supabase.from("automation_rules").insert(payload);
      if (error) { toast.error("שגיאה ביצירה"); return; }
      toast.success("כלל נוצר בהצלחה");
    }
    setIsDialogOpen(false);
    fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("automation_rules").update({ is_active: !current }).eq("id", id);
    setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r));
    toast.success(!current ? "כלל הופעל" : "כלל הושבת");
  };

  const deleteRule = async (id: string) => {
    await supabase.from("automation_rules").delete().eq("id", id);
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success("כלל נמחק");
  };

  if (isLoading) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card className="theater-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-xl">כללי אוטומציה</CardTitle>
              <CardDescription>הגדר כללים שמפעילים פעולות אוטומטיות</CardDescription>
            </div>
            <Button onClick={openCreate} size="sm">
              <Plus className="ml-2 h-4 w-4" />
              כלל חדש
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Zap className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">אין כללי אוטומציה</p>
              <Button variant="link" onClick={openCreate}>צור כלל ראשון</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">טריגר</TableHead>
                  <TableHead className="text-right">פעולה</TableHead>
                  <TableHead className="text-right">השהיה</TableHead>
                  <TableHead className="text-right">פעיל</TableHead>
                  <TableHead className="text-right">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        {TRIGGER_LABELS[rule.trigger_type] || rule.trigger_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ACTION_LABELS[rule.action_type] || rule.action_type}
                    </TableCell>
                    <TableCell className="text-sm">
                      {rule.delay_minutes > 0 ? `${rule.delay_minutes} דקות` : "מיידי"}
                    </TableCell>
                    <TableCell>
                      <Switch checked={rule.is_active} onCheckedChange={() => toggleActive(rule.id, rule.is_active)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
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
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? "עריכת כלל" : "יצירת כלל אוטומציה"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם הכלל</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="למשל: הודעת ברוכים הבאים לליד חדש" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>טריגר</Label>
                <Select value={form.trigger_type} onValueChange={v => setForm({ ...form, trigger_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_lead">ליד חדש נכנס</SelectItem>
                    <SelectItem value="no_response">ליד לא הגיב</SelectItem>
                    <SelectItem value="enrollment">לקוח נרשם לקורס</SelectItem>
                    <SelectItem value="status_change">שינוי סטטוס ליד</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>פעולה</Label>
                <Select value={form.action_type} onValueChange={v => setForm({ ...form, action_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_message">שלח WhatsApp</SelectItem>
                    <SelectItem value="create_follow_up">צור פולואפ</SelectItem>
                    <SelectItem value="notify">צור התראה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.trigger_type === "no_response" && (
              <div className="space-y-2">
                <Label>שעות ללא תגובה</Label>
                <Input type="number" value={form.condition_hours} onChange={e => setForm({ ...form, condition_hours: parseInt(e.target.value) || 0 })} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>מקור (אופציונלי)</Label>
                <Select value={form.condition_source} onValueChange={v => setForm({ ...form, condition_source: v })}>
                  <SelectTrigger><SelectValue placeholder="כל המקורות" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SOURCE_ALL}>כל המקורות</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Website">אתר</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Manual">ידני</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>השהיה (דקות)</Label>
                <Input type="number" value={form.delay_minutes} onChange={e => setForm({ ...form, delay_minutes: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            {templates.length > 0 && (
              <div className="space-y-2">
                <Label>תבנית הודעה</Label>
                <Select value={form.template_id} onValueChange={v => setForm({ ...form, template_id: v })}>
                  <SelectTrigger><SelectValue placeholder="בחר תבנית..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TEMPLATE_NONE}>ללא תבנית</SelectItem>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>הודעה מותאמת (אם אין תבנית)</Label>
              <Textarea value={form.custom_message} onChange={e => setForm({ ...form, custom_message: e.target.value })} placeholder="תוכן ההודעה... ניתן להשתמש ב-{name}" className="min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSave}>{editingRule ? "עדכן" : "צור כלל"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
