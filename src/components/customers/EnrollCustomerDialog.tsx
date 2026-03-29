import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useEnrollments } from "@/hooks/useEnrollments";
import { useCourses } from "@/hooks/useCourses";
import { Customer } from "@/hooks/useCustomers";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { GraduationCap, Check } from "lucide-react";

interface EnrollCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export function EnrollCustomerDialog({
  open,
  onOpenChange,
  customer,
}: EnrollCustomerDialogProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { courses, isLoading: coursesLoading } = useCourses();
  const { enrollments, fetchEnrollments, enrollCustomer } = useEnrollments();

  useEffect(() => {
    if (open) {
      fetchEnrollments();
    }
  }, [open, fetchEnrollments]);

  // Filter out courses the customer is already enrolled in
  const enrolledCourseIds = enrollments
    .filter((e) => e.customer_id === customer.id)
    .map((e) => e.course_id);

  const availableCourses = courses.filter(
    (c) => c.is_active && !enrolledCourseIds.includes(c.id)
  );

  const handleEnroll = async () => {
    if (!selectedCourseId) return;

    try {
      setIsSubmitting(true);
      await enrollCustomer(
        customer.id,
        selectedCourseId,
        amountPaid ? parseFloat(amountPaid) : undefined
      );
      onOpenChange(false);
      setSelectedCourseId(null);
      setAmountPaid("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>רישום {customer.name} לקורס</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label>בחר קורס</Label>
            {coursesLoading ? (
              <p className="text-sm text-muted-foreground">טוען קורסים...</p>
            ) : availableCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                אין קורסים זמינים לרישום
              </p>
            ) : (
              <div className="grid gap-2 max-h-60 overflow-auto">
                {availableCourses.map((course) => (
                  <div
                    key={course.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCourseId === course.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          <span className="font-medium">{course.name}</span>
                        </div>
                        {course.start_date && (
                          <p className="text-sm text-muted-foreground mt-1">
                            מתחיל: {format(new Date(course.start_date), "dd/MM/yyyy", { locale: he })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">₪{course.price}</Badge>
                        {selectedCourseId === course.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Amount */}
          {selectedCourse && (
            <div className="space-y-2">
              <Label>סכום ששולם</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-32"
                  dir="ltr"
                />
                <span className="text-muted-foreground">
                  מתוך ₪{selectedCourse.price}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={!selectedCourseId || isSubmitting}
            >
              {isSubmitting ? "רושם..." : "רשום לקורס"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
