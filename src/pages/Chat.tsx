import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  last_interaction_at: string;
  created_at: string;
}

interface Message {
  id: string;
  lead_id: string;
  sender: "user" | "bot" | "human";
  content: string;
  created_at: string;
}

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch leads
  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("last_interaction_at", { ascending: false });

      if (error) {
        console.error("Error fetching leads:", error);
        return;
      }

      setLeads(data || []);

      // Check if there's a lead ID in URL params
      const leadId = searchParams.get("lead");
      if (leadId) {
        const lead = data?.find((l) => l.id === leadId);
        if (lead) setSelectedLead(lead);
      }
    };

    fetchLeads();
  }, [searchParams]);

  // Fetch messages for selected lead
  useEffect(() => {
    if (!selectedLead) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("lead_id", selectedLead.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages((data || []) as Message[]);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${selectedLead.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `lead_id=eq.${selectedLead.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLead]);

  const handleSendMessage = async (content: string) => {
    if (!selectedLead) return;

    setIsLoading(true);
    try {
      // Insert the message (as human since we're sending manually)
      const { error } = await supabase.from("messages").insert({
        lead_id: selectedLead.id,
        sender: "human",
        content,
      });

      if (error) throw error;

      // Update lead's last interaction
      await supabase
        .from("leads")
        .update({ 
          last_interaction_at: new Date().toISOString(),
          status: "Chatting" 
        })
        .eq("id", selectedLead.id);

      toast.success("ההודעה נשלחה!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("שגיאה בשליחת ההודעה");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="animate-fade-in -m-6 flex h-[calc(100vh-0px)] relative z-20">
        {/* Sidebar */}
        <div className="w-80 shrink-0 relative z-30">
          <ChatSidebar
            leads={leads}
            selectedLeadId={selectedLead?.id}
            onSelectLead={(lead) => setSelectedLead(lead as Lead)}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 relative z-20">
          <ChatWindow
            lead={selectedLead}
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </MainLayout>
  );
}
