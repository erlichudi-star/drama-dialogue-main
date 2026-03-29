import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  interest?: string;
  ad_name?: string;
  campaign_id?: string;
  last_interaction_at?: string;
  created_at: string;
  updated_at: string;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "שגיאה בטעינת לידים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createLead = async (leadData: {
    name: string;
    phone: string;
    email?: string;
    source: string;
    interest?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email || null,
          source: leadData.source,
          interest: leadData.interest || null,
          status: "New",
        })
        .select()
        .single();

      if (error) throw error;

      // Also create an activity for this lead creation
      await supabase.from("activities").insert({
        lead_id: data.id,
        type: "lead_created",
        description: `ליד חדש נוצר: ${leadData.name}`,
        metadata: { source: leadData.source, interest: leadData.interest },
      });

      // Create a notification
      await supabase.from("notifications").insert({
        type: "new_lead",
        title: "ליד חדש!",
        message: `${leadData.name} - ${leadData.phone}`,
        link: `/chat?lead=${data.id}`,
      });

      setLeads((prev) => [data, ...prev]);
      
      toast({
        title: "ליד נוסף בהצלחה",
        description: `${leadData.name} נוסף למערכת`,
      });

      return data;
    } catch (error) {
      console.error("Error creating lead:", error);
      toast({
        title: "שגיאה בהוספת ליד",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", leadId);

      if (error) throw error;

      // Create activity for status change
      await supabase.from("activities").insert({
        lead_id: leadId,
        type: "status_change",
        description: `סטטוס שונה ל: ${status}`,
      });

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status } : lead
        )
      );

      toast({
        title: "סטטוס עודכן",
      });
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast({
        title: "שגיאה בעדכון סטטוס",
        variant: "destructive",
      });
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadId);

      if (error) throw error;

      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
      
      toast({
        title: "ליד נמחק",
      });
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "שגיאה במחיקת ליד",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLeads();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("leads-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLeads((prev) => [payload.new as Lead, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setLeads((prev) =>
              prev.map((lead) =>
                lead.id === payload.new.id ? (payload.new as Lead) : lead
              )
            );
          } else if (payload.eventType === "DELETE") {
            setLeads((prev) =>
              prev.filter((lead) => lead.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads]);

  return {
    leads,
    isLoading,
    fetchLeads,
    createLead,
    updateLeadStatus,
    deleteLead,
  };
}
