import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourseForm, type CourseFormData } from "@/components/courses/CourseForm";
import { CoursesTable } from "@/components/courses/CoursesTable";
import { CourseDetailsSheet } from "@/components/courses/CourseDetailsSheet";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useCourses } from "@/hooks/useCourses";
import { useEnrollments } from "@/hooks/useEnrollments";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  Plus,
  Search,
  GraduationCap,
  BookOpen,
  Users,
  DollarSign,
} from "lucide-react";

export default function Courses() {
  const { courses, isLoading, createCourse, updateCourse, deleteCourse, isCreating, isUpdating, isDeleting } = useCourses();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Tables<"courses"> | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Tables<"courses"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Extract unique filter values
  const years = useMemo(() => {
    const set = new Set(
      courses.map((c) => c.year).filter((y): y is number => y != null)
    );
    return Array.from(set).sort((a, b) => b - a);
  }, [courses]);

  const semesters = useMemo(() => {
    const set = new Set(
      courses.map((c) => c.semester).filter((s): s is string => Boolean(s))
    );
    return Array.from(set);
  }, [courses]);

  const tracks = useMemo(() => {
    const set = new Set(
      courses.map((c) => c.track).filter((t): t is string => Boolean(t))
    );
    return Array.from(set);
  }, [courses]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = !searchQuery || 
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.instructor && course.instructor.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesYear = filterYear === "all" || String(course.year) === filterYear;
      const matchesSemester = filterSemester === "all" || course.semester === filterSemester;
      const matchesTrack = filterTrack === "all" || course.track === filterTrack;
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "active" ? course.is_active : !course.is_active);
      return matchesSearch && matchesYear && matchesSemester && matchesTrack && matchesStatus;
    });
  }, [courses, searchQuery, filterYear, filterSemester, filterTrack, filterStatus]);

  // Stats
  const totalCourses = courses.length;
  const activeCourses = courses.filter((c) => c.is_active).length;

  const handleSubmit = (data: CourseFormData) => {
    // Convert empty strings to null for date and optional fields
    const cleaned: TablesInsert<"courses"> = {
      ...data,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      description: data.description || null,
      age_group: data.age_group || null,
      instructor: data.instructor || null,
      schedule: data.schedule || null,
      payment_link: data.payment_link || null,
      semester: data.semester || null,
      track: data.track || null,
      year: data.year || null,
      price: data.price || null,
      max_participants: data.max_participants || null,
    };
    if (editingCourse) {
      updateCourse({ id: editingCourse.id, ...cleaned }, {
        onSuccess: () => { setIsFormOpen(false); setEditingCourse(null); },
      });
    } else {
      createCourse(cleaned, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const handleEdit = (course: Tables<"courses">) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleRowClick = (course: Tables<"courses">) => {
    setSelectedCourse(course);
  };

  return (
    <MainLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ניהול קורסים</h1>
            <p className="text-muted-foreground">ניהול קורסים, תלמידים ורישומים</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button onClick={() => { setEditingCourse(null); setIsFormOpen(true); }}>
              <Plus className="h-4 w-4 ml-2" />
              הוסף קורס
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה״כ קורסים</p>
                <p className="text-2xl font-bold">{totalCourses}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <BookOpen className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">קורסים פעילים</p>
                <p className="text-2xl font-bold">{activeCourses}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">מסלולים</p>
                <p className="text-2xl font-bold">{tracks.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">שנים</p>
                <p className="text-2xl font-bold">{years.length || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש קורס או מדריך..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="שנה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל השנים</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="סמסטר" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסמסטרים</SelectItem>
              {semesters.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTrack} onValueChange={setFilterTrack}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="מסלול" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המסלולים</SelectItem>
              {tracks.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="active">פעיל</SelectItem>
              <SelectItem value="inactive">לא פעיל</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <CoursesTable
          courses={filteredCourses}
          onEdit={handleEdit}
          onDelete={(id) => deleteCourse(id)}
          onRowClick={handleRowClick}
          isDeleting={isDeleting}
        />

        {/* Add/Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingCourse(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "עריכת קורס" : "הוספת קורס חדש"}</DialogTitle>
            </DialogHeader>
            <CourseForm
              course={editingCourse}
              onSubmit={handleSubmit}
              onCancel={() => { setIsFormOpen(false); setEditingCourse(null); }}
              isLoading={isCreating || isUpdating}
            />
          </DialogContent>
        </Dialog>

        {/* Course Details Sheet */}
        <CourseDetailsSheet
          course={selectedCourse}
          open={!!selectedCourse}
          onOpenChange={(open) => { if (!open) setSelectedCourse(null); }}
        />
      </div>
    </MainLayout>
  );
}
