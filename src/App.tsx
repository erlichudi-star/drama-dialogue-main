import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Knowledge from "./pages/Knowledge";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Automations from "./pages/Automations";
import Courses from "./pages/Courses";
import NotFound from "./pages/NotFound";
import EventAgentRouter from "./event-agent/EventAgentRouter";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <div className="min-h-dvh" dir="rtl" lang="he">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/automations" element={<Automations />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/event-agent/*" element={<EventAgentRouter />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
