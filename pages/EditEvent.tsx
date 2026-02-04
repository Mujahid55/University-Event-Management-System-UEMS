import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate, useParams } from "react-router-dom";
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
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function EditEvent() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  
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
    loadEvent();
    loadVenues();
  }, [id]);

  const loadEvent = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast({ title: "Error", description: "Event not found", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    // Check permissions
    if (data.created_by !== profile?.id) {
      toast({ title: "Error", description: "You don't have permission to edit this event", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    if (data.status !== "draft" && data.status !== "changes_required") {
      toast({ title: "Error", description: "This event cannot be edited", variant: "destructive" });
      navigate(`/events/${id}`);
      return;
    }

    setEvent(data);
    setTitle(data.title);
    setDescription(data.description);
    setCategory(data.category || "");
    setVenueId(data.venue_id);
    setStartAt(data.start_at.slice(0, 16));
    setEndAt(data.end_at.slice(0, 16));
    setExpectedAttendees(data.expected_attendees.toString());
    setRiskNotes(data.risk_notes || "");
    
    const policyAck = data.policy_ack as any;
    setSafetyAck(policyAck?.safety || false);
    setComplianceAck(policyAck?.compliance || false);
    setLoading(false);
  };

  const loadVenues = async () => {
    const { data } = await supabase
      .from("venues")
      .select("*")
      .eq("active", true)
      .order("name");
    
    if (data) setVenues(data);
  };

  const handleSubmit = async (e: React.FormEvent, submitForApproval = false) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !venueId || !startAt || !endAt) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (new Date(endAt) <= new Date(startAt)) {
      toast({ title: "Error", description: "End time must be after start time", variant: "destructive" });
      return;
    }

    if (!safetyAck || !complianceAck) {
      toast({ title: "Error", description: "Please acknowledge all policies", variant: "destructive" });
      return;
    }
    
    setSaving(true);

    const { error } = await supabase
      .from("events")
      .update({
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
        updated_by: profile?.id,
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: submitForApproval ? "Event resubmitted for approval!" : "Changes saved!",
      });
      navigate(`/events/${id}`);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          onClick={() => navigate(`/events/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Event
        </Button>

        {event.status === "changes_required" && (
          <Alert className="mb-4 border-warning/20 bg-warning/5">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              This event requires changes before it can be approved. Please make the necessary updates and resubmit.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Edit Event</CardTitle>
            <CardDescription>
              Update event details and resubmit for approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Event Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Venue & Schedule</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue *</Label>
                  <Select value={venueId} onValueChange={setVenueId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name} (Capacity: {venue.capacity})
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
                  <Label htmlFor="riskNotes">Risk Notes</Label>
                  <Textarea
                    id="riskNotes"
                    value={riskNotes}
                    onChange={(e) => setRiskNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

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
                      I acknowledge that this event complies with all university safety policies *
                    </label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="compliance"
                      checked={complianceAck}
                      onCheckedChange={(checked) => setComplianceAck(checked as boolean)}
                    />
                    <label htmlFor="compliance" className="text-sm leading-tight cursor-pointer">
                      I confirm that all event details are accurate *
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={saving}
                  className="flex-1"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={saving}
                  className="flex-1 bg-gradient-primary"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Resubmit for Approval
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
