import { LeadCard } from "./LeadCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/hooks/useLeads";

interface LeadsKanbanProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const columns = [
  { status: "New", title: "לידים חדשים", color: "bg-primary" },
  { status: "Chatting", title: "בשיחה", color: "bg-blue-500" },
  { status: "Converted", title: "הומרו", color: "bg-emerald-500" },
  { status: "Lost", title: "אבודים", color: "bg-muted-foreground" },
];

export function LeadsKanban({ leads, onSelectLead }: LeadsKanbanProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnLeads = leads.filter((lead) => lead.status === column.status);
        
        return (
          <div key={column.status} className="flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${column.color}`} />
              <h3 className="font-display text-sm font-semibold text-foreground">
                {column.title}
              </h3>
              <span className="mr-auto flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {columnLeads.length}
              </span>
            </div>

            <ScrollArea className="max-h-[60vh] flex-1 rounded-lg border border-border bg-muted/20 p-2">
              <div className="space-y-2">
                {columnLeads.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border">
                    <p className="text-xs text-muted-foreground">אין לידים</p>
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <LeadCard 
                      key={lead.id} 
                      lead={lead} 
                      onSelect={onSelectLead} 
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
