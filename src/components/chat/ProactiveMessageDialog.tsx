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

interface ProactiveMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
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
    template: "היי {name}, רציתי להודות לך על הפנייה! נשמח לראות אותך אצלנו 🎭✨",
  },
];

export function ProactiveMessageDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
}: ProactiveMessageDialogProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSelectTemplate = (template: string) => {
    setMessage(template.replace("{name}", leadName));
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("נא להזין הודעה");
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-proactive-message", {
        body: { leadId, message, type: "proactive" },
      });

      if (error) throw error;

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
            שליחת הודעה יזומה
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Templates */}
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

          {/* Message */}
          <div className="space-y-2">
            <Label>הודעה</Label>
            <Textarea
              placeholder={`הקלד הודעה ל-${leadName}...`}
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
            className="bg-primary hover:bg-primary/90"
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
