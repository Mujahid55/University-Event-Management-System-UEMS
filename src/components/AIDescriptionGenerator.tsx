import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIDescriptionGeneratorProps {
  title: string;
  category: string;
  expectedAttendees: number;
  venue: string;
  onDescriptionGenerated: (description: string) => void;
}

export const AIDescriptionGenerator = ({
  title,
  category,
  expectedAttendees,
  venue,
  onDescriptionGenerated,
}: AIDescriptionGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateDescription = async () => {
    if (!title) {
      toast({
        title: "Missing Information",
        description: "Please enter an event title first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-description", {
        body: { title, category, expectedAttendees, venue },
      });

      if (error) throw error;

      if (data?.description) {
        onDescriptionGenerated(data.description);
        toast({
          title: "Success",
          description: "AI generated a description for your event!",
        });
      }
    } catch (error) {
      console.error("Error generating description:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate description",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={generateDescription}
      disabled={isGenerating || !title}
      className="w-full"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate with AI
        </>
      )}
    </Button>
  );
};
