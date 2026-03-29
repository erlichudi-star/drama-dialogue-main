import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle } from "lucide-react";
import { useState } from "react";
import { SourceIcon } from "./SourceIcon";

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: string;
  interest?: string;
  last_interaction_at: string;
}

interface ChatSidebarProps {
  leads: Lead[];
  selectedLeadId?: string;
  onSelectLead: (lead: Lead) => void;
}

const statusLabels: Record<string, string> = {
  New: "חדש",
  Chatting: "בשיחה",
  Converted: "הומר",
  Lost: "אבוד",
};

export function ChatSidebar({ leads, selectedLeadId, onSelectLead }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery)
  );

  return (
    <div className="flex h-full flex-col border-l border-border bg-sidebar">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h2 className="font-display text-xl font-semibold text-foreground">
          שיחות
        </h2>
        <div className="relative mt-3">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש לידים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 bg-muted/50 border-border"
          />
        </div>
      </div>

      {/* Leads List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">אין שיחות עדיין</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className={`w-full rounded-lg p-3 text-right transition-all duration-200 ${
                  selectedLeadId === lead.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                   {/* Avatar */}
                   <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 font-display font-semibold text-secondary-foreground">
                     {lead.name.charAt(0).toUpperCase()}
                   </div>

                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1.5 min-w-0">
                         <SourceIcon source={lead.source} className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                         <p className="font-medium text-foreground truncate">
                           {lead.name}
                         </p>
                       </div>
                       <Badge 
                         variant="outline" 
                         className={`text-[10px] shrink-0 ${
                           lead.status === "Chatting" ? "status-chatting" : "status-new"
                         }`}
                       >
                         {statusLabels[lead.status] || lead.status}
                       </Badge>
                     </div>
                     <p className="text-xs text-muted-foreground truncate" dir="ltr">
                       {lead.phone}
                     </p>
                     {lead.interest && (
                       <p className="mt-0.5 text-[11px] text-primary/70 truncate">
                         {lead.interest}
                       </p>
                     )}
                     <p className="mt-0.5 text-[10px] text-muted-foreground">
                       {formatDistanceToNow(new Date(lead.last_interaction_at), { addSuffix: true, locale: he })}
                     </p>
                   </div>
                 </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
