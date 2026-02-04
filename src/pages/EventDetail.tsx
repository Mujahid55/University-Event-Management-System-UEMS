import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { AIReviewerAssistant } from "@/components/AIReviewerAssistant";

export default function EventDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (id) {
      loadEvent();
      loadApprovals();
      loadComments();
    }
  }, [id]);

  const loadEvent = async () => {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        club:clubs(name),
        venue:venues(name, location, capacity),
        creator:profiles!events_created_by_fkey(name, role)
      `)
      .eq("id", id)
      .single();

    if (data) {
      setEvent(data);
    }
    setLoading(false);
  };

  const loadApprovals = async () => {
    const { data } = await supabase
      .from("approvals")
      .select(`
        *,
        reviewer:profiles(name, role)
      `)
      .eq("event_id", id)
      .order("created_at", { ascending: true });

    if (data) setApprovals(data);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(`
        *,
        author:profiles(name, role)
      `)
      .eq("event_id", id)
      .order("created_at", { ascending: true });

    if (data) setComments(data);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    if (!profile?.id) {
      toast({ 
        title: "Error", 
        description: "You must be logged in to comment", 
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase
      .from("comments")
      .insert({
        event_id: id,
        author_id: profile.id,
        body: newComment.trim(),
      });

    if (error) {
      console.error("Comment error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewComment("");
      loadComments();
      toast({ title: "Success", description: "Comment added!" });
    }
  };

  const handleApproval = async (action: "approved" | "changes_required" | "rejected", comment: string) => {
    setActionLoading(true);

    const stage = event?.status === "submitted" ? "club" : "sa";
    let newStatus = event?.status;

    if (action === "approved") {
      if (stage === "club") {
        newStatus = "club_approved";
      } else {
        newStatus = "sa_approved";
      }
    } else if (action === "changes_required") {
      newStatus = "changes_required";
    } else {
      newStatus = "rejected";
    }

    // Insert approval record
    const { error: approvalError } = await supabase
      .from("approvals")
      .insert({
        event_id: id,
        stage,
        status: action,
        reviewer_id: profile?.id,
        comment: comment || null,
      });

    if (approvalError) {
      toast({ title: "Error", description: approvalError.message, variant: "destructive" });
      setActionLoading(false);
      return;
    }

    // Update event status
    const { error: updateError } = await supabase
      .from("events")
      .update({
        status: newStatus,
        last_decision_at: new Date().toISOString(),
        updated_by: profile?.id,
      })
      .eq("id", id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: `Event ${action === "approved" ? "approved" : action === "changes_required" ? "sent back for changes" : "rejected"}!`,
      });
      loadEvent();
      loadApprovals();
    }

    setActionLoading(false);
  };

  const canApprove = () => {
    if (!profile || !event) return false;
    
    // Only admins can approve or reject events
    if (profile.role === "admin") {
      return event.status === "submitted" || event.status === "club_approved";
    }
    
    return false;
  };

  const canEdit = () => {
    if (!profile || !event) return false;
    
    // Officers/sponsors can edit their club's events that are in draft or need changes
    if ((profile.role === "officer" || profile.role === "sponsor") && 
        profile.club_id === event.club_id &&
        (event.status === "draft" || event.status === "changes_required")) {
      return true;
    }
    
    return false;
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

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Event not found</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div>
                    <CardTitle className="text-2xl">{event.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {event.club?.name}
                    </CardDescription>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>

                {event.category && (
                  <div>
                    <h3 className="font-semibold mb-2">Category</h3>
                    <Badge variant="outline">{event.category}</Badge>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Date & Time</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.start_at), "EEEE, MMMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.start_at), "h:mm a")} - {format(new Date(event.end_at), "h:mm a")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Venue</p>
                      <p className="text-sm text-muted-foreground">{event.venue?.name}</p>
                      <p className="text-sm text-muted-foreground">{event.venue?.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Expected Attendees</p>
                      <p className="text-sm text-muted-foreground">
                        {event.expected_attendees} / {event.venue?.capacity} capacity
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>

                {event.risk_notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Risk Notes</h3>
                    <p className="text-sm text-muted-foreground">{event.risk_notes}</p>
                  </div>
                )}

                {canEdit() && (
                  <div className="pt-4 border-t">
                    <Alert className="border-primary/20 bg-primary/5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You can edit this event and resubmit it for approval.
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={() => navigate(`/events/edit/${id}`)}
                      className="mt-3"
                    >
                      Edit Event
                    </Button>
                  </div>
                )}

                {canApprove() && (
                  <div className="pt-4 border-t space-y-3">
                    <h3 className="font-semibold">Admin Review Actions</h3>
                    <Alert className="border-warning/20 bg-warning/5">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <AlertDescription className="text-warning">
                        As an admin, you have full authority to approve or reject this event.
                      </AlertDescription>
                    </Alert>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => {
                          const comment = prompt("Add a comment (optional):");
                          if (comment !== null) handleApproval("approved", comment);
                        }}
                        disabled={actionLoading}
                        className="bg-success hover:bg-success/90"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const comment = prompt("What changes are required?");
                          if (comment) handleApproval("changes_required", comment);
                        }}
                        disabled={actionLoading}
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Request Changes
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const comment = prompt("Reason for rejection:");
                          if (comment) handleApproval("rejected", comment);
                        }}
                        disabled={actionLoading}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-primary/20 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{comment.author?.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {comment.author?.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddComment} size="sm">
                    <Send className="mr-2 h-4 w-4" />
                    Post Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {canApprove() && (
              <AIReviewerAssistant
                eventTitle={event.title}
                description={event.description}
                category={event.category || ""}
                expectedAttendees={event.expected_attendees}
                riskNotes={event.risk_notes}
                onFeedbackGenerated={setNewComment}
              />
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Approval Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {approvals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No approvals yet</p>
                  ) : (
                    approvals.map((approval, index) => (
                      <div key={approval.id} className="relative">
                        {index !== approvals.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />
                        )}
                        <div className="flex items-start gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            approval.status === "approved" 
                              ? "bg-success text-success-foreground" 
                              : approval.status === "rejected"
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-warning text-warning-foreground"
                          }`}>
                            {approval.status === "approved" ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : approval.status === "rejected" ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">
                              {approval.status === "approved" ? "Approved" : 
                               approval.status === "rejected" ? "Rejected" : "Changes Required"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {approval.reviewer?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(approval.created_at), "MMM d, h:mm a")}
                            </p>
                            {approval.comment && (
                              <p className="text-sm mt-1 text-muted-foreground italic">
                                "{approval.comment}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
