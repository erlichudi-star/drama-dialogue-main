import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { EnrollCustomerDialog } from "@/components/customers/EnrollCustomerDialog";
import { SendMessageDialog } from "@/components/customers/SendMessageDialog";
import { Customer } from "@/hooks/useCustomers";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import {
  MessageSquare,
  Phone,
  Mail,
  Send,
  GraduationCap,
  User,
  History,
  BookOpen,
  Loader2,
  ExternalLink,
  Calendar,
  CreditCard,
  StickyNote,
} from "lucide-react";

interface CustomerDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  onUpdate: (id: string, updates: Partial<Customer>) => Promise<void>;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  created_at: string;
}

interface Enrollment {
  id: string;
  status: string;
  payment_status: string | null;
  amount_paid: number | null;
  enrolled_at: string;
  course: {
    id: string;
    name: string;
    price: number | null;
  } | null;
}

type EnrollmentQueryRow = Omit<Enrollment, "course"> & {
  courses: Enrollment["course"];
};

export function CustomerDetailSheet({
  open,
  onOpenChange,
  customer,
  onUpdate,
}: CustomerDetailSheetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [notes, setNotes] = useState(customer.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Fetch messages via lead_id
  useEffect(() => {
    if (!open || !customer.lead_id) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, content, sender, created_at")
          .eq("lead_id", customer.lead_id!)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setMessages(data || []);
      } catch (e) {
        console.error("Error fetching messages:", e);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [open, customer.lead_id]);

  // Fetch enrollments
  useEffect(() => {
    if (!open) return;
    const fetchEnrollments = async () => {
      setIsLoadingEnrollments(true);
      try {
        const { data, error } = await supabase
          .from("enrollments")
          .select("id, status, payment_status, amount_paid, enrolled_at, courses(id, name, price)")
          .eq("customer_id", customer.id)
          .order("enrolled_at", { ascending: false });
        if (error) throw error;
        setEnrollments(
          (data || []).map((e: EnrollmentQueryRow) => ({
            ...e,
            course: e.courses,
          }))
        );
      } catch (e) {
        console.error("Error fetching enrollments:", e);
      } finally {
        setIsLoadingEnrollments(false);
      }
    };
    fetchEnrollments();
  }, [open, customer.id]);

  // Reset notes when customer changes
  useEffect(() => {
    setNotes(customer.notes || "");
  }, [customer.notes]);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onUpdate(customer.id, { notes });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const phoneClean = customer.phone.replace(/[^0-9+]/g, "");
  const waLink = `https://wa.me/${phoneClean.startsWith("+") ? phoneClean.slice(1) : phoneClean.startsWith("0") ? "972" + phoneClean.slice(1) : phoneClean}`;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden">
          <SheetHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-xl font-bold">{customer.name}</SheetTitle>
                <p className="text-sm text-muted-foreground mt-1" dir="ltr">
                  {customer.phone}
                </p>
                {customer.email && (
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                )}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {customer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
            </div>

            {/* Quick contact buttons */}
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" asChild>
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="ml-2 h-4 w-4 text-green-500" />
                  WhatsApp
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${phoneClean}`}>
                  <Phone className="ml-2 h-4 w-4 text-blue-400" />
                  התקשר
                </a>
              </Button>
              {customer.email && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:${customer.email}`}>
                    <Mail className="ml-2 h-4 w-4 text-amber-400" />
                    אימייל
                  </a>
                </Button>
              )}
              <Button size="sm" onClick={() => setIsSendMessageOpen(true)}>
                <Send className="ml-2 h-4 w-4" />
                שלח הודעה
              </Button>
            </div>
          </SheetHeader>

          <Tabs defaultValue="messages" className="flex flex-col h-[calc(100%-200px)]">
            <TabsList className="mx-6 mt-4 w-auto justify-start">
              <TabsTrigger value="messages" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                הודעות
              </TabsTrigger>
              <TabsTrigger value="courses" className="gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                קורסים
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5">
                <History className="h-3.5 w-3.5" />
                פעילות
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5">
                <StickyNote className="h-3.5 w-3.5" />
                הערות
              </TabsTrigger>
            </TabsList>

            {/* Messages Tab */}
            <TabsContent value="messages" className="flex-1 overflow-hidden px-6 pb-6">
              {!customer.lead_id ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  לקוח זה לא מקושר לליד — אין היסטוריית הודעות
                </div>
              ) : isLoadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  אין הודעות עדיין
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-3 pt-2">
                    {messages.map((msg) => {
                      const isOutgoing = msg.sender === "bot" || msg.sender === "agent";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOutgoing ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 text-sm ${
                              isOutgoing
                                ? "bg-primary/10 text-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {isOutgoing ? "נשלח" : "התקבל"}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(msg.created_at), "dd/MM/yy HH:mm", { locale: he })}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses" className="flex-1 overflow-hidden px-6 pb-6">
              <div className="flex items-center justify-between mb-3 pt-2">
                <span className="text-sm text-muted-foreground">
                  {enrollments.length} קורסים רשומים
                </span>
                <Button size="sm" variant="outline" onClick={() => setIsEnrollOpen(true)}>
                  <GraduationCap className="ml-2 h-4 w-4" />
                  רשום לקורס
                </Button>
              </div>
              {isLoadingEnrollments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  לא רשום לקורסים
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {enrollments.map((enr) => (
                      <div
                        key={enr.id}
                        className="rounded-lg border border-border p-3 bg-muted/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">
                              {enr.course?.name || "קורס"}
                            </span>
                          </div>
                          <Badge
                            variant={enr.status === "enrolled" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {enr.status === "enrolled" ? "רשום" : enr.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(enr.enrolled_at), "dd/MM/yyyy", { locale: he })}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            ₪{enr.amount_paid || 0}
                            {enr.course?.price ? ` / ₪${enr.course.price}` : ""}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {enr.payment_status === "paid" ? "שולם" : enr.payment_status === "pending" ? "ממתין" : enr.payment_status || "ממתין"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="flex-1 overflow-hidden px-6 pb-6 pt-2">
              <ActivityTimeline customerId={customer.id} limit={30} />
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="flex-1 overflow-hidden px-6 pb-6 pt-2">
              <div className="space-y-3">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="הוסף הערות על הלקוח..."
                  className="min-h-[200px] bg-muted/30"
                />
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes || notes === (customer.notes || "")}
                >
                  {isSavingNotes ? "שומר..." : "שמור הערות"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Send Message Dialog */}
      <SendMessageDialog
        open={isSendMessageOpen}
        onOpenChange={setIsSendMessageOpen}
        customer={customer}
      />

      {/* Enroll Dialog */}
      <EnrollCustomerDialog
        open={isEnrollOpen}
        onOpenChange={setIsEnrollOpen}
        customer={customer}
      />
    </>
  );
}
