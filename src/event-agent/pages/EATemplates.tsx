import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Json, Tables } from '@/integrations/supabase/types';

const cptLabels: Record<string, string> = {
  course: 'קורס', conference: 'כנס', show: 'הצגה/מופע', seminar: 'סדנה', event: 'אירוע',
};

const platformIcons: Record<string, string> = {
  facebook: '📘', instagram: '📷', email: '📧', whatsapp: '💬',
};

interface TemplateStep {
  days_before: number;
  phase: string;
  platforms: string[];
  content_hint: string;
}

function parseTemplateSteps(steps: Json): TemplateStep[] {
  if (!Array.isArray(steps)) return [];
  return steps as TemplateStep[];
}

const EATemplates = () => {
  const [templates, setTemplates] = useState<Tables<'ea_campaign_templates'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCptType, setNewCptType] = useState('event');
  const [newSteps, setNewSteps] = useState<TemplateStep[]>([
    { days_before: 60, phase: 'הכרזה', platforms: ['facebook', 'instagram'], content_hint: 'הכרזה ראשונית' },
  ]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data } = await supabase.from('ea_campaign_templates').select('*').order('created_at', { ascending: false });
    if (data) setTemplates(data);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleAddStep = () => {
    setNewSteps(prev => [...prev, { days_before: 7, phase: '', platforms: ['whatsapp'], content_hint: '' }]);
  };

  const handleRemoveStep = (index: number) => {
    setNewSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: keyof TemplateStep, value: TemplateStep[keyof TemplateStep]) => {
    setNewSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    if (!newName.trim()) {
      toast({ title: 'שגיאה', description: 'יש להזין שם לתבנית', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('ea_campaign_templates').insert({
      name: newName,
      cpt_type: newCptType,
      steps: newSteps as unknown as Json,
    });
    if (!error) {
      toast({ title: 'נשמר ✅', description: 'התבנית נוצרה בהצלחה' });
      setDialogOpen(false);
      setNewName('');
      setNewSteps([{ days_before: 60, phase: 'הכרזה', platforms: ['facebook', 'instagram'], content_hint: 'הכרזה ראשונית' }]);
      await fetchTemplates();
    } else {
      toast({ title: 'שגיאה', description: 'יצירת התבנית נכשלה', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('ea_campaign_templates').delete().eq('id', id);
    toast({ title: 'נמחק', description: 'התבנית נמחקה' });
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#4f8ef7]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">תבניות קמפיין</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#4f8ef7] hover:bg-[#3b7de6] text-white gap-1">
              <Plus className="w-4 h-4" /> תבנית חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d0f1a] border-[#1a1d2e] text-[#e2e8f0] max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-right">תבנית קמפיין חדשה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="שם התבנית" className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0]" />
              <Select value={newCptType} onValueChange={setNewCptType}>
                <SelectTrigger className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0d0f1a] border-[#1a1d2e]">
                  {Object.entries(cptLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94a3b8]">שלבים</span>
                  <Button size="sm" variant="outline" className="text-xs border-[#1a1d2e] text-[#94a3b8]" onClick={handleAddStep}>
                    <Plus className="w-3 h-3 ml-1" /> הוסף שלב
                  </Button>
                </div>
                {newSteps.map((step, i) => (
                  <div key={i} className="rounded border border-[#1a1d2e] bg-[#07080d] p-3 space-y-2">
                    <div className="flex gap-2 items-center">
                      <Input type="number" value={step.days_before} onChange={e => handleStepChange(i, 'days_before', parseInt(e.target.value) || 0)} className="bg-[#0d0f1a] border-[#1a1d2e] text-[#e2e8f0] w-20 text-xs" placeholder="ימים" />
                      <span className="text-xs text-[#64748b]">ימים לפני</span>
                      <Input value={step.phase} onChange={e => handleStepChange(i, 'phase', e.target.value)} className="bg-[#0d0f1a] border-[#1a1d2e] text-[#e2e8f0] flex-1 text-xs" placeholder="שם השלב" />
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 p-1" onClick={() => handleRemoveStep(i)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input value={step.content_hint} onChange={e => handleStepChange(i, 'content_hint', e.target.value)} className="bg-[#0d0f1a] border-[#1a1d2e] text-[#e2e8f0] text-xs" placeholder="רמז לתוכן" />
                  </div>
                ))}
              </div>

              <Button className="w-full bg-[#4f8ef7] hover:bg-[#3b7de6] text-white" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                שמור תבנית
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 text-[#64748b] text-sm">אין תבניות עדיין. צור תבנית חדשה כדי להתחיל.</div>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {templates.map(t => (
            <AccordionItem key={t.id} value={t.id} className="rounded-lg border border-[#1a1d2e] bg-[#0d0f1a] px-4">
              <AccordionTrigger className="text-sm text-[#e2e8f0] hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant="outline" className="text-[10px] border-[#4f8ef7]/30 text-[#4f8ef7]">
                    {cptLabels[t.cpt_type] || t.cpt_type}
                  </Badge>
                  <span>{t.name}</span>
                  <span className="text-[#64748b] text-xs">({parseTemplateSteps(t.steps).length} שלבים)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {parseTemplateSteps(t.steps).map((step, i: number) => (
                    <div key={i} className="flex items-center gap-4 rounded border border-[#1a1d2e] bg-[#07080d] px-3 py-2">
                      <span className="text-xs font-mono text-[#4f8ef7] w-16 shrink-0">-{step.days_before}d</span>
                      <span className="text-sm text-[#e2e8f0] flex-1">{step.phase}</span>
                      <span className="text-xs shrink-0">{(step.platforms || []).map((pl: string) => platformIcons[pl] || pl).join(' ')}</span>
                      <span className="text-xs text-[#64748b] max-w-[200px] truncate">{step.content_hint}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button size="sm" variant="outline" className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="w-3 h-3 ml-1" /> מחק תבנית
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default EATemplates;
