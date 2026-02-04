import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, MapPin, Users, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Recommendations {
  suggestedVenue?: string;
  estimatedAttendance?: string;
  riskConsiderations?: string[];
  improvementTips?: string[];
  error?: string;
}

interface AIRecommendationsProps {
  title: string;
  category: string;
  description: string;
  venues: any[];
}

export const AIRecommendations = ({ title, category, description, venues }: AIRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (title && category) {
      loadRecommendations();
    }
  }, [title, category, description]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-event-recommendations", {
        body: { title, category, description, venues },
      });

      if (error) throw error;
      if (data?.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.error) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.suggestedVenue && (
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <strong>Suggested Venue:</strong> {recommendations.suggestedVenue}
            </AlertDescription>
          </Alert>
        )}

        {recommendations.estimatedAttendance && (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              <strong>Estimated Attendance:</strong> {recommendations.estimatedAttendance}
            </AlertDescription>
          </Alert>
        )}

        {recommendations.riskConsiderations && recommendations.riskConsiderations.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Considerations
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {recommendations.riskConsiderations.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        {recommendations.improvementTips && recommendations.improvementTips.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Improvement Tips
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {recommendations.improvementTips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
