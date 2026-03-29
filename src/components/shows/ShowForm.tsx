import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tables } from "@/integrations/supabase/types";

const showSchema = z.object({
  name: z.string().min(1, "שם ההצגה הוא שדה חובה"),
  description: z.string().optional(),
  venue: z.string().optional(),
  price: z.coerce.number().optional(),
  vip_price: z.coerce.number().optional(),
  ticket_link: z.string().optional(),
  duration_minutes: z.coerce.number().optional(),
  age_restriction: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type ShowFormData = z.infer<typeof showSchema>;

interface ShowFormProps {
  show?: Tables<"shows"> | null;
  onSubmit: (data: ShowFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ShowForm({ show, onSubmit, onCancel, isLoading }: ShowFormProps) {
  const form = useForm<ShowFormData>({
    resolver: zodResolver(showSchema),
    defaultValues: {
      name: show?.name || "",
      description: show?.description || "",
      venue: show?.venue || "",
      price: show?.price || undefined,
      vip_price: show?.vip_price || undefined,
      ticket_link: show?.ticket_link || "",
      duration_minutes: show?.duration_minutes || undefined,
      age_restriction: show?.age_restriction || "",
      is_active: show?.is_active ?? true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>שם ההצגה *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="הזן שם הצגה" />
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
                <FormLabel>מיקום ברירת מחדל</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="שם האולם / מיקום" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>אורך (דקות)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="90" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age_restriction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>הגבלת גיל</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="לדוגמה: 6+" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מחיר רגיל (₪)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="0" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vip_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מחיר VIP (₪)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="0" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ticket_link"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>קישור לרכישת כרטיסים (ברירת מחדל)</FormLabel>
                <FormControl>
                  <Input {...field} type="url" placeholder="https://..." dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>תיאור ההצגה</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="תיאור מפורט של ההצגה..." rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormLabel className="mt-2">הצגה פעילה</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "שומר..." : show ? "עדכן הצגה" : "הוסף הצגה"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            ביטול
          </Button>
        </div>
      </form>
    </Form>
  );
}
