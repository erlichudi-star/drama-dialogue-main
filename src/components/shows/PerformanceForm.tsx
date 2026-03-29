import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tables } from "@/integrations/supabase/types";

const performanceSchema = z.object({
  performance_date: z.string().min(1, "תאריך ושעה הם שדות חובה"),
  venue: z.string().optional(),
  seats_available: z.coerce.number().optional(),
  ticket_link: z.string().optional(),
  notes: z.string().optional(),
});

export type PerformanceFormData = z.infer<typeof performanceSchema>;

interface PerformanceFormProps {
  showId: string;
  performance?: Tables<"show_performances"> | null;
  defaultVenue?: string;
  defaultTicketLink?: string;
  onSubmit: (data: PerformanceFormData & { show_id: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PerformanceForm({ 
  showId, 
  performance, 
  defaultVenue,
  defaultTicketLink,
  onSubmit, 
  onCancel, 
  isLoading 
}: PerformanceFormProps) {
  const form = useForm<PerformanceFormData>({
    resolver: zodResolver(performanceSchema),
    defaultValues: {
      performance_date: performance?.performance_date 
        ? performance.performance_date.slice(0, 16) 
        : "",
      venue: performance?.venue || defaultVenue || "",
      seats_available: performance?.seats_available || undefined,
      ticket_link: performance?.ticket_link || defaultTicketLink || "",
      notes: performance?.notes || "",
    },
  });

  const handleSubmit = (data: PerformanceFormData) => {
    onSubmit({ ...data, show_id: showId });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="performance_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>תאריך ושעה *</FormLabel>
                <FormControl>
                  <Input {...field} type="datetime-local" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מיקום</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="שם האולם / מיקום" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seats_available"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מקומות פנויים</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="100" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ticket_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>קישור לכרטיסים</FormLabel>
                <FormControl>
                  <Input {...field} type="url" placeholder="https://..." dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>הערות</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="הערות למופע ספציפי..." rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "שומר..." : performance ? "עדכן מופע" : "הוסף מופע"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            ביטול
          </Button>
        </div>
      </form>
    </Form>
  );
}
