import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Enrollment {
  id: string;
  customer_id: string;
  course_id: string;
  status: string;
  payment_status: string;
  amount_paid: number;
  discount?: number | null;
  notes?: string;
  student_notes?: string | null;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentWithDetails extends Enrollment {
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  course?: {
    id: string;
    name: string;
    price: number;
  };
}

export function useEnrollments(courseId?: string) {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchEnrollments = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("enrollments")
        .select(`
          *,
          customer:customers(id, name, phone, email),
          course:courses(id, name, price)
        `)
        .order("enrolled_at", { ascending: false });

      if (courseId) {
        query = query.eq("course_id", courseId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  const enrollCustomer = async (customerId: string, targetCourseId: string, amountPaid?: number) => {
    try {
      const { data, error } = await supabase
        .from("enrollments")
        .insert({
          customer_id: customerId,
          course_id: targetCourseId,
          status: "enrolled",
          payment_status: amountPaid ? "paid" : "pending",
          amount_paid: amountPaid || 0,
        })
        .select(`
          *,
          customer:customers(id, name, phone, email),
          course:courses(id, name, price)
        `)
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from("activities").insert({
        customer_id: customerId,
        type: "enrolled_to_course",
        description: `לקוח נרשם לקורס`,
        metadata: { course_id: targetCourseId },
      });

      setEnrollments((prev) => [data, ...prev]);
      
      toast({
        title: "לקוח נרשם לקורס",
      });

      return data;
    } catch (error) {
      console.error("Error enrolling customer:", error);
      toast({
        title: "שגיאה ברישום לקורס",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateEnrollment = async (enrollmentId: string, updates: Partial<Enrollment>) => {
    try {
      const { error } = await supabase
        .from("enrollments")
        .update(updates)
        .eq("id", enrollmentId);

      if (error) throw error;

      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? { ...e, ...updates } : e))
      );

      toast({ title: "רישום עודכן" });
    } catch (error) {
      console.error("Error updating enrollment:", error);
      toast({
        title: "שגיאה בעדכון רישום",
        variant: "destructive",
      });
    }
  };

  const removeEnrollment = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("id", enrollmentId);

      if (error) throw error;

      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      toast({ title: "רישום הוסר" });
    } catch (error) {
      console.error("Error removing enrollment:", error);
      toast({
        title: "שגיאה בהסרת רישום",
        variant: "destructive",
      });
    }
  };

  return {
    enrollments,
    isLoading,
    fetchEnrollments,
    enrollCustomer,
    updateEnrollment,
    removeEnrollment,
  };
}
