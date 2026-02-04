import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

export default function CheckIn() {
  const { token } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [qrToken, setQrToken] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    setLoading(true);

    // Validate QR token
    const { data: tokenData, error: tokenError } = await supabase
      .from("qr_tokens")
      .select(`
        *,
        event:events(
          *,
          club:clubs(name),
          venue:venues(name, location)
        )
      `)
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (tokenError || !tokenData) {
      toast({ 
        title: "Invalid QR Code", 
        description: "This QR code is invalid or has expired",
        variant: "destructive" 
      });
      setLoading(false);
      return;
    }

    setQrToken(tokenData);
    setEvent(tokenData.event);

    // Check if already checked in
    if (user) {
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .eq("event_id", tokenData.event.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (attendanceData) {
        setCheckedIn(true);
      }
    }

    setLoading(false);
  };

  const handleCheckIn = async (asGuest = false) => {
    if (!qrToken || !event) return;

    if (asGuest && !guestName.trim()) {
      toast({ title: "Error", description: "Please enter your name", variant: "destructive" });
      return;
    }

    setChecking(true);

    const attendanceData: any = {
      event_id: event.id,
      user_id: asGuest ? null : user?.id,
      guest_label: asGuest ? guestName.trim() : null,
    };

    const { error } = await supabase
      .from("attendance")
      .insert(attendanceData);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCheckedIn(true);
      toast({ 
        title: "Success!", 
        description: "You have been checked in to the event",
      });
    }

    setChecking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!qrToken || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Check-in</CardTitle>
            <CardDescription>
              This QR code is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <CardTitle>Checked In!</CardTitle>
            <CardDescription>
              You have successfully checked in to this event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.start_at), "EEEE, MMMM d, yyyy")}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {event.venue?.name}
                </div>
              </div>
            </div>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Check In to Event</CardTitle>
          <CardDescription>{event.club?.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Info */}
          <div className="p-4 border rounded-lg space-y-3">
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(event.start_at), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {event.venue?.name} - {event.venue?.location}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Expected: {event.expected_attendees} attendees
              </div>
            </div>
          </div>

          {/* Check-in Options */}
          {user && profile ? (
            <div className="space-y-3">
              <Alert>
                <AlertDescription>
                  Signed in as <strong>{profile.name}</strong>
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => handleCheckIn(false)} 
                disabled={checking}
                className="w-full bg-gradient-primary"
              >
                {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Check In
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Your Name</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <Button 
                onClick={() => handleCheckIn(true)} 
                disabled={checking || !guestName.trim()}
                className="w-full bg-gradient-primary"
              >
                {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Check In as Guest
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                Sign In to CEMS
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
