import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

const levelColors: Record<string, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-[#4f8ef7]',
};

const levelLabels: Record<string, string> = {
  success: '✅ הצלחה', error: '❌ שגיאה', info: 'ℹ️ מידע',
};

const filters = ['הכל', 'success', 'error', 'info'] as const;
const filterLabels: Record<string, string> = { הכל: 'הכל', success: 'הצלחה', error: 'שגיאה', info: 'מידע' };

const EALogs = () => {
  const [logs, setLogs] = useState<Tables<'ea_logs'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>('הכל');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('ea_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (data) setLogs(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (levelFilter === 'הכל') return logs;
    return logs.filter(l => l.level === levelFilter);
  }, [levelFilter, logs]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#4f8ef7]" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">לוגים</h1>

      <div className="flex gap-2">
        {filters.map(f => (
          <Button
            key={f}
            size="sm"
            variant={levelFilter === f ? 'default' : 'outline'}
            className={levelFilter === f ? 'bg-[#4f8ef7] text-white' : 'border-[#1a1d2e] text-[#94a3b8]'}
            onClick={() => setLevelFilter(f)}
          >
            {filterLabels[f]}
          </Button>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 text-[#64748b] text-sm">אין לוגים עדיין</div>
      ) : (
        <div className="rounded-lg border border-[#1a1d2e] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1a1d2e] hover:bg-transparent">
                <TableHead className="text-[#64748b] text-right w-32">זמן</TableHead>
                <TableHead className="text-[#64748b] text-right w-24">רמה</TableHead>
                <TableHead className="text-[#64748b] text-right w-24">מקור</TableHead>
                <TableHead className="text-[#64748b] text-right">הודעה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id} className="border-[#1a1d2e] hover:bg-[#1a1d2e]/30">
                  <TableCell className="text-xs font-mono text-[#64748b]">
                    {format(parseISO(l.created_at), 'dd/MM HH:mm')}
                  </TableCell>
                  <TableCell className={cn('text-xs', levelColors[l.level])}>
                    {levelLabels[l.level] || l.level}
                  </TableCell>
                  <TableCell className="text-xs text-[#94a3b8]">{l.source}</TableCell>
                  <TableCell className="text-sm font-[JetBrains_Mono,monospace] text-[#e2e8f0]">{l.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default EALogs;
