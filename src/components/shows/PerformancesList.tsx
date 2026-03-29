import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar, MapPin, Pencil, Trash2, XCircle, Plus, ExternalLink, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { PerformanceForm, type PerformanceFormData } from "./PerformanceForm";
import { useShowPerformances } from "@/hooks/useShowPerformances";

interface PerformancesListProps {
  show: Tables<"shows">;
}

export function PerformancesList({ show }: PerformancesListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState<Tables<"show_performances"> | null>(null);

  const {
    performances,
    isLoading,
    createPerformance,
    updatePerformance,
    deletePerformance,
    cancelPerformance,
    isCreating,
    isUpdating,
    isDeleting,
    isCancelling,
  } = useShowPerformances(show.id);

  const now = new Date();
  const upcomingPerformances = performances.filter(
    (p) => new Date(p.performance_date) >= now && !p.is_cancelled
  );
  const pastPerformances = performances.filter(
    (p) => new Date(p.performance_date) < now || p.is_cancelled
  );

  const formatDate = (date: string) => {
    return format(new Date(date), "EEEE, d בMMM yyyy בשעה HH:mm", { locale: he });
  };

  const handleAddSubmit = (data: PerformanceFormData & { show_id: string }) => {
    const insert: TablesInsert<"show_performances"> = {
      show_id: data.show_id,
      performance_date: data.performance_date,
      venue: data.venue ?? null,
      seats_available: data.seats_available ?? null,
      ticket_link: data.ticket_link ?? null,
      notes: data.notes ?? null,
    };
    createPerformance(insert, {
      onSuccess: () => setIsAddDialogOpen(false),
    });
  };

  const handleEditSubmit = (data: PerformanceFormData & { show_id: string }) => {
    if (editingPerformance) {
      const update: TablesUpdate<"show_performances"> = {
        performance_date: data.performance_date,
        venue: data.venue ?? null,
        seats_available: data.seats_available ?? null,
        ticket_link: data.ticket_link ?? null,
        notes: data.notes ?? null,
      };
      updatePerformance({ id: editingPerformance.id, ...update }, {
        onSuccess: () => setEditingPerformance(null),
      });
    }
  };

  const PerformanceCard = ({ performance, isPast }: { performance: Tables<"show_performances">; isPast?: boolean }) => (
    <div className={`p-3 border rounded-lg ${isPast ? "bg-muted/50 opacity-70" : "bg-background"} ${performance.is_cancelled ? "border-destructive/50" : "border-border"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{formatDate(performance.performance_date)}</span>
            {performance.is_cancelled && (
              <Badge variant="destructive" className="text-xs">מבוטל</Badge>
            )}
          </div>
          {performance.venue && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{performance.venue}</span>
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {performance.seats_available !== null && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {performance.seats_available} מקומות
              </span>
            )}
            {performance.ticket_link && (
              <a
                href={performance.ticket_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                כרטיסים
              </a>
            )}
          </div>
          {performance.notes && (
            <p className="text-xs text-muted-foreground">{performance.notes}</p>
          )}
        </div>
        {!isPast && !performance.is_cancelled && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEditingPerformance(performance)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-amber-600 hover:text-amber-700"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ביטול מופע</AlertDialogTitle>
                  <AlertDialogDescription>
                    האם לבטל את המופע? המופע יישאר ברשימה כמבוטל.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2">
                  <AlertDialogCancel>חזור</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelPerformance(performance.id)}
                    disabled={isCancelling}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    בטל מופע
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>מחיקת מופע</AlertDialogTitle>
                  <AlertDialogDescription>
                    האם למחוק את המופע לצמיתות? לא ניתן לבטל פעולה זו.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2">
                  <AlertDialogCancel>חזור</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deletePerformance(performance.id)}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    מחק
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">מופעים</h3>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          הוסף מופע
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground">טוען...</div>
      ) : performances.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
          אין מופעים מתוכננים. לחץ על "הוסף מופע" כדי להתחיל.
        </div>
      ) : (
        <>
          {upcomingPerformances.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">מופעים קרובים ({upcomingPerformances.length})</h4>
              <div className="space-y-2">
                {upcomingPerformances.map((p) => (
                  <PerformanceCard key={p.id} performance={p} />
                ))}
              </div>
            </div>
          )}

          {pastPerformances.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">מופעים שעברו / בוטלו ({pastPerformances.length})</h4>
              <div className="space-y-2">
                {pastPerformances.map((p) => (
                  <PerformanceCard key={p.id} performance={p} isPast />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Performance Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת מופע ל-{show.name}</DialogTitle>
          </DialogHeader>
          <PerformanceForm
            showId={show.id}
            defaultVenue={show.venue || undefined}
            defaultTicketLink={show.ticket_link || undefined}
            onSubmit={handleAddSubmit}
            onCancel={() => setIsAddDialogOpen(false)}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Performance Dialog */}
      <Dialog open={!!editingPerformance} onOpenChange={(open) => !open && setEditingPerformance(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת מופע</DialogTitle>
          </DialogHeader>
          {editingPerformance && (
            <PerformanceForm
              showId={show.id}
              performance={editingPerformance}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingPerformance(null)}
              isLoading={isUpdating}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
