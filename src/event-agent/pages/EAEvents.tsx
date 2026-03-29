import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { scrapeEvents, generateCampaign } from '../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { Globe, Loader2, Sparkles, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { EAEvent } from '../types';
import { Tables } from '@/integrations/supabase/types';
import EventEditDialog from '../components/EventEditDialog';
import EventDeleteDialog from '../components/EventDeleteDialog';

const cptLabels: Record<string, string> = {
  course: 'קורס', conference: 'כנס', show: 'הצגה', seminar: 'סדנה', event: 'אירוע',
};

const EAEvents = () => {
  const [events, setEvents] = useState<EAEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [cptFilter, setCptFilter] = useState('הכל');
  const [creatingCampaign, setCreatingCampaign] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Tables<'ea_campaign_templates'>[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('auto');
  const [campaignDialogEvent, setCampaignDialogEvent] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EAEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<{ id: string; title: string } | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ea_events')
      .select('*')
      .order('event_date', { ascending: true, nullsFirst: false });
    if (!error && data) setEvents(data as unknown as EAEvent[]);
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase.from('ea_campaign_templates').select('*');
    if (data) setTemplates(data);
  };

  useEffect(() => {
    fetchEvents();
    fetchTemplates();
  }, []);

  const cptTypes = useMemo(() => {
    const types = new Set(events.map(e => e.cpt_type));
    return ['הכל', ...Array.from(types)];
  }, [events]);

  const filtered = useMemo(() => {
    if (cptFilter === 'הכל') return events;
    return events.filter(e => e.cpt_type === cptFilter);
  }, [cptFilter, events]);

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) {
      toast({ title: 'שגיאה', description: 'יש להזין כתובת URL', variant: 'destructive' });
      return;
    }
    setScraping(true);
    const result = await scrapeEvents(scrapeUrl);
    if (result.success) {
      toast({ title: 'סריקה הושלמה ✅', description: `${result.created} חדשים, ${result.updated} עודכנו` });
      await fetchEvents();
      setScrapeUrl('');
    } else {
      toast({ title: 'שגיאה בסריקה', description: result.error || 'שגיאה לא ידועה', variant: 'destructive' });
    }
    setScraping(false);
  };

  const handleCreateCampaign = async (eventId: string) => {
    setCreatingCampaign(eventId);
    const templateId = selectedTemplate === 'auto' ? undefined : selectedTemplate;
    const result = await generateCampaign(eventId, templateId);
    if (result.success) {
      toast({ title: 'קמפיין נוצר! ✅', description: `${result.posts_created} פוסטים נוצרו` });
    } else {
      toast({ title: 'שגיאה', description: result.error || 'יצירת קמפיין נכשלה', variant: 'destructive' });
    }
    setCreatingCampaign(null);
    setCampaignDialogEvent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">אירועים</h1>
      </div>

      {/* Scrape from URL */}
      <div className="flex gap-2">
        <Input
          value={scrapeUrl}
          onChange={e => setScrapeUrl(e.target.value)}
          placeholder="הזן כתובת אתר לסריקת אירועים..."
          className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0] text-sm flex-1"
          onKeyDown={e => e.key === 'Enter' && handleScrape()}
        />
        <Button
          className="bg-[#4f8ef7] hover:bg-[#3b7de6] text-white gap-2"
          onClick={handleScrape}
          disabled={scraping}
        >
          {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          סרוק מהאתר
        </Button>
      </div>

      {/* CPT filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {cptTypes.map(t => (
          <Button
            key={t}
            size="sm"
            variant={cptFilter === t ? 'default' : 'outline'}
            className={cptFilter === t ? 'bg-[#4f8ef7] text-white' : 'border-[#1a1d2e] text-[#94a3b8] hover:text-[#e2e8f0]'}
            onClick={() => setCptFilter(t)}
          >
            {t === 'הכל' ? t : cptLabels[t] || t}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#4f8ef7]" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-[#64748b]">
          <p className="text-sm">אין אירועים עדיין.</p>
          <p className="text-xs mt-1">הזן כתובת אתר לסריקת אירועים</p>
        </div>
      ) : (
        <div className="rounded-lg border border-[#1a1d2e] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1a1d2e] hover:bg-transparent">
                <TableHead className="text-[#64748b] text-right">שם</TableHead>
                <TableHead className="text-[#64748b] text-right">סוג</TableHead>
                <TableHead className="text-[#64748b] text-right">תאריך</TableHead>
                <TableHead className="text-[#64748b] text-right">מיקום</TableHead>
                <TableHead className="text-[#64748b] text-right">מחיר</TableHead>
                <TableHead className="text-[#64748b] text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(e => (
                <TableRow key={e.id} className="border-[#1a1d2e] hover:bg-[#1a1d2e]/30">
                  <TableCell className="text-sm text-[#e2e8f0] font-medium">{e.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] border-[#4f8ef7]/30 text-[#4f8ef7]">
                      {cptLabels[e.cpt_type] || e.cpt_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#94a3b8]">
                    {e.event_date ? format(parseISO(e.event_date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-[#94a3b8]">{e.location || '-'}</TableCell>
                  <TableCell className="text-sm text-[#e2e8f0]">{e.price ? `₪${e.price}` : '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Dialog open={campaignDialogEvent === e.id} onOpenChange={open => setCampaignDialogEvent(open ? e.id : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-xs border-[#4f8ef7]/50 text-[#4f8ef7] hover:bg-[#4f8ef7]/10 gap-1">
                            <Sparkles className="w-3 h-3" />
                            צור קמפיין
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0d0f1a] border-[#1a1d2e] text-[#e2e8f0]">
                          <DialogHeader>
                            <DialogTitle className="text-right">צור קמפיין עבור: {e.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs text-[#64748b] block mb-1">תבנית קמפיין</label>
                              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                <SelectTrigger className="bg-[#07080d] border-[#1a1d2e] text-sm text-[#e2e8f0]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0d0f1a] border-[#1a1d2e]">
                                  <SelectItem value="auto">ברירת מחדל (אוטומטי)</SelectItem>
                                  {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              className="w-full bg-[#4f8ef7] hover:bg-[#3b7de6] text-white gap-2"
                              onClick={() => handleCreateCampaign(e.id)}
                              disabled={creatingCampaign === e.id}
                            >
                              {creatingCampaign === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                              צור קמפיין עם AI
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#64748b] hover:text-[#e2e8f0]">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0d0f1a] border-[#1a1d2e]">
                          <DropdownMenuItem onClick={() => setEditingEvent(e)} className="text-[#e2e8f0] focus:bg-[#1a1d2e] gap-2 cursor-pointer">
                            <Pencil className="w-3.5 h-3.5" />
                            ערוך
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingEvent({ id: e.id, title: e.title })} className="text-red-400 focus:bg-[#1a1d2e] focus:text-red-400 gap-2 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                            מחק
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EventEditDialog event={editingEvent} onClose={() => setEditingEvent(null)} onSaved={fetchEvents} />
      <EventDeleteDialog eventId={deletingEvent?.id || null} eventTitle={deletingEvent?.title || ''} onClose={() => setDeletingEvent(null)} onDeleted={fetchEvents} />
    </div>
  );
};

export default EAEvents;
