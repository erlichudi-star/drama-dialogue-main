import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Customer } from "@/hooks/useCustomers";

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

const MESSAGE_TEMPLATES = [
  {
    id: "reminder",
    label: "תזכורת",
    template: "היי {name}, רציתי לוודא שקיבלת את כל המידע שרצית. יש לך שאלות נוספות? 🎭",
  },
  {
    id: "course",
    label: "הזמנה לקורס",
    template: "היי {name}! יש לנו קורס חדש שפותח בקרוב ונראה לי שיכול להתאים לך. מעוניין/ת לשמוע פרטים? ✨",
  },
  {
    id: "show",
    label: "הזמנה להצגה",
    template: "היי {name}! יש לנו הצגה מיוחדת בקרוב שחשבתי שתאהב/י. רוצה לשמור מקום? 🎫",
  },
  {
    id: "thanks",
    label: "תודה",
    template: "היי {name}, רציתי להודות לך! נשמח לראות אותך אצלנו 🎭✨",
  },
];

export function SendMessageDialog({
  open,
  onOpenChange,
  customer,
}: SendMessageDialogProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSelectTemplate = (template: string) => {
    setMessage(template.replace("{name}", customer.name));
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("נא להזין הודעה");
      return;
    }

    setIsSending(true);
    try {
      if (customer.lead_id) {
        const { error } = await supabase.functions.invoke("send-proactive-message", {
          body: { leadId: customer.lead_id, message, type: "proactive" },
        });
        if (error) throw error;
      } else {
        // No lead_id — send directly via phone
        const { error } = await supabase.functions.invoke("send-proactive-message", {
          body: { phone: customer.phone, message, type: "proactive" },
        });
        if (error) throw error;
      }

      // Log activity
      await supabase.from("activities").insert({
        customer_id: customer.id,
        lead_id: customer.lead_id || null,
        type: "message_sent",
        description: `הודעת WhatsApp נשלחה ללקוח`,
      });

      toast.success("ההודעה נשלחה בהצלחה!");
      onOpenChange(false);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("שגיאה בשליחת ההודעה");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            שליחת הודעה ל{customer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              תבניות מוכנות
            </Label>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TEMPLATES.map((template) => (
                <Badge
                  key={template.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSelectTemplate(template.template)}
                >
                  {template.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>הודעה</Label>
            <Textarea
              placeholder={`הקלד הודעה ל-${customer.name}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] bg-muted/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !message.trim()}
          >
            {isSending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="ml-2 h-4 w-4" />
            )}
            שלח WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
