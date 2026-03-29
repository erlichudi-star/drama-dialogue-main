import { cn } from '@/lib/utils';
import { ConnectionStatusItem } from '../types';

interface Props {
  connections: ConnectionStatusItem[];
}

const ConnectionStatus = ({ connections }: Props) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
    {connections.map((c) => (
      <div
        key={c.key}
        className="rounded-lg border border-[#1a1d2e] bg-[#0d0f1a] p-3 flex items-center gap-3"
      >
        <div className={cn('w-2.5 h-2.5 rounded-full', c.connected ? 'bg-emerald-500' : 'bg-red-500')} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#e2e8f0] truncate">{c.name}</p>
          <p className="text-[10px] text-[#64748b]">{c.label}</p>
        </div>
      </div>
    ))}
  </div>
);

export default ConnectionStatus;
