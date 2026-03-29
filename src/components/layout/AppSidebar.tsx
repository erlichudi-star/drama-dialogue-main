import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  Settings, 
  Theater,
  Sparkles,
  Users,
  Zap,
  Calendar,
  GraduationCap
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "לוח בקרה" },
  { to: "/chat", icon: MessageSquare, label: "צ׳אט חי" },
  { to: "/customers", icon: Users, label: "לקוחות" },
  { to: "/courses", icon: GraduationCap, label: "קורסים" },
  { to: "/automations", icon: Zap, label: "אוטומציות" },
  { to: "/event-agent", icon: Calendar, label: "קמפיינים" },
  { to: "/knowledge", icon: BookOpen, label: "בסיס ידע" },
  { to: "/settings", icon: Settings, label: "הגדרות" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-64 border-l border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Theater className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold text-sidebar-foreground">
            Stage<span className="text-primary">CRM</span>
          </h1>
          <p className="text-xs text-muted-foreground">ניהול וואטסאפ</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-muted/50 hover:text-primary"
              }`}
            >
              <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                isActive ? "text-primary" : ""
              }`} />
              <span>{item.label}</span>
              {isActive && (
                <Sparkles className="ms-auto h-3 w-3 text-primary opacity-60" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4">
        <div className="theater-card p-4">
          <p className="text-xs text-muted-foreground">
            מופעל על ידי AI ווואטסאפ
          </p>
          <p className="mt-1 font-display text-sm text-primary">
            ✨ ההצגה חייבת להמשיך
          </p>
        </div>
      </div>
    </aside>
  );
}
