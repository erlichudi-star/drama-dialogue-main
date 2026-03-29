import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generatePostContent } from '../api';
import { toast } from '@/hooks/use-toast';
import { EAScheduledPost } from '../types';

interface Props {
  post: EAScheduledPost;
  onApprove: (id: string) => void;
  onSendWA: (id: string) => void;
  onReject: (id: string) => void;
  onContentUpdated?: () => void;
}

const PostEditor = ({ post, onApprove, onSendWA, onReject, onContentUpdated }: Props) => {
  const [emailContent, setEmailContent] = useState(post.content_email || '');
  const [fbContent, setFbContent] = useState(post.content_facebook || '');
  const [igContent, setIgContent] = useState(post.content_instagram || '');
  const [waContent, setWaContent] = useState(post.content_whatsapp || '');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await generatePostContent(post.id);
    if (result.success && result.content) {
      if (result.content.email) setEmailContent(result.content.email);
      if (result.content.facebook) setFbContent(result.content.facebook);
      if (result.content.instagram) setIgContent(result.content.instagram);
      if (result.content.whatsapp) setWaContent(result.content.whatsapp);
      toast({ title: 'תוכן נוצר ✅', description: 'התוכן נוצר בהצלחה ונשמר' });
      onContentUpdated?.();
    } else {
      toast({ title: 'שגיאה', description: result.error || 'יצירת תוכן נכשלה', variant: 'destructive' });
    }
    setGenerating(false);
  };

  const handleSaveContent = async () => {
    setSaving(true);
    await supabase.from('ea_scheduled_posts').update({
      content_email: emailContent || null,
      content_facebook: fbContent || null,
      content_instagram: igContent || null,
      content_whatsapp: waContent || null,
    }).eq('id', post.id);
    toast({ title: 'נשמר', description: 'התוכן עודכן' });
    setSaving(false);
  };

  return (
    <div className="rounded-lg border border-[#1a1d2e] bg-[#0d0f1a] p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#e2e8f0]">{post.event?.title || 'פוסט'}</h3>
          <p className="text-xs text-[#64748b]">{post.phase} · {post.target_date}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-[#1a1d2e] text-[#94a3b8] hover:bg-[#1a1d2e]/50"
            onClick={handleSaveContent}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : null}
            💾 שמור
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-[#4f8ef7] text-[#4f8ef7] hover:bg-[#4f8ef7]/10"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : null}
            🤖 צור תוכן
          </Button>
        </div>
      </div>

      <Tabs defaultValue="email" dir="rtl">
        <TabsList className="bg-[#1a1d2e] w-full">
          <TabsTrigger value="email" className="flex-1 text-xs data-[state=active]:bg-[#4f8ef7] data-[state=active]:text-white">Email</TabsTrigger>
          <TabsTrigger value="facebook" className="flex-1 text-xs data-[state=active]:bg-[#4f8ef7] data-[state=active]:text-white">Facebook</TabsTrigger>
          <TabsTrigger value="instagram" className="flex-1 text-xs data-[state=active]:bg-[#4f8ef7] data-[state=active]:text-white">Instagram</TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex-1 text-xs data-[state=active]:bg-[#4f8ef7] data-[state=active]:text-white">WhatsApp</TabsTrigger>
        </TabsList>
        <TabsContent value="email">
          <Textarea value={emailContent} onChange={e => setEmailContent(e.target.value)} className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0] min-h-[120px] text-sm" placeholder="תוכן מייל..." />
        </TabsContent>
        <TabsContent value="facebook">
          <Textarea value={fbContent} onChange={e => setFbContent(e.target.value)} className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0] min-h-[120px] text-sm" placeholder="תוכן פייסבוק..." />
        </TabsContent>
        <TabsContent value="instagram">
          <Textarea value={igContent} onChange={e => setIgContent(e.target.value)} className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0] min-h-[120px] text-sm" placeholder="תוכן אינסטגרם..." />
        </TabsContent>
        <TabsContent value="whatsapp">
          <Textarea value={waContent} onChange={e => setWaContent(e.target.value)} className="bg-[#07080d] border-[#1a1d2e] text-[#e2e8f0] min-h-[120px] text-sm" placeholder="תוכן וואטסאפ..." />
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 mt-4 justify-end">
        <Button size="sm" variant="outline" className="text-xs border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => onReject(post.id)}>
          ❌ דחה
        </Button>
        <Button size="sm" variant="outline" className="text-xs border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10" onClick={() => onSendWA(post.id)}>
          💬 WA עכשיו
        </Button>
        <Button size="sm" className="text-xs bg-[#4f8ef7] hover:bg-[#3b7de6] text-white" onClick={() => onApprove(post.id)}>
          ✅ אשר ותזמן
        </Button>
      </div>
    </div>
  );
};

export default PostEditor;
