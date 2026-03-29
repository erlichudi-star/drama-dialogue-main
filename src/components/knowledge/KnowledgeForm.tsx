import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KnowledgeFormProps {
  onSuccess: () => void;
}

export function KnowledgeForm({ onSuccess }: KnowledgeFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }

    setIsLoading(true);
    try {
      // Insert without embedding for now - we'll add embedding generation later
      const { error } = await supabase.from("knowledge_base").insert({
        title: title.trim(),
        content: content.trim(),
      });

      if (error) throw error;

      toast.success("Knowledge added successfully!");
      setTitle("");
      setContent("");
      onSuccess();
    } catch (error) {
      console.error("Error adding knowledge:", error);
      toast.error("Failed to add knowledge");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="theater-card">
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Add Knowledge
        </CardTitle>
        <CardDescription>
          Add information about your theater school for the AI to learn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Acting Class Schedule"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-muted/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Paste or type the information here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] bg-muted/50"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Add to Knowledge Base
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
