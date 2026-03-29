import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EventDeleteDialogProps {
  eventId: string | null;
  eventTitle: string;
  onClose: () => void;
  onDeleted: () => void;
}

const EventDeleteDialog = ({ eventId, eventTitle, onClose, onDeleted }: EventDeleteDialogProps) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!eventId) return;
    setDeleting(true);

    // Delete related posts and campaigns first
    await supabase.from('ea_scheduled_posts').delete().eq('event_id', eventId);
    const { data: campaigns } = await supabase.from('ea_campaigns').select('id').eq('event_id', eventId);
    if (campaigns?.length) {
      const campaignIds = campaigns.map(c => c.id);
      await supabase.from('ea_scheduled_posts').delete().in('campaign_id', campaignIds);
      await supabase.from('ea_campaigns').delete().eq('event_id', eventId);
    }

    const { error } = await supabase.from('ea_events').delete().eq('id', eventId);
    setDeleting(false);

    if (error) {
      toast({ title: 'שגיאה במחיקה', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'האירוע נמחק ✅' });
      onDeleted();
      onClose();
    }
  };

  return (
    <AlertDialog open={!!eventId} onOpenChange={open => !open && onClose()}>
      <AlertDialogContent className="bg-[#0d0f1a] border-[#1a1d2e] text-[#e2e8f0]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">מחיקת אירוע</AlertDialogTitle>
          <AlertDialogDescription className="text-right text-[#94a3b8]">
            האם למחוק את <strong>{eventTitle}</strong>? פעולה זו תמחק גם את כל הקמפיינים והפוסטים המקושרים. לא ניתן לבטל פעולה זו.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
          <AlertDialogCancel className="border-[#1a1d2e] text-[#94a3b8] hover:bg-[#1a1d2e] hover:text-[#e2e8f0]">ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
            {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            מחק
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EventDeleteDialog;
