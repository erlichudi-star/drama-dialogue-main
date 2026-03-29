import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Globe, FileCheck, Layers, Settings, ScrollText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/event-agent', icon: LayoutDashboard, label: 'דשבורד', end: true },
  { to: '/event-agent/timeline', icon: Calendar, label: 'ציר זמן' },
  { to: '/event-agent/events', icon: Globe, label: 'אירועים' },
  { to: '/event-agent/review', icon: FileCheck, label: 'עריכה ואישור' },
  { to: '/event-agent/templates', icon: Layers, label: 'תבניות' },
  { to: '/event-agent/settings', icon: Settings, label: 'הגדרות' },
  { to: '/event-agent/logs', icon: ScrollText, label: 'לוגים' },
];

const EventAgentSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="ea-sidebar w-56 min-h-screen flex flex-col border-l border-[#1a1d2e] bg-[#0a0c14]">
      {/* Back to main */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1a1d2e]/50 transition-colors border-b border-[#1a1d2e]"
      >
        <ArrowRight className="w-3.5 h-3.5" />
        <span>חזרה ל-StageCRM</span>
      </button>

      {/* Logo / Title */}
      <div className="p-4 border-b border-[#1a1d2e]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4f8ef7] animate-pulse" />
          <h2 className="text-sm font-bold text-[#e2e8f0]">קמפיינים</h2>
        </div>
        <p className="text-[10px] text-[#64748b] mt-1">ניהול קמפיינים</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                isActive
                  ? 'text-[#4f8ef7] bg-[#4f8ef7]/10 border-l-2 border-[#4f8ef7]'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a1d2e]/50'
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default EventAgentSidebar;
