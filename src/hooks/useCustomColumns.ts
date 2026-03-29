import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CustomColumn {
  id: string;
  entity_type: string;
  column_name: string;
  column_label: string;
  column_type: string;
  options?: unknown;
  is_required: boolean;
  display_order: number;
  created_at: string;
}

export interface CustomColumnValue {
  id: string;
  custom_column_id: string;
  entity_id: string;
  value: string;
}

export function useCustomColumns(entityType: string) {
  const [columns, setColumns] = useState<CustomColumn[]>([]);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchColumns = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("custom_columns")
        .select("*")
        .eq("entity_type", entityType)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setColumns(data || []);
    } catch (error) {
      console.error("Error fetching custom columns:", error);
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  const fetchValues = useCallback(async (entityIds: string[]) => {
    if (entityIds.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from("custom_column_values")
        .select("*")
        .in("entity_id", entityIds);

      if (error) throw error;

      // Organize values by entity_id -> column_id -> value
      const organized: Record<string, Record<string, string>> = {};
      data?.forEach((v) => {
        if (!organized[v.entity_id]) organized[v.entity_id] = {};
        organized[v.entity_id][v.custom_column_id] = v.value || "";
      });
      setValues(organized);
    } catch (error) {
      console.error("Error fetching custom column values:", error);
    }
  }, []);

  const createColumn = async (columnData: {
    column_name: string;
    column_label: string;
    column_type: string;
    options?: { label: string; value: string }[];
    is_required?: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from("custom_columns")
        .insert({
          entity_type: entityType,
          column_name: columnData.column_name,
          column_label: columnData.column_label,
          column_type: columnData.column_type,
          options: columnData.options || null,
          is_required: columnData.is_required || false,
          display_order: columns.length,
        })
        .select()
        .single();

      if (error) throw error;

      setColumns((prev) => [...prev, data]);
      toast({ title: "עמודה נוספה בהצלחה" });
      return data;
    } catch (error) {
      console.error("Error creating custom column:", error);
      toast({
        title: "שגיאה ביצירת עמודה",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateValue = async (entityId: string, columnId: string, value: string) => {
    try {
      const { error } = await supabase
        .from("custom_column_values")
        .upsert({
          custom_column_id: columnId,
          entity_id: entityId,
          value,
        }, {
          onConflict: "custom_column_id,entity_id",
        });

      if (error) throw error;

      setValues((prev) => ({
        ...prev,
        [entityId]: {
          ...(prev[entityId] || {}),
          [columnId]: value,
        },
      }));
    } catch (error) {
      console.error("Error updating custom column value:", error);
      toast({
        title: "שגיאה בעדכון ערך",
        variant: "destructive",
      });
    }
  };

  const deleteColumn = async (columnId: string) => {
    try {
      const { error } = await supabase
        .from("custom_columns")
        .delete()
        .eq("id", columnId);

      if (error) throw error;

      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      toast({ title: "עמודה נמחקה" });
    } catch (error) {
      console.error("Error deleting custom column:", error);
      toast({
        title: "שגיאה במחיקת עמודה",
        variant: "destructive",
      });
    }
  };

  return {
    columns,
    values,
    isLoading,
    fetchColumns,
    fetchValues,
    createColumn,
    updateValue,
    deleteColumn,
  };
}
