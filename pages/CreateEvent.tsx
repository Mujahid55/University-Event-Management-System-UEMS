import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useUserRoles } from "@/hooks/useUserRoles";
import { AIDescriptionGenerator } from "@/components/AIDescriptionGenerator";
import { AIRecommendations } from "@/components/AIRecommendations";
import { AIEventAssistant } from "@/components/AIEventAssistant";

export default function CreateEvent() {
  const { profile } = useAuth();
  const { canCreateEvents, getRolesForClub } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [venueId, setVenueId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [expectedAttendees, setExpectedAttendees] = useState("");
  const [riskNotes, setRiskNotes] = useState("");
  const [safetyAck, setSafetyAck] = useState(false);
  const [complianceAck, setComplianceAck] = useState(false);

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    if (venueId && startAt && endAt) {
      checkVenueConflicts();
    }
  }, [venueId, startAt, endAt]);

  const loadVenues = async () => {
    const { data } = await supabase
      .from("venues")
      .select("*")
      .eq("active", true)
      .order("name");
    
    if (data) setVenues(data);
  };

  const checkVenueConflicts = async () => {
    if (!venueId || !startAt || !endAt) return;
    
    setCheckingConflicts(true);
    
    const { data, error } = await supabase.rpc("check_venue_conflicts", {
      p_venue_id: venueId,
      p_start_at: startAt,
      p_end_at: endAt,
    });

    if (!error && data) {
      setConflicts(data);
    }
    
    setCheckingConflicts(false);
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return false;
    }
    if (!description.trim()) {
      toast({ title: "Error", description: "Description is required", variant: "destructive" });
      return false;
    }
    if (!venueId) {
      toast({ title: "Error", description: "Please select a venue", variant: "destructive" });
      return false;
    }
    if (!startAt || !endAt) {
      toast({ title: "Error", description: "Start and end times are required", variant: "destructive" });
      return false;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      toast({ title: "Error", description: "End time must be after start time", variant: "destructive" });
      return false;
    }
    if (!expectedAttendees || parseInt(expectedAttendees) <= 0) {
      toast({ title: "Error", description: "Expected attendees must be greater than 0", variant: "destructive" });
      return false;
    }
    if (!safetyAck || !complianceAck) {
      toast({ title: "Error", description: "Please acknowledge all policies", variant: "destructive" });
      return false;
    }
    
    const venue = venues.find(v => v.id === venueId);
    if (venue && parseInt(expectedAttendees) > venue.capacity) {
      toast({ 
        title: "Warning", 
        description: `Expected attendees (${expectedAttendees}) exceeds venue capacity (${venue.capacity})`,
        variant: "destructive" 
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent, submitForApproval = false) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (conflicts.length > 0 && submitForApproval) {
      toast({ 
        title: "Error", 
        description: "Cannot submit event with venue conflicts. Please resolve conflicts first.",
        variant: "destructive" 
      });
      return;
    }
    
    setLoading(true);

    const eventData: any = {
      club_id: profile?.club_id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || null,
      venue_id: venueId,
      start_at: startAt,
      end_at: endAt,
      expected_attendees: parseInt(expectedAttendees),
      risk_notes: riskNotes.trim() || null,
      policy_ack: {
        safety: safetyAck,
        compliance: complianceAck,
      },
      status: submitForApproval ? "submitted" : "draft",
      created_by: profile?.id,
      updated_by: profile?.id,
    };
    
    if (submitForApproval) {
      eventData.last_decision_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("events")
      .insert(eventData)
      .select()
      .single();

    if (error) {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Success", 
        description: submitForApproval 
          ? "Event submitted for approval!" 
          : "Event saved as draft!",
      });
      navigate(`/events/${data.id}`);
    }

    setLoading(false);
  };

  if (!profile || (profile.role !== "officer" && profile.role !== "sponsor")) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only club officers and sponsors can create events.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>
              Fill out the details below to create an event request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Event Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Annual Tech Symposium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your event..."
                    rows={4}
                    required
                  />
                  <AIDescriptionGenerator
                    title={title}
                    category={category}
                    expectedAttendees={parseInt(expectedAttendees) || 0}
                    venue={venues.find(v => v.id === venueId)?.name || ""}
                    onDescriptionGenerated={setDescription}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Workshop, Social, Competition, etc."
                  />
                </div>
              </div>

              {/* Venue & Time */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Venue & Schedule</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue *</Label>
                  <Select value={venueId} onValueChange={setVenueId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name} - {venue.location} (Capacity: {venue.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startAt">Start Time *</Label>
                    <Input
                      id="startAt"
                      type="datetime-local"
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endAt">End Time *</Label>
                    <Input
                      id="endAt"
                      type="datetime-local"
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {checkingConflicts && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>Checking for venue conflicts...</AlertDescription>
                  </Alert>
                )}

                {conflicts.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-2">Venue Conflict Detected!</p>
                      <p className="text-sm">The selected venue is already booked:</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {conflicts.map((conflict) => (
                          <li key={conflict.conflicting_event_id}>
                            • {conflict.event_title} ({format(new Date(conflict.event_start), "MMM d, h:mm a")} - {format(new Date(conflict.event_end), "h:mm a")})
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {!checkingConflicts && conflicts.length === 0 && venueId && startAt && endAt && (
                  <Alert className="border-success bg-success/10">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <AlertDescription className="text-success">
                      No venue conflicts detected!
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="expectedAttendees">Expected Attendees *</Label>
                  <Input
                    id="expectedAttendees"
                    type="number"
                    min="1"
                    value={expectedAttendees}
                    onChange={(e) => setExpectedAttendees(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskNotes">Risk Notes (Optional)</Label>
                  <Textarea
                    id="riskNotes"
                    value={riskNotes}
                    onChange={(e) => setRiskNotes(e.target.value)}
                    placeholder="Any safety concerns or special considerations..."
                    rows={3}
                  />
                </div>
              </div>

              {/* AI Recommendations */}
              {title && category && (
                <AIRecommendations
                  title={title}
                  category={category}
                  description={description}
                  venues={venues}
                />
              )}

              {/* Policy Acknowledgement */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Policy Acknowledgement</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="safety"
                      checked={safetyAck}
                      onCheckedChange={(checked) => setSafetyAck(checked as boolean)}
                    />
                    <label htmlFor="safety" className="text-sm leading-tight cursor-pointer">
                      I acknowledge that this event complies with all university safety policies and regulations *
                    </label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="compliance"
                      checked={complianceAck}
                      onCheckedChange={(checked) => setComplianceAck(checked as boolean)}
                    />
                    <label htmlFor="compliance" className="text-sm leading-tight cursor-pointer">
                      I confirm that all event details are accurate and comply with university policies *
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading || conflicts.length > 0}
                  className="flex-1 bg-gradient-primary"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit for Approval
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <AIEventAssistant />
    </div>
  );
}
