import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIMessageGeneratorProps {
  targetName: string;
  targetType: "lead" | "customer";
  targetId: string;
  messageType: string;
  onGenerated: (message: string) => void;
}

export function AIMessageGenerator({ targetName, targetType, targetId, messageType, onGenerated }: AIMessageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!targetName) {
      toast.error("יש לבחור ליד/לקוח לפני יצירת הודעה עם AI");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-followup-message", {
        body: {
          target_name: targetName,
          target_type: targetType,
          target_id: targetId,
          message_type: messageType,
        },
      });

      if (error) throw error;
      if (data?.message) {
        onGenerated(data.message);
        toast.success("הודעה נוצרה בהצלחה עם AI");
      } else {
        toast.error("לא התקבלה הודעה מה-AI");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("שגיאה ביצירת הודעה עם AI");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={isGenerating || !targetName}
      className="gap-2"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 text-amber-400" />
      )}
      צור עם AI
    </Button>
  );
}
