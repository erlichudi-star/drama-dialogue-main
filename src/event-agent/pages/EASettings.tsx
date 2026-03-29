import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { saveEASetting, loadEASettings } from '../api';
import { toast } from '@/hooks/use-toast';

interface SettingGroup {
  title: string;
  fields: { key: string; label: string; type?: string }[];
}

const groups: SettingGroup[] = [
  {
    title: 'סריקת אתרים',
    fields: [
      { key: 'ea_default_scrape_url', label: 'כתובת ברירת מחדל לסריקה' },
    ],
  },
  {
    title: 'MailerLite',
    fields: [
      { key: 'ea_mailerlite_key', label: 'API Key', type: 'password' },
    ],
  },
  {
    title: 'WhatsApp',
    fields: [
      { key: 'ea_default_wa_phone', label: 'מספר טלפון ברירת מחדל (עם קידומת מדינה)' },
    ],
  },
  {
    title: 'Meta (Facebook / Instagram)',
    fields: [
      { key: 'ea_meta_token', label: 'Access Token', type: 'password' },
      { key: 'ea_meta_page_id', label: 'Facebook Page ID' },
      { key: 'ea_meta_ig_account_id', label: 'Instagram Business Account ID' },
    ],
  },
];

const EASettings = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [requireApproval, setRequireApproval] = useState(true);
  const [autoSend, setAutoSend] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadEASettings().then(settings => {
      setValues(settings);
      if (settings.ea_require_approval !== undefined) {
        setRequireApproval(settings.ea_require_approval === 'true');
      }
      if (settings.ea_auto_send !== undefined) {
        setAutoSend(settings.ea_auto_send === 'true');
      }
      setLoaded(true);
    });
  }, []);

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(values).map(([key, value]) =>
        saveEASetting(key, value)
      );
      promises.push(saveEASetting('ea_require_approval', String(requireApproval)));
      promises.push(saveEASetting('ea_auto_send', String(autoSend)));
      await Promise.all(promises);
      toast({ title: 'נשמר', description: 'ההגדרות נשמרו בהצלחה' });
    } catch {
      toast({ title: 'שגיאה', description: 'שמירת ההגדרות נכשלה', variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">הגדרות</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-[#4f8ef7] hover:bg-[#3b7de6] text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
          שמור הגדרות
        </Button>
      </div>

      {groups.map(g => (
        <div key={g.title} className="rounded-lg border border-[#1a1d2e] bg-[#0d0f1a] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#e2e8f0]">{g.title}</h2>
          {g.fields.map(f => (
            <div key={f.key}>
              <label className="text-xs text-[#64748b] block mb-1">{f.label}</label>
              <Input
                type={f.type || 'text'}
                value={values[f.key] || ''}
                onChange={e => handleChange(f.key, e.target.value)}
                className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0] text-sm"
                placeholder={f.label}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Global toggles */}
      <div className="rounded-lg border border-[#1a1d2e] bg-[#0d0f1a] p-4 space-y-4">
        <h2 className="text-sm font-semibold text-[#e2e8f0]">הגדרות כלליות</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#94a3b8]">דרוש אישור לפני פרסום</span>
          <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#94a3b8]">שליחה אוטומטית</span>
          <Switch checked={autoSend} onCheckedChange={setAutoSend} />
        </div>
      </div>

      <p className="text-xs text-[#64748b]">
        💡 הגדרות WhatsApp (Whapi) מוגדרות באופן גלובלי במערכת הראשית.
      </p>
      <p className="text-xs text-[#64748b]">
        🤖 Lovable AI ו-Firecrawl מוגדרים אוטומטית ואינם דורשים הגדרה ידנית.
      </p>
    </div>
  );
};

export default EASettings;
