import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import { useEnrollments, EnrollmentWithDetails } from "@/hooks/useEnrollments";
import { useCustomers } from "@/hooks/useCustomers";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Save, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface CourseDetailsSheetProps {
  course: Tables<"courses"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseDetailsSheet({ course, open, onOpenChange }: CourseDetailsSheetProps) {
  const { enrollments, isLoading, fetchEnrollments, enrollCustomer, updateEnrollment, removeEnrollment } = useEnrollments(course?.id);
  const { customers } = useCustomers();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [addDiscount, setAddDiscount] = useState<number>(0);
  const [editingEnrollment, setEditingEnrollment] = useState<string | null>(null);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (open && course) {
      fetchEnrollments();
    }
  }, [open, course, fetchEnrollments]);

  const enrolledCustomerIds = enrollments.map((e) => e.customer_id);
  const availableCustomers = customers.filter((c) => !enrolledCustomerIds.includes(c.id));

  const handleAddStudent = async () => {
    if (!selectedCustomerId || !course) return;
    try {
      await enrollCustomer(selectedCustomerId, course.id, undefined);
      if (addDiscount > 0) {
        // Update the newly created enrollment with discount
        const { data } = await supabase
          .from("enrollments")
          .select("id")
          .eq("customer_id", selectedCustomerId)
          .eq("course_id", course.id)
          .single();
        if (data) {
          await supabase.from("enrollments").update({ discount: addDiscount }).eq("id", data.id);
        }
      }
      setIsAddStudentOpen(false);
      setSelectedCustomerId("");
      setAddDiscount(0);
      fetchEnrollments();
    } catch (error) {
      // handled by hook
    }
  };

  const handleSaveEdit = async (enrollmentId: string) => {
    await updateEnrollment(enrollmentId, {
      notes: editNotes,
    });
    await supabase.from("enrollments").update({ discount: editDiscount, student_notes: editNotes }).eq("id", enrollmentId);
    setEditingEnrollment(null);
    fetchEnrollments();
  };

  const startEditing = (enrollment: EnrollmentWithDetails) => {
    setEditingEnrollment(enrollment.id);
    setEditDiscount(enrollment.discount || 0);
    setEditNotes(enrollment.student_notes || "");
  };

  if (!course) return null;

  const formatPrice = (v: number | null) => v ? `₪${v.toLocaleString("he-IL")}` : "—";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto" dir="rtl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">{course.name}</SheetTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={course.is_active ? "default" : "secondary"}>
                {course.is_active ? "פעיל" : "לא פעיל"}
              </Badge>
              {course.semester && <Badge variant="outline">{course.semester}</Badge>}
              {course.year && <Badge variant="outline">{course.year}</Badge>}
              {course.track && <Badge variant="outline">{course.track}</Badge>}
            </div>
          </SheetHeader>

          {/* Course Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <span className="text-muted-foreground">מדריך:</span>
              <span className="mr-2 font-medium">{course.instructor || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">מחיר:</span>
              <span className="mr-2 font-medium">{formatPrice(course.price)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">מועד:</span>
              <span className="mr-2 font-medium">{course.schedule || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">קבוצת גיל:</span>
              <span className="mr-2 font-medium">{course.age_group || "—"}</span>
            </div>
            {course.description && (
              <div className="col-span-2">
                <span className="text-muted-foreground">תיאור:</span>
                <p className="mr-2 mt-1">{course.description}</p>
              </div>
            )}
          </div>

          {/* Students Section */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">תלמידים רשומים ({enrollments.length})</h3>
            <Button size="sm" onClick={() => setIsAddStudentOpen(true)}>
              <UserPlus className="h-4 w-4 ml-1" />
              הוסף תלמיד
            </Button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">טוען...</p>
          ) : enrollments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">אין תלמידים רשומים לקורס זה</p>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right">שם</TableHead>
                    <TableHead className="text-right">טלפון</TableHead>
                    <TableHead className="text-right">שולם</TableHead>
                    <TableHead className="text-right">הנחה</TableHead>
                    <TableHead className="text-right">תשלום</TableHead>
                    <TableHead className="text-right">הערות</TableHead>
                    <TableHead className="text-right w-[100px]">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{enrollment.customer?.name || "—"}</TableCell>
                      <TableCell dir="ltr" className="text-right">{enrollment.customer?.phone || "—"}</TableCell>
                      <TableCell>{formatPrice(enrollment.amount_paid)}</TableCell>
                      <TableCell>
                        {editingEnrollment === enrollment.id ? (
                          <Input
                            type="number"
                            value={editDiscount}
                            onChange={(e) => setEditDiscount(Number(e.target.value))}
                            className="w-20 h-8"
                          />
                        ) : (
                          `₪${enrollment.discount || 0}`
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={enrollment.payment_status === "paid" ? "default" : "secondary"}>
                          {enrollment.payment_status === "paid" ? "שולם" : "ממתין"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingEnrollment === enrollment.id ? (
                          <Input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-32 h-8"
                            placeholder="הערות..."
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {enrollment.student_notes || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingEnrollment === enrollment.id ? (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveEdit(enrollment.id)}>
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditing(enrollment)}>
                              <Plus className="h-3.5 w-3.5 rotate-45" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeEnrollment(enrollment.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Student Dialog */}
      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף תלמיד לקורס</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">בחר לקוח</label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר לקוח..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCustomers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">הנחה (₪)</label>
              <Input
                type="number"
                value={addDiscount}
                onChange={(e) => setAddDiscount(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsAddStudentOpen(false)}>ביטול</Button>
              <Button onClick={handleAddStudent} disabled={!selectedCustomerId}>הוסף</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
