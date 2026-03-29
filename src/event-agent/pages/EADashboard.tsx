import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

type CampaignWithEvent = Tables<'ea_campaigns'> & {
  ea_events?: { title: string } | null;
  progress?: number;
  title?: string;
};

const EADashboard = () => {
  const [stats, setStats] = useState({ events: 0, activeCampaigns: 0, pending: 0, published: 0 });
  const [campaigns, setCampaigns] = useState<CampaignWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [eventsRes, campaignsRes, postsRes, activeCampaignsRes] = await Promise.all([
        supabase.from('ea_events').select('id', { count: 'exact', head: true }),
        supabase.from('ea_campaigns').select('*, ea_events(title)').eq('status', 'active'),
        supabase.from('ea_scheduled_posts').select('status'),
        supabase.from('ea_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      const posts = (postsRes.data || []) as Tables<'ea_scheduled_posts'>[];
      setStats({
        events: eventsRes.count || 0,
        activeCampaigns: activeCampaignsRes.count || 0,
        pending: posts.filter(p => p.status === 'pending').length,
        published: posts.filter(p => p.status === 'published').length,
      });

      if (campaignsRes.data) {
        // For each campaign, count posts
        const withProgress = await Promise.all(
          campaignsRes.data.map(async (c: CampaignWithEvent) => {
            const { data: cPosts } = await supabase
              .from('ea_scheduled_posts')
              .select('status')
              .eq('campaign_id', c.id);
            const total = cPosts?.length || 1;
            const published = cPosts?.filter(p => p.status === 'published').length || 0;
            return { ...c, progress: Math.round((published / total) * 100), title: c.ea_events?.title };
          })
        );
        setCampaigns(withProgress);
      }

      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { label: 'סה"כ אירועים', value: stats.events, color: '#4f8ef7' },
    { label: 'קמפיינים פעילים', value: stats.activeCampaigns, color: '#10b981' },
    { label: 'ממתינים לאישור', value: stats.pending, color: '#f59e0b' },
    { label: 'פוסטים שפורסמו', value: stats.published, color: '#8b5cf6' },
  ];

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#4f8ef7]" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">דשבורד</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="rounded-lg border border-[#1a1d2e] bg-[#0d0f1a] p-4">
            <p className="text-xs text-[#64748b]">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-[#94a3b8]">קמפיינים פעילים</h2>
        <div className="space-y-3">
          {campaigns.length === 0 ? (
            <div className="text-center py-6 text-[#64748b] text-sm">אין קמפיינים פעילים</div>
          ) : (
            campaigns.map(c => (
              <div key={c.id} className="rounded-lg border border-[#1a1d2e] bg-[#0d0f1a] p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-[#e2e8f0]">{c.title || 'קמפיין'}</p>
                  <span className="text-xs text-[#64748b]">{c.progress}%</span>
                </div>
                <Progress value={c.progress} className="h-1.5 bg-[#1a1d2e]" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EADashboard;
