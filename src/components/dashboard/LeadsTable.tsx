import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Lead } from "@/hooks/useLeads";
import { SourceIcon } from "@/components/chat/SourceIcon";

interface LeadsTableProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const statusLabels: Record<string, string> = {
  New: "חדש",
  Chatting: "בשיחה",
  Converted: "הומר",
  Lost: "אבוד",
};

const statusStyles: Record<string, string> = {
  New: "status-new",
  Chatting: "status-chatting",
  Converted: "status-converted",
  Lost: "status-lost",
};

type SortKey = "name" | "source" | "status" | "created_at";

export function LeadsTable({ leads, onSelectLead }: LeadsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sorted = [...leads].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    const valA = a[sortKey] || "";
    const valB = b[sortKey] || "";
    return valA < valB ? -dir : valA > valB ? dir : 0;
  });

  const SortButton = ({ label, field }: { label: string; field: SortKey }) => (
    <Button variant="ghost" size="sm" className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground" onClick={() => toggleSort(field)}>
      {label}
      <ArrowUpDown className="mr-1 h-3 w-3" />
    </Button>
  );

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right"><SortButton label="שם" field="name" /></TableHead>
            <TableHead className="text-right">טלפון</TableHead>
            <TableHead className="text-right"><SortButton label="מקור" field="source" /></TableHead>
            <TableHead className="text-right"><SortButton label="סטטוס" field="status" /></TableHead>
            <TableHead className="text-right">התעניינות</TableHead>
            <TableHead className="text-right"><SortButton label="תאריך" field="created_at" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                אין לידים להצגה
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((lead) => (
              <TableRow key={lead.id} className="cursor-pointer" onClick={() => onSelectLead(lead)}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <SourceIcon source={lead.source} className="h-4 w-4 text-muted-foreground" />
                    {lead.name}
                  </div>
                </TableCell>
                <TableCell dir="ltr" className="text-right">{lead.phone}</TableCell>
                <TableCell>{lead.source}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusStyles[lead.status] || ""}>
                    {statusLabels[lead.status] || lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">{lead.interest || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: he })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
