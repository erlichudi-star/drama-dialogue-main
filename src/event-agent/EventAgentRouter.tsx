import { Routes, Route, Navigate } from 'react-router-dom';
import EventAgentLayout from './EventAgentLayout';
import EADashboard from './pages/EADashboard';
import EATimeline from './pages/EATimeline';
import EAEvents from './pages/EAEvents';
import EAReview from './pages/EAReview';
import EATemplates from './pages/EATemplates';
import EASettings from './pages/EASettings';
import EALogs from './pages/EALogs';

const EventAgentRouter = () => (
  <EventAgentLayout>
    <Routes>
      <Route path="/" element={<EADashboard />} />
      <Route path="/timeline" element={<EATimeline />} />
      <Route path="/events" element={<EAEvents />} />
      <Route path="/review" element={<EAReview />} />
      <Route path="/templates" element={<EATemplates />} />
      <Route path="/settings" element={<EASettings />} />
      <Route path="/logs" element={<EALogs />} />
      <Route path="*" element={<Navigate to="/event-agent" replace />} />
    </Routes>
  </EventAgentLayout>
);

export default EventAgentRouter;
