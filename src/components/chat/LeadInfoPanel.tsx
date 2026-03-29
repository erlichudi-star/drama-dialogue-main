import { useEffect, useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, MessageCircle, Facebook, Mail, Phone, Calendar, Clock, Tag, Megaphone } from "lucide-react";
import { SourceIcon } from "./SourceIcon";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  interest?: string;
  ad_name?: string;
  campaign_id?: string;
  created_at: string;
  last_interaction_at: string;
}

interface Activity {
  id: string;
  type: string;
  description: string | null;
  created_at: string;
}

interface LeadInfoPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

const sourceLabels: Record<string, string> = {
  Facebook: "פייסבוק",
  WhatsApp: "וואטסאפ",
  Website: "אתר",
  Elementor: "אתר (אלמנטור)",
  Manual: "ידני",
};

const statusLabels: Record<string, string> = {
  New: "חדש",
  Chatting: "בשיחה",
  Converted: "הומר",
  Lost: "אבוד",
};

export function LeadInfoPanel({ open, onOpenChange, lead }: LeadInfoPanelProps) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!open) return;

    const fetchActivities = async () => {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setActivities((data || []) as Activity[]);
    };

    fetchActivities();
  }, [open, lead.id]);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d.M.yyyy HH:mm", { locale: he });
    } catch {
      return dateStr;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[380px] sm:max-w-[380px] p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-right font-display">פרטי ליד</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="px-6 pb-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 font-display text-xl font-semibold text-primary">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-semibold text-foreground">{lead.name}</h3>
                  <Badge variant="outline" className="mt-1">
                    {statusLabels[lead.status] || lead.status}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">פרטי קשר</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span dir="ltr">{lead.phone}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Source & Interest */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">מקור והתעניינות</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <SourceIcon source={lead.source} className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{sourceLabels[lead.source] || lead.source}</span>
                </div>
                {lead.interest && (
                  <div className="flex items-center gap-3 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{lead.interest}</span>
                  </div>
                )}
                {lead.ad_name && (
                  <div className="flex items-center gap-3 text-sm">
                    <Megaphone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{lead.ad_name}</span>
                  </div>
                )}
                {lead.campaign_id && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="text-xs">קמפיין: {lead.campaign_id}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">תאריכים</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>נוצר: {formatDate(lead.created_at)}</span>
                </div>
                {lead.last_interaction_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>אינטראקציה אחרונה: {formatDate(lead.last_interaction_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Activities */}
            {activities.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">היסטוריית פעילויות</h4>
                  <div className="space-y-2">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 text-sm">
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-primary/50 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground">{activity.description || activity.type}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
