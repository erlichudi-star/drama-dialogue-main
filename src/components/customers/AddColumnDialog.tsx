import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    column_name: string;
    column_label: string;
    column_type: string;
  }) => Promise<unknown>;
}

export function AddColumnDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddColumnDialogProps) {
  const [columnLabel, setColumnLabel] = useState("");
  const [columnType, setColumnType] = useState("text");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!columnLabel.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        column_name: columnLabel.toLowerCase().replace(/\s+/g, "_"),
        column_label: columnLabel,
        column_type: columnType,
      });
      onOpenChange(false);
      setColumnLabel("");
      setColumnType("text");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>הוספת עמודה מותאמת אישית</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>שם העמודה</Label>
            <Input
              placeholder="למשל: תאריך הרשמה"
              value={columnLabel}
              onChange={(e) => setColumnLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>סוג שדה</Label>
            <Select value={columnType} onValueChange={setColumnType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">טקסט</SelectItem>
                <SelectItem value="number">מספר</SelectItem>
                <SelectItem value="date">תאריך</SelectItem>
                <SelectItem value="boolean">כן/לא</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!columnLabel.trim() || isSubmitting}
            >
              {isSubmitting ? "מוסיף..." : "הוסף עמודה"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
