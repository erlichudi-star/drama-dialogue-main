import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LeadsKanban } from "@/components/dashboard/LeadsKanban";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeadForm, LeadFormData } from "@/components/leads/LeadForm";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useLeads } from "@/hooks/useLeads";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Sparkles,
  RefreshCw,
  Plus,
  Search,
  LayoutGrid,
  List,
  BarChart3,
} from "lucide-react";

const statusFilters = [
  { value: "all", label: "הכל" },
  { value: "New", label: "חדש" },
  { value: "Chatting", label: "בשיחה" },
  { value: "Converted", label: "הומר" },
  { value: "Lost", label: "אבוד" },
];

export default function Dashboard() {
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { leads, isLoading, fetchLeads, createLead } = useLeads();
  const navigate = useNavigate();

  const handleSelectLead = (lead: { id: string }) => {
    navigate(`/chat?lead=${lead.id}`);
  };

  const handleAddLead = async (data: LeadFormData) => {
    try {
      setIsSubmitting(true);
      await createLead({
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        source: data.source,
        interest: data.interest,
      });
      setIsAddLeadOpen(false);
    } catch {
      // Error is handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unique sources for dropdown
  const sources = useMemo(() => {
    const set = new Set(leads.map((l) => l.source));
    return Array.from(set).sort();
  }, [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          lead.name.toLowerCase().includes(q) ||
          lead.phone.includes(q) ||
          (lead.email && lead.email.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [leads, statusFilter, sourceFilter, searchQuery]);

  // Stats calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const newLeadsToday = leads.filter(
    (lead) => new Date(lead.created_at) >= today
  ).length;
  
  const activeConversations = leads.filter(
    (lead) => lead.status === "Chatting"
  ).length;
  
  const convertedCount = leads.filter(
    (lead) => lead.status === "Converted"
  ).length;
  
  const conversionRate = leads.length > 0 
    ? Math.round((convertedCount / leads.length) * 100) 
    : 0;

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              לוח בקרה
            </h1>
            <p className="mt-1 text-muted-foreground">
              ברוכים הבאים למרכז הבקרה של ה-CRM התיאטרוני
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button
              variant={showAnalytics ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={showAnalytics ? "bg-primary hover:bg-primary/90" : "border-border hover:bg-muted"}
            >
              <BarChart3 className="ml-2 h-4 w-4" />
              אנליטיקות
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchLeads}
              className="border-border hover:bg-muted"
            >
              <RefreshCw className="ml-2 h-4 w-4" />
              רענון
            </Button>
            <Button 
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsAddLeadOpen(true)}
            >
              <Plus className="ml-2 h-4 w-4" />
              הוספת ליד
            </Button>
          </div>

          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>הוספת ליד חדש</DialogTitle>
              </DialogHeader>
              <LeadForm
                onSubmit={handleAddLead}
                onCancel={() => setIsAddLeadOpen(false)}
                isLoading={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="לידים חדשים היום"
            value={newLeadsToday}
            subtitle="מכל המקורות"
            icon={Users}
            
          />
          <StatsCard
            title="שיחות פעילות"
            value={activeConversations}
            subtitle="בטיפול"
            icon={MessageSquare}
          />
          <StatsCard
            title="אחוז המרה"
            value={`${conversionRate}%`}
            subtitle={`${convertedCount} הומרו`}
            icon={TrendingUp}
            
          />
          <StatsCard
            title="סה״כ לידים"
            value={leads.length}
            subtitle="מאז ומתמיד"
            icon={Sparkles}
          />
        </div>

        {/* Analytics */}
        {showAnalytics && (
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">אנליטיקות</h2>
            <AnalyticsCharts />
          </div>
        )}

        {/* Leads Section */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-foreground">
              צינור לידים
            </h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {filteredLeads.length} מתוך {leads.length}
            </Badge>
          </div>

          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי שם, טלפון או אימייל..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              {statusFilters.map((sf) => (
                <Button
                  key={sf.value}
                  variant={statusFilter === sf.value ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setStatusFilter(sf.value)}
                >
                  {sf.label}
                </Button>
              ))}
            </div>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="מקור" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המקורות</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 rounded-lg border border-border p-1 mr-auto">
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">טוען לידים...</p>
              </div>
            </div>
          ) : viewMode === "kanban" ? (
            <LeadsKanban leads={filteredLeads} onSelectLead={handleSelectLead} />
          ) : (
            <LeadsTable leads={filteredLeads} onSelectLead={handleSelectLead} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
