import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageBubble } from "./MessageBubble";
import { ProactiveMessageDialog } from "./ProactiveMessageDialog";
import { LeadInfoPanel } from "./LeadInfoPanel";
import { SourceIcon } from "./SourceIcon";
import { 
  Send, 
  Phone, 
  MoreVertical, 
  Bot, 
  UserCheck,
  Loader2,
  MessageCircle,
  SendHorizonal,
  Info,
  Mail,
  Tag,
  Megaphone
} from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  interest?: string;
  ad_name?: string;
  campaign_id?: string;
  created_at: string;
  last_interaction_at: string;
}

interface Message {
  id: string;
  lead_id: string;
  sender: "user" | "bot" | "human";
  content: string;
  created_at: string;
}

interface ChatWindowProps {
  lead: Lead | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

export function ChatWindow({ lead, messages, onSendMessage, isLoading }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [isProactiveOpen, setIsProactiveOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!lead) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background/50">
        <div className="theater-spotlight absolute inset-0" />
        <div className="relative z-10 text-center">
          <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <h3 className="mt-4 font-display text-2xl font-semibold text-muted-foreground">
            בחר שיחה
          </h3>
          <p className="mt-2 text-sm text-muted-foreground/70">
            בחר ליד מהרשימה כדי לצפות בצ׳אט
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20 font-display text-xl font-semibold text-secondary-foreground">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                {lead.name}
              </h2>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground" dir="ltr">{lead.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInfoOpen(true)}
              className="gap-2"
            >
              <Info className="h-4 w-4" />
              פרטי ליד
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProactiveOpen(true)}
              className="gap-2"
            >
              <SendHorizonal className="h-4 w-4" />
              הודעה יזומה
            </Button>
            <Button
              variant={isPaused ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsPaused(!isPaused);
                toast.success(isPaused ? "הבוט הופעל מחדש" : "הבוט הושהה - מצב ידני פעיל");
              }}
              className={isPaused ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {isPaused ? (
                <>
                  <UserCheck className="ml-2 h-4 w-4" />
                  מצב ידני
                </>
              ) : (
                <>
                  <Bot className="ml-2 h-4 w-4" />
                  AI פעיל
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Metadata Bar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <SourceIcon source={lead.source} className="h-3 w-3" />
            {lead.source}
          </Badge>
          {lead.interest && (
            <Badge variant="outline" className="gap-1.5 text-xs bg-primary/5">
              <Tag className="h-3 w-3" />
              {lead.interest}
            </Badge>
          )}
          {lead.email && (
            <Badge variant="outline" className="gap-1.5 text-xs">
              <Mail className="h-3 w-3" />
              {lead.email}
            </Badge>
          )}
          {lead.ad_name && (
            <Badge variant="outline" className="gap-1.5 text-xs bg-accent/50">
              <Megaphone className="h-3 w-3" />
              {lead.ad_name}
            </Badge>
          )}
        </div>

        {/* Dialogs */}
        <ProactiveMessageDialog
          open={isProactiveOpen}
          onOpenChange={setIsProactiveOpen}
          leadId={lead.id}
          leadName={lead.name}
        />
        <LeadInfoPanel
          open={isInfoOpen}
          onOpenChange={setIsInfoOpen}
          lead={lead}
        />
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-12 w-12 text-primary/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                אין הודעות עדיין. התחל את השיחה!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          {isLoading && (
            <div className="flex gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tr-sm bg-muted px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">ה-AI חושב...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        {isPaused && (
          <div className="mb-3">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <UserCheck className="ml-1 h-3 w-3" />
              מצב ידני פעיל - הודעות יישלחו ממך
            </Badge>
          </div>
        )}
        <div className="flex gap-3">
          <Input
            placeholder={isPaused ? "הקלד תגובה ידנית..." : "הקלד הודעה (ה-AI יגיב)..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-muted/50"
          />
          <Button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
