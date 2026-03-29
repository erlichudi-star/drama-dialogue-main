import { format } from "date-fns";
import { Bot, User, UserCheck } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot" | "human";
  content: string;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isFromUser = message.sender === "user";
  const isFromBot = message.sender === "bot";
  const isFromHuman = message.sender === "human";

  return (
    <div className={`flex gap-2 ${isFromUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isFromUser
            ? "bg-secondary/30"
            : isFromBot
            ? "bg-primary/20"
            : "bg-emerald-500/20"
        }`}
      >
        {isFromUser ? (
          <User className="h-4 w-4 text-secondary-foreground" />
        ) : isFromBot ? (
          <Bot className="h-4 w-4 text-primary" />
        ) : (
          <UserCheck className="h-4 w-4 text-emerald-400" />
        )}
      </div>

      {/* Message */}
      <div
        className={`group max-w-[70%] rounded-2xl px-4 py-2.5 ${
          isFromUser
            ? "bg-secondary text-secondary-foreground rounded-tl-sm"
            : isFromBot
            ? "bg-muted text-foreground rounded-tr-sm"
            : "bg-emerald-500/20 text-foreground rounded-tr-sm border border-emerald-500/30"
        }`}
      >
        {!isFromUser && (
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide opacity-60">
            {isFromBot ? "עוזר AI" : "נציג אנושי"}
          </p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p className={`mt-1 text-[10px] opacity-50 ${isFromUser ? "text-left" : "text-right"}`}>
          {format(new Date(message.created_at), "HH:mm")}
        </p>
      </div>
    </div>
  );
}
