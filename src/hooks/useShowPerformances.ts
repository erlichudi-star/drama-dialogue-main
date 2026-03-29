import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export function useShowPerformances(showId?: string) {
  const queryClient = useQueryClient();

  const performancesQuery = useQuery({
    queryKey: ["show_performances", showId],
    queryFn: async () => {
      if (!showId) return [];
      
      const { data, error } = await supabase
        .from("show_performances")
        .select("*")
        .eq("show_id", showId)
        .order("performance_date", { ascending: true });

      if (error) throw error;
      return data as Tables<"show_performances">[];
    },
    enabled: !!showId,
  });

  const allPerformancesQuery = useQuery({
    queryKey: ["all_show_performances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("show_performances")
        .select("*")
        .order("performance_date", { ascending: true });

      if (error) throw error;
      return data as Tables<"show_performances">[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (performance: TablesInsert<"show_performances">) => {
      const { data, error } = await supabase
        .from("show_performances")
        .insert(performance)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["show_performances"] });
      queryClient.invalidateQueries({ queryKey: ["all_show_performances"] });
      toast.success("המופע נוסף בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בהוספת המופע: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...performance }: TablesUpdate<"show_performances"> & { id: string }) => {
      const { data, error } = await supabase
        .from("show_performances")
        .update(performance)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["show_performances"] });
      queryClient.invalidateQueries({ queryKey: ["all_show_performances"] });
      toast.success("המופע עודכן בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון המופע: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("show_performances").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["show_performances"] });
      queryClient.invalidateQueries({ queryKey: ["all_show_performances"] });
      toast.success("המופע נמחק בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה במחיקת המופע: " + error.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("show_performances")
        .update({ is_cancelled: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["show_performances"] });
      queryClient.invalidateQueries({ queryKey: ["all_show_performances"] });
      toast.success("המופע בוטל");
    },
    onError: (error) => {
      toast.error("שגיאה בביטול המופע: " + error.message);
    },
  });

  return {
    performances: performancesQuery.data || [],
    allPerformances: allPerformancesQuery.data || [],
    isLoading: performancesQuery.isLoading || allPerformancesQuery.isLoading,
    error: performancesQuery.error || allPerformancesQuery.error,
    createPerformance: createMutation.mutate,
    updatePerformance: updateMutation.mutate,
    deletePerformance: deleteMutation.mutate,
    cancelPerformance: cancelMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}
