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

const courseSchema = z.object({
  name: z.string().min(1, "שם הקורס הוא שדה חובה"),
  description: z.string().optional(),
  age_group: z.string().optional(),
  instructor: z.string().optional(),
  schedule: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  price: z.coerce.number().optional(),
  max_participants: z.coerce.number().optional(),
  payment_link: z.string().optional(),
  is_active: z.boolean().default(true),
  year: z.coerce.number().optional(),
  semester: z.string().optional(),
  track: z.string().optional(),
});

export type CourseFormData = z.infer<typeof courseSchema>;

interface CourseFormProps {
  course?: Tables<"courses"> | null;
  onSubmit: (data: CourseFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CourseForm({ course, onSubmit, onCancel, isLoading }: CourseFormProps) {
  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: course?.name || "",
      description: course?.description || "",
      age_group: course?.age_group || "",
      instructor: course?.instructor || "",
      schedule: course?.schedule || "",
      start_date: course?.start_date || "",
      end_date: course?.end_date || "",
      price: course?.price || undefined,
      max_participants: course?.max_participants || undefined,
      payment_link: course?.payment_link || "",
      is_active: course?.is_active ?? true,
      year: course?.year ?? undefined,
      semester: course?.semester ?? "",
      track: course?.track ?? "",
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
                <FormLabel>שם הקורס *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="הזן שם קורס" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instructor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מדריך</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="שם המדריך" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age_group"
            render={({ field }) => (
              <FormItem>
                <FormLabel>קבוצת גיל</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="לדוגמה: 8-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="schedule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מועד</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="לדוגמה: ימי שני 16:00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>תאריך התחלה</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>תאריך סיום</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
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
                <FormLabel>מחיר (₪)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="0" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_participants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מקסימום משתתפים</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>שנת לימודים</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="2025" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="semester"
            render={({ field }) => (
              <FormItem>
                <FormLabel>סמסטר</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="א / ב / קיץ" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="track"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מסלול לימודים</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="לדוגמה: מתקדמים" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_link"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>קישור לתשלום</FormLabel>
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
                <FormLabel>תיאור הקורס</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="תיאור מפורט של הקורס..." rows={3} />
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
                <FormLabel className="mt-2">קורס פעיל</FormLabel>
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
            {isLoading ? "שומר..." : course ? "עדכן קורס" : "הוסף קורס"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            ביטול
          </Button>
        </div>
      </form>
    </Form>
  );
}
