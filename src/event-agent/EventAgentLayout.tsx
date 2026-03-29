import { ReactNode } from 'react';
import EventAgentSidebar from './EventAgentSidebar';

interface Props {
  children: ReactNode;
}

const EventAgentLayout = ({ children }: Props) => (
  <div className="event-agent flex min-h-screen" dir="rtl">
    <EventAgentSidebar />
    <main className="flex-1 bg-[#07080d] text-[#e2e8f0] overflow-auto">
      <div className="p-6 max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  </div>
);

export default EventAgentLayout;
