import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tables } from "@/integrations/supabase/types";

interface CoursesTableProps {
  courses: Tables<"courses">[];
  onEdit: (course: Tables<"courses">) => void;
  onDelete: (id: string) => void;
  onRowClick?: (course: Tables<"courses">) => void;
  isDeleting?: boolean;
}

export function CoursesTable({ courses, onEdit, onDelete, onRowClick, isDeleting }: CoursesTableProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "d בMMM yyyy", { locale: he });
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "-";
    return `₪${price.toLocaleString("he-IL")}`;
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        אין קורסים להצגה. לחץ על "הוסף קורס" כדי להתחיל.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto" dir="rtl">
      <div className="min-w-[800px] rounded-lg border border-border overflow-hidden">
        <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right">שם הקורס</TableHead>
            <TableHead className="text-right">מדריך</TableHead>
            <TableHead className="text-right">קבוצת גיל</TableHead>
            <TableHead className="text-right">מסלול</TableHead>
            <TableHead className="text-right">שנה</TableHead>
            <TableHead className="text-right">סמסטר</TableHead>
            <TableHead className="text-right">מחיר</TableHead>
            <TableHead className="text-right">סטטוס</TableHead>
            <TableHead className="text-right w-[120px]">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => onRowClick?.(course)}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{course.name}</span>
                  {course.payment_link && (
                    <a
                      href={course.payment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      קישור לתשלום
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>{course.instructor || "-"}</TableCell>
              <TableCell>{course.age_group || "-"}</TableCell>
              <TableCell>{course.track || "-"}</TableCell>
              <TableCell>{course.year || "-"}</TableCell>
              <TableCell>{course.semester || "-"}</TableCell>
              <TableCell>{formatPrice(course.price)}</TableCell>
              <TableCell>
                <Badge variant={course.is_active ? "default" : "secondary"}>
                  {course.is_active ? "פעיל" : "לא פעיל"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(course)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                        <AlertDialogDescription>
                          פעולה זו תמחק את הקורס "{course.name}" לצמיתות. לא ניתן לבטל פעולה זו.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(course.id)}
                          disabled={isDeleting}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {isDeleting ? "מוחק..." : "מחק"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </div>
  );
}
