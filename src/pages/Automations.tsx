import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Zap, Plus, Clock, Send, Loader2, Play, CheckCircle, XCircle, Calendar, RefreshCw, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { he } from "date-fns/locale";
import { AutomationFilters } from "@/components/automations/AutomationFilters";
import { MessageTemplates } from "@/components/automations/MessageTemplates";
import { AutomationRules } from "@/components/automations/AutomationRules";
import { AIMessageGenerator } from "@/components/automations/AIMessageGenerator";

interface FollowUp {
  id: string;
  lead_id: string | null;
  customer_id: string | null;
  message: string;
  scheduled_at: string;
  status: string;
  type: string | null;
  created_at: string;
  leads?: { name: string; phone: string } | null;
  customers?: { name: string; phone: string } | null;
}

interface Lead { id: string; name: string; phone: string; }
interface Customer { id: string; name: string; phone: string; }
interface MessageTemplate { id: string; name: string; content: string; type: string; placeholders: string[]; }

export default function Automations() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [targetType, setTargetType] = useState<"lead" | "customer">("lead");
  const [newFollowUp, setNewFollowUp] = useState({
    target_id: "", message: "", scheduled_at: "", type: "reminder",
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = async () => {
    try {
      const [followUpsRes, leadsRes, customersRes, templatesRes] = await Promise.all([
        supabase.from("follow_ups").select("*, leads(name, phone), customers(name, phone)").order("scheduled_at", { ascending: true }),
        supabase.from("leads").select("id, name, phone").order("name"),
        supabase.from("customers").select("id, name, phone").order("name"),
        supabase.from("message_templates").select("id, name, content, type, placeholders").eq("is_active", true),
      ]);
      if (followUpsRes.error) throw followUpsRes.error;
      setFollowUps(followUpsRes.data || []);
      setLeads(leadsRes.data || []);
      setCustomers(customersRes.data || []);
      setTemplates((templatesRes.data as MessageTemplate[]) || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("שגיאה בטעינת הנתונים");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredFollowUps = useMemo(() => {
    return followUps.filter((f) => {
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (typeFilter !== "all" && f.type !== typeFilter) return false;
      if (dateFrom && f.scheduled_at < dateFrom) return false;
      if (dateTo && f.scheduled_at > dateTo + "T23:59:59") return false;
      return true;
    });
  }, [followUps, statusFilter, typeFilter, dateFrom, dateTo]);

  const handleAddFollowUp = async () => {
    if (!newFollowUp.target_id || !newFollowUp.message || !newFollowUp.scheduled_at) {
      toast.error("נא למלא את כל השדות");
      return;
    }
    try {
      const insertData: Record<string, unknown> = {
        message: newFollowUp.message,
        scheduled_at: newFollowUp.scheduled_at,
        type: newFollowUp.type,
        status: "pending",
      };
      if (targetType === "lead") {
        insertData.lead_id = newFollowUp.target_id;
      } else {
        insertData.customer_id = newFollowUp.target_id;
      }
      const { error } = await supabase.from("follow_ups").insert(insertData as { message: string; scheduled_at: string; type: string; status: string; lead_id?: string; customer_id?: string });
      if (error) throw error;
      toast.success("פולואפ נוצר בהצלחה!");
      setIsAddOpen(false);
      setNewFollowUp({ target_id: "", message: "", scheduled_at: "", type: "reminder" });
      fetchData();
    } catch (error) {
      console.error("Error creating follow-up:", error);
      toast.error("שגיאה ביצירת פולואפ");
    }
  };

  const handleProcessAutomations = async () => {
    setIsProcessing(true);
    try {
      const response = await supabase.functions.invoke("process-automations");
      if (response.error) throw response.error;
      const data = response.data;
      toast.success(`עובד ${data.processed} מתוך ${data.total} פולואפים`);
      fetchData();
    } catch (error) {
      console.error("Error processing automations:", error);
      toast.error("שגיאה בעיבוד האוטומציות");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelFollowUp = async (id: string) => {
    try {
      const { error } = await supabase.from("follow_ups").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
      toast.success("פולואפ בוטל");
      fetchData();
    } catch (error) {
      console.error("Error cancelling follow-up:", error);
      toast.error("שגיאה בביטול");
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      let content = template.content;
      // Replace {name} with selected target name
      const targetList = targetType === "lead" ? leads : customers;
      const target = targetList.find((t) => t.id === newFollowUp.target_id);
      if (target) {
        content = content.replace(/\{name\}/g, target.name);
        content = content.replace(/\{phone\}/g, target.phone);
      }
      setNewFollowUp({ ...newFollowUp, message: content });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">ממתין</Badge>;
      case "sent": return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">נשלח</Badge>;
      case "cancelled": return <Badge variant="outline" className="bg-muted text-muted-foreground">בוטל</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTargetName = (f: FollowUp) => {
    if (f.leads) return { name: f.leads.name, phone: f.leads.phone, type: "ליד" };
    if (f.customers) return { name: f.customers.name, phone: f.customers.phone, type: "לקוח" };
    return { name: "לא ידוע", phone: "", type: "" };
  };

  const pendingCount = followUps.filter((f) => f.status === "pending").length;
  const sentCount = followUps.filter((f) => f.status === "sent").length;

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">אוטומציות</h1>
            <p className="mt-1 text-muted-foreground">ניהול פולואפים, תבניות והודעות אוטומטיות</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleProcessAutomations} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Play className="ml-2 h-4 w-4" />}
              הפעל עכשיו
            </Button>
            <Button onClick={() => setIsAddOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="ml-2 h-4 w-4" />
              פולואפ חדש
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="theater-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                  <Clock className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">ממתינים לשליחה</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="theater-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{sentCount}</p>
                  <p className="text-sm text-muted-foreground">נשלחו בהצלחה</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="theater-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{followUps.length}</p>
                  <p className="text-sm text-muted-foreground">סה״כ פולואפים</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="followups" className="space-y-4">
          <TabsList>
            <TabsTrigger value="followups">פולואפים</TabsTrigger>
            <TabsTrigger value="rules">כללי אוטומציה</TabsTrigger>
            <TabsTrigger value="templates">תבניות הודעה</TabsTrigger>
          </TabsList>

          <TabsContent value="followups" className="space-y-4">
            <AutomationFilters
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onStatusChange={setStatusFilter}
              onTypeChange={setTypeFilter}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />

            <Card className="theater-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display text-xl">פולואפים מתוזמנים</CardTitle>
                    <CardDescription>הודעות שנשלחו ויישלחו אוטומטית</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredFollowUps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      {followUps.length === 0 ? "אין פולואפים מתוזמנים" : "אין תוצאות לפילטר הנוכחי"}
                    </p>
                    {followUps.length === 0 && (
                      <Button variant="link" onClick={() => setIsAddOpen(true)}>צור פולואפ ראשון</Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">שם</TableHead>
                        <TableHead className="text-right">הודעה</TableHead>
                        <TableHead className="text-right">תזמון</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFollowUps.map((followUp) => {
                        const target = getTargetName(followUp);
                        return (
                          <TableRow key={followUp.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{target.name}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-muted-foreground" dir="ltr">{target.phone}</p>
                                  {target.type && <Badge variant="secondary" className="text-xs">{target.type}</Badge>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="max-w-[200px] truncate text-sm">{followUp.message}</p>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{format(new Date(followUp.scheduled_at), "dd/MM/yyyy HH:mm")}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(followUp.scheduled_at), { addSuffix: true, locale: he })}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(followUp.status)}</TableCell>
                            <TableCell>
                              {followUp.status === "pending" && (
                                <Button variant="ghost" size="sm" onClick={() => handleCancelFollowUp(followUp.id)}>
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules">
            <AutomationRules />
          </TabsContent>

          <TabsContent value="templates">
            <MessageTemplates />
          </TabsContent>
        </Tabs>

        {/* Add Follow-up Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>יצירת פולואפ חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>סוג יעד</Label>
                <Select value={targetType} onValueChange={(v) => { setTargetType(v as "lead" | "customer"); setNewFollowUp({ ...newFollowUp, target_id: "" }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">ליד</SelectItem>
                    <SelectItem value="customer">לקוח</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{targetType === "lead" ? "ליד" : "לקוח"}</Label>
                <Select value={newFollowUp.target_id} onValueChange={(v) => setNewFollowUp({ ...newFollowUp, target_id: v })}>
                  <SelectTrigger><SelectValue placeholder={`בחר ${targetType === "lead" ? "ליד" : "לקוח"}`} /></SelectTrigger>
                  <SelectContent>
                    {(targetType === "lead" ? leads : customers).map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name} ({item.phone})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>סוג</Label>
                <Select value={newFollowUp.type} onValueChange={(v) => setNewFollowUp({ ...newFollowUp, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reminder">תזכורת</SelectItem>
                    <SelectItem value="promotion">קידום מכירות</SelectItem>
                    <SelectItem value="follow_up">מעקב</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label>תבנית הודעה (אופציונלי)</Label>
                  <Select onValueChange={applyTemplate}>
                    <SelectTrigger><SelectValue placeholder="בחר תבנית..." /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>תאריך ושעה</Label>
                <Input type="datetime-local" value={newFollowUp.scheduled_at} onChange={(e) => setNewFollowUp({ ...newFollowUp, scheduled_at: e.target.value })} className="bg-muted/50" dir="ltr" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>הודעה</Label>
                  <AIMessageGenerator
                    targetName={(targetType === "lead" ? leads : customers).find(t => t.id === newFollowUp.target_id)?.name || ""}
                    targetType={targetType}
                    targetId={newFollowUp.target_id}
                    messageType={newFollowUp.type}
                    onGenerated={(msg) => setNewFollowUp({ ...newFollowUp, message: msg })}
                  />
                </div>
                <Textarea placeholder="תוכן ההודעה..." value={newFollowUp.message} onChange={(e) => setNewFollowUp({ ...newFollowUp, message: e.target.value })} className="min-h-[100px] bg-muted/50" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>ביטול</Button>
              <Button onClick={handleAddFollowUp} className="bg-primary hover:bg-primary/90">
                <Send className="ml-2 h-4 w-4" />
                צור פולואפ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
