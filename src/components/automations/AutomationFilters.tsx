import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";

interface AutomationFiltersProps {
  statusFilter: string;
  typeFilter: string;
  dateFrom: string;
  dateTo: string;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export function AutomationFilters({
  statusFilter,
  typeFilter,
  dateFrom,
  dateTo,
  onStatusChange,
  onTypeChange,
  onDateFromChange,
  onDateToChange,
}: AutomationFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="סטטוס" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">הכל</SelectItem>
          <SelectItem value="pending">ממתין</SelectItem>
          <SelectItem value="sent">נשלח</SelectItem>
          <SelectItem value="cancelled">בוטל</SelectItem>
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="סוג" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">הכל</SelectItem>
          <SelectItem value="reminder">תזכורת</SelectItem>
          <SelectItem value="promotion">קידום מכירות</SelectItem>
          <SelectItem value="follow_up">מעקב</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        className="w-[150px] bg-muted/50"
        placeholder="מתאריך"
        dir="ltr"
      />
      <Input
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        className="w-[150px] bg-muted/50"
        placeholder="עד תאריך"
        dir="ltr"
      />
    </div>
  );
}
