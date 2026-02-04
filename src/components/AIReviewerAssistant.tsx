import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIReviewerAssistantProps {
  eventTitle: string;
  description: string;
  category: string;
  expectedAttendees: number;
  riskNotes: string | null;
  onFeedbackGenerated: (feedback: string) => void;
}

export const AIReviewerAssistant = ({
  eventTitle,
  description,
  category,
  expectedAttendees,
  riskNotes,
  onFeedbackGenerated,
}: AIReviewerAssistantProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateFeedback = async (action: "approve" | "changes_required" | "suggest_improvements") => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-reviewer-assistant", {
        body: {
          eventTitle,
          description,
          category,
          expectedAttendees,
          riskNotes,
          action,
        },
      });

      if (error) throw error;

      if (data?.feedback) {
        onFeedbackGenerated(data.feedback);
        toast({
          title: "Success",
          description: "AI generated feedback for you!",
        });
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate feedback",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Reviewer Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground mb-4">
          Let AI help you write professional, constructive feedback
        </p>
        <div className="grid gap-2">
          <Button
            variant="outline"
            onClick={() => generateFeedback("approve")}
            disabled={isGenerating}
            className="justify-start"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Approval Comment
          </Button>
          <Button
            variant="outline"
            onClick={() => generateFeedback("changes_required")}
            disabled={isGenerating}
            className="justify-start"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Change Request
          </Button>
          <Button
            variant="outline"
            onClick={() => generateFeedback("suggest_improvements")}
            disabled={isGenerating}
            className="justify-start"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Suggest Improvements
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
