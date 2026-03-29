import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, parseISO, isBefore } from 'date-fns';
import { he } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type TimelinePost = Tables<'ea_scheduled_posts'> & {
  ea_events?: { title: string | null } | null;
};

const platformIcons: Record<string, string> = {
  facebook: '📘', instagram: '📷', email: '📧', whatsapp: '💬',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  pending: 'ממתין', approved: 'מאושר', published: 'פורסם', rejected: 'נדחה',
};

const EATimeline = () => {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('ea_scheduled_posts')
        .select('*, ea_events(title)')
        .order('target_date', { ascending: true });
      if (data) setPosts(data as TimelinePost[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return posts;
    return posts.filter(p => p.status === statusFilter);
  }, [statusFilter, posts]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach(p => {
      const month = format(parseISO(p.target_date), 'MMMM yyyy', { locale: he });
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(p);
    });
    return map;
  }, [filtered]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#4f8ef7]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">ציר זמן משולב</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 bg-[#0d0f1a] border-[#1a1d2e] text-sm text-[#e2e8f0]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0d0f1a] border-[#1a1d2e]">
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value="pending">ממתין</SelectItem>
            <SelectItem value="approved">מאושר</SelectItem>
            <SelectItem value="published">פורסם</SelectItem>
            <SelectItem value="rejected">נדחה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-[#64748b] text-sm">אין פוסטים מתוזמנים</div>
      ) : (
        Array.from(grouped.entries()).map(([month, monthPosts]) => (
          <div key={month}>
            <h2 className="text-sm font-semibold text-[#4f8ef7] mb-3">{month}</h2>
            <div className="space-y-2">
              {monthPosts.map(p => {
                const isPostToday = p.target_date === todayStr;
                const isPast = isBefore(parseISO(p.target_date), new Date()) && !isPostToday;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-4 rounded-lg border border-[#1a1d2e] bg-[#0d0f1a] px-4 py-3',
                      isPostToday && 'border-[#4f8ef7] ring-1 ring-[#4f8ef7]/30',
                      isPast && 'opacity-60'
                    )}
                  >
                    <span className="text-xs text-[#64748b] w-20 shrink-0">
                      {format(parseISO(p.target_date), 'dd/MM')}
                    </span>
                    {isPostToday && <div className="w-1.5 h-1.5 rounded-full bg-[#4f8ef7] shrink-0" />}
                    <span className="text-sm text-[#e2e8f0] flex-1 truncate">{p.ea_events?.title || '-'}</span>
                    <span className="text-xs text-[#94a3b8] w-28 truncate">{p.phase}</span>
                    <span className="text-xs shrink-0">
                      {(p.platforms || []).map((pl: string) => platformIcons[pl] || pl).join(' ')}
                    </span>
                    <Badge variant="outline" className={cn('text-[10px] shrink-0', statusColors[p.status])}>
                      {statusLabels[p.status] || p.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default EATimeline;
