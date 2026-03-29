import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { EAEvent } from '../types';

const cptOptions = [
  { value: 'event', label: 'אירוע' },
  { value: 'course', label: 'קורס' },
  { value: 'conference', label: 'כנס' },
  { value: 'show', label: 'הצגה' },
  { value: 'seminar', label: 'סדנה' },
];

interface EventEditDialogProps {
  event: EAEvent | null;
  onClose: () => void;
  onSaved: () => void;
}

const EventEditDialog = ({ event, onClose, onSaved }: EventEditDialogProps) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    cpt_type: 'event',
    event_date: '',
    location: '',
    price: '',
    early_bird_price: '',
    url: '',
  });

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        cpt_type: event.cpt_type || 'event',
        event_date: event.event_date ? event.event_date.slice(0, 16) : '',
        location: event.location || '',
        price: event.price?.toString() || '',
        early_bird_price: event.early_bird_price?.toString() || '',
        url: event.url || '',
      });
    }
  }, [event]);

  const handleSave = async () => {
    if (!event || !form.title.trim()) {
      toast({ title: 'שגיאה', description: 'שם האירוע הוא שדה חובה', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('ea_events')
      .update({
        title: form.title.trim(),
        cpt_type: form.cpt_type,
        event_date: form.event_date || null,
        location: form.location || null,
        price: form.price ? Number(form.price) : null,
        early_bird_price: form.early_bird_price ? Number(form.early_bird_price) : null,
        url: form.url || null,
      })
      .eq('id', event.id);
    
    setSaving(false);
    if (error) {
      toast({ title: 'שגיאה בשמירה', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'האירוע עודכן ✅' });
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open={!!event} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-[#0d0f1a] border-[#1a1d2e] text-[#e2e8f0]">
        <DialogHeader>
          <DialogTitle className="text-right">עריכת אירוע</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#64748b] block mb-1">שם</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0] text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#64748b] block mb-1">סוג</label>
            <Select value={form.cpt_type} onValueChange={v => setForm(f => ({ ...f, cpt_type: v }))}>
              <SelectTrigger className="bg-[#07080d] border-[#1a1d2e] text-sm text-[#e2e8f0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d0f1a] border-[#1a1d2e]">
                {cptOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-[#64748b] block mb-1">תאריך</label>
            <Input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0] text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#64748b] block mb-1">מיקום</label>
            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0] text-sm" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-[#64748b] block mb-1">מחיר</label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0] text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-[#64748b] block mb-1">מחיר מוקדם</label>
              <Input type="number" value={form.early_bird_price} onChange={e => setForm(f => ({ ...f, early_bird_price: e.target.value }))} className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0] text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#64748b] block mb-1">URL</label>
            <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0] text-sm" dir="ltr" />
          </div>
          <Button className="w-full bg-[#4f8ef7] hover:bg-[#3b7de6] text-white gap-2" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            שמור שינויים
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventEditDialog;
