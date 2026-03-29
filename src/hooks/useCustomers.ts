import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Customer {
  id: string;
  lead_id?: string;
  name: string;
  phone: string;
  email?: string;
  total_purchases: number;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  customer_id: string;
  course_id: string;
  status: string;
  payment_status: string;
  amount_paid: number;
  notes?: string;
  enrolled_at: string;
  customer?: Customer;
  course?: {
    id: string;
    name: string;
    price: number;
  };
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "שגיאה בטעינת לקוחות",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createCustomer = async (customerData: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    lead_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || null,
          notes: customerData.notes || null,
          lead_id: customerData.lead_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from("activities").insert({
        customer_id: data.id,
        lead_id: customerData.lead_id || null,
        type: customerData.lead_id ? "converted_to_customer" : "customer_created",
        description: `לקוח חדש נוצר: ${customerData.name}`,
      });

      // Create notification
      await supabase.from("notifications").insert({
        type: "conversion",
        title: "לקוח חדש!",
        message: `${customerData.name} הפך ללקוח`,
        link: `/customers`,
      });

      setCustomers((prev) => [data, ...prev]);
      
      toast({
        title: "לקוח נוסף בהצלחה",
        description: `${customerData.name} נוסף למערכת`,
      });

      return data;
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "שגיאה ביצירת לקוח",
        variant: "destructive",
      });
      throw error;
    }
  };

  const convertLeadToCustomer = async (lead: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  }) => {
    try {
      // Create customer from lead
      const customer = await createCustomer({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        lead_id: lead.id,
      });

      // Update lead status to converted
      await supabase
        .from("leads")
        .update({ status: "Converted" })
        .eq("id", lead.id);

      return customer;
    } catch (error) {
      console.error("Error converting lead:", error);
      throw error;
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    try {
      const { error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", customerId);

      if (error) throw error;

      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, ...updates } : c))
      );

      toast({ title: "לקוח עודכן" });
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        title: "שגיאה בעדכון לקוח",
        variant: "destructive",
      });
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);

      if (error) throw error;

      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      toast({ title: "לקוח נמחק" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "שגיאה במחיקת לקוח",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    isLoading,
    fetchCustomers,
    createCustomer,
    convertLeadToCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
