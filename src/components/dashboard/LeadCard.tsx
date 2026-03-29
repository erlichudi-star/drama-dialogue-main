import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/hooks/useLeads";
import { SourceIcon } from "@/components/chat/SourceIcon";

interface LeadCardProps {
  lead: Lead;
  onSelect: (lead: Lead) => void;
}

const statusStyles: Record<string, string> = {
  New: "status-new",
  Chatting: "status-chatting",
  Converted: "status-converted",
  Lost: "status-lost",
};

const statusLabels: Record<string, string> = {
  New: "חדש",
  Chatting: "בשיחה",
  Converted: "הומר",
  Lost: "אבוד",
};

export function LeadCard({ lead, onSelect }: LeadCardProps) {
  return (
    <div 
      className="theater-card group cursor-pointer p-3 transition-all duration-200 hover:border-primary/50"
      onClick={() => onSelect(lead)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <SourceIcon source={lead.source} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {lead.name}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground dir-ltr truncate" dir="ltr">{lead.phone}</p>
          {lead.interest && (
            <p className="mt-1 text-xs text-muted-foreground truncate">{lead.interest}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusStyles[lead.status] || statusStyles.New}`}>
            {statusLabels[lead.status] || lead.status}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>
              {formatDistanceToNow(new Date(lead.last_interaction_at || lead.created_at), { addSuffix: true, locale: he })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
