import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppSidebar />
      <main className="mr-64 min-h-screen">
        {/* Spotlight effect */}
        <div className="pointer-events-none fixed inset-0 mr-64 theater-spotlight z-0" />
        
        {/* Content */}
        <div className="relative z-10 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
