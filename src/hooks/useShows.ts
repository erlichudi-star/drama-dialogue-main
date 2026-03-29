import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export function useShows() {
  const queryClient = useQueryClient();

  const showsQuery = useQuery({
    queryKey: ["shows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .order("show_date", { ascending: true });

      if (error) throw error;
      return data as Tables<"shows">[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (show: TablesInsert<"shows">) => {
      const { data, error } = await supabase
        .from("shows")
        .insert(show)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
      toast.success("ההצגה נוספה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בהוספת ההצגה: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...show }: TablesUpdate<"shows"> & { id: string }) => {
      const { data, error } = await supabase
        .from("shows")
        .update(show)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
      toast.success("ההצגה עודכנה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון ההצגה: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
      toast.success("ההצגה נמחקה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה במחיקת ההצגה: " + error.message);
    },
  });

  return {
    shows: showsQuery.data || [],
    isLoading: showsQuery.isLoading,
    error: showsQuery.error,
    createShow: createMutation.mutate,
    updateShow: updateMutation.mutate,
    deleteShow: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
