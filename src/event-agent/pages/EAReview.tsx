import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PostEditor from '../components/PostEditor';
import { toast } from '@/hooks/use-toast';
import { sendViaWhapi } from '../api';
import { Loader2 } from 'lucide-react';
import type { EAScheduledPost } from '../types';
import { Tables } from '@/integrations/supabase/types';

type ScheduledPostWithJoin = Tables<'ea_scheduled_posts'> & {
  ea_events?: { title: string | null } | null;
};

const EAReview = () => {
  const [posts, setPosts] = useState<EAScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ea_scheduled_posts')
      .select('*, ea_events(title)')
      .eq('status', 'pending')
      .order('target_date', { ascending: true });

    if (data) {
      setPosts(
        data.map((p: ScheduledPostWithJoin) => {
          const { ea_events, ...rest } = p;
          return {
            ...rest,
            platforms: rest.platforms ?? [],
            event: ea_events ? { title: ea_events.title ?? '' } : undefined,
          } as EAScheduledPost;
        })
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleApprove = async (id: string) => {
    await supabase.from('ea_scheduled_posts').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    }).eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
    toast({ title: 'אושר ✅', description: 'הפוסט אושר ותוזמן לפרסום' });
  };

  const handleSendWA = async (id: string) => {
    const post = posts.find(p => p.id === id);
    if (!post?.content_whatsapp) {
      toast({ title: 'שגיאה', description: 'אין תוכן וואטסאפ לפוסט זה', variant: 'destructive' });
      return;
    }
    // Load default phone from settings
    const { data: phoneSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'ea_default_wa_phone')
      .maybeSingle();
    const phone = phoneSetting?.value;
    if (!phone) {
      toast({ title: 'שגיאה', description: 'לא הוגדר מספר וואטסאפ ברירת מחדל בהגדרות', variant: 'destructive' });
      return;
    }
    await sendViaWhapi(phone, post.content_whatsapp);
  };

  const handleReject = async (id: string) => {
    await supabase.from('ea_scheduled_posts').update({ status: 'rejected' }).eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
    toast({ title: 'נדחה', description: 'הפוסט נדחה' });
  };

  const handleContentUpdated = () => {
    fetchPosts();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#4f8ef7]" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">עריכה ואישור</h1>
      <p className="text-sm text-[#64748b]">{posts.length} פוסטים ממתינים לאישור</p>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="rounded-lg border border-[#1a1d2e] bg-[#0d0f1a] p-8 text-center text-[#64748b]">
            אין פוסטים ממתינים לאישור 🎉
          </div>
        ) : (
          posts.map(p => (
            <PostEditor
              key={p.id}
              post={p}
              onApprove={handleApprove}
              onSendWA={handleSendWA}
              onReject={handleReject}
              onContentUpdated={handleContentUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EAReview;
