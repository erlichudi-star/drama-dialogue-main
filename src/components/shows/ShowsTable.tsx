import { useState } from "react";
import { Pencil, Trash2, ExternalLink, Clock, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import { PerformancesList } from "./PerformancesList";
import { useShowPerformances } from "@/hooks/useShowPerformances";

interface ShowsTableProps {
  shows: Tables<"shows">[];
  onEdit: (show: Tables<"shows">) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function ShowsTable({ shows, onEdit, onDelete, isDeleting }: ShowsTableProps) {
  const [selectedShow, setSelectedShow] = useState<Tables<"shows"> | null>(null);
  const { allPerformances } = useShowPerformances();

  const formatPrice = (price: number | null) => {
    if (!price) return "-";
    return `₪${price.toLocaleString("he-IL")}`;
  };

  const getUpcomingCount = (showId: string) => {
    const now = new Date();
    return allPerformances.filter(
      (p) => p.show_id === showId && new Date(p.performance_date) >= now && !p.is_cancelled
    ).length;
  };

  if (shows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        אין הצגות להצגה. לחץ על "הוסף הצגה" כדי להתחיל.
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto" dir="rtl">
        <div className="min-w-[800px] rounded-lg border border-border overflow-hidden">
          <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right">שם ההצגה</TableHead>
              <TableHead className="text-right">מיקום ברירת מחדל</TableHead>
              <TableHead className="text-right">מחיר</TableHead>
              <TableHead className="text-right">מופעים קרובים</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right w-[120px]">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shows.map((show) => {
              const upcomingCount = getUpcomingCount(show.id);
              return (
                <TableRow key={show.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{show.name}</span>
                      {show.duration_minutes && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {show.duration_minutes} דקות
                        </span>
                      )}
                      {show.ticket_link && (
                        <a
                          href={show.ticket_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          רכישת כרטיסים
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {show.venue ? (
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {show.venue}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span>{formatPrice(show.price)}</span>
                      {show.vip_price && (
                        <span className="text-xs text-muted-foreground">
                          VIP: {formatPrice(show.vip_price)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => setSelectedShow(show)}
                    >
                      <Calendar className="h-4 w-4" />
                      <Badge variant={upcomingCount > 0 ? "default" : "secondary"}>
                        {upcomingCount}
                      </Badge>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={show.is_active ? "default" : "secondary"}>
                      {show.is_active ? "פעילה" : "לא פעילה"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(show)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
                            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                            <AlertDialogDescription>
                              פעולה זו תמחק את ההצגה "{show.name}" וכל המופעים שלה לצמיתות. לא ניתן לבטל פעולה זו.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse gap-2">
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(show.id)}
                              disabled={isDeleting}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {isDeleting ? "מוחק..." : "מחק"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          </Table>
        </div>
      </div>

      {/* Performances Dialog */}
      <Dialog open={!!selectedShow} onOpenChange={(open) => !open && setSelectedShow(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              מופעים - {selectedShow?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedShow && <PerformancesList show={selectedShow} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
