import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  UserPlus, 
  ArrowRightLeft, 
  Send, 
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface Activity {
  id: string;
  type: string;
  description: string | null;
  created_at: string;
}

interface ActivityTimelineProps {
  leadId?: string;
  customerId?: string;
  limit?: number;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "lead_created":
      return <UserPlus className="h-4 w-4 text-emerald-400" />;
    case "message_sent":
    case "message_received":
      return <MessageSquare className="h-4 w-4 text-blue-400" />;
    case "status_change":
      return <ArrowRightLeft className="h-4 w-4 text-amber-400" />;
    case "follow_up_sent":
      return <Send className="h-4 w-4 text-purple-400" />;
    case "converted":
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActivityLabel = (type: string): string => {
  switch (type) {
    case "lead_created":
      return "ליד נוצר";
    case "message_sent":
      return "הודעה נשלחה";
    case "message_received":
      return "הודעה התקבלה";
    case "status_change":
      return "סטטוס עודכן";
    case "follow_up_sent":
      return "פולואפ נשלח";
    case "converted":
      return "הומר ללקוח";
    default:
      return type;
  }
};

export function ActivityTimeline({ leadId, customerId, limit = 10 }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        let query = supabase
          .from("activities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (leadId) {
          query = query.eq("lead_id", leadId);
        } else if (customerId) {
          query = query.eq("customer_id", customerId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (leadId || customerId) {
      fetchActivities();
    } else {
      setIsLoading(false);
    }
  }, [leadId, customerId, limit]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        אין פעילות עדיין
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="relative pr-6">
        {/* Timeline line */}
        <div className="absolute right-2 top-2 bottom-2 w-0.5 bg-border" />

        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="absolute right-0 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border">
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="mr-8 flex-1 rounded-lg bg-muted/30 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {getActivityLabel(activity.type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: he,
                    })}
                  </span>
                </div>
                {activity.description && (
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
