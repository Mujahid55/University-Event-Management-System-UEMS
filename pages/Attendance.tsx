import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, QrCode, Users, Download, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import QRCode from "qrcode";

const exportToCSV = (data: any[], filename: string) => {
  const headers = ["Name", "Email", "Type", "Checked In At"];
  const rows = data.map(row => [
    row.user?.name || row.guest_label || "Unknown",
    row.user?.email || "Guest",
    row.user_id ? "Member" : "Guest",
    format(new Date(row.checked_in_at), "yyyy-MM-dd HH:mm:ss")
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default function Attendance() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<any>(null);
  const [qrToken, setQrToken] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent();
      loadQRToken();
      loadAttendance();
    }
  }, [id]);

  const loadEvent = async () => {
    const { data } = await supabase
      .from("events")
      .select(`
        *,
        club:clubs(name),
        venue:venues(name, location)
      `)
      .eq("id", id)
      .single();

    if (data) {
      setEvent(data);
    }
    setLoading(false);
  };

  const loadQRToken = async () => {
    const { data } = await supabase
      .from("qr_tokens")
      .select("*")
      .eq("event_id", id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setQrToken(data);
      generateQRCode(data.token);
    }
  };

  const loadAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select(`
        *,
        user:profiles(name, email)
      `)
      .eq("event_id", id)
      .order("checked_in_at", { ascending: false });

    if (data) {
      setAttendance(data);
    }
  };

  const generateQRCode = async (token: string) => {
    try {
      const checkInUrl = `${window.location.origin}/checkin/${token}`;
      const dataUrl = await QRCode.toDataURL(checkInUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#1e40af",
          light: "#ffffff",
        },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const handleGenerateQR = async () => {
    if (!event) return;
    
    setGenerating(true);

    // Generate random token
    const token = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Set expiration to event end time + 1 hour
    const expiresAt = new Date(event.end_at);
    expiresAt.setHours(expiresAt.getHours() + 1);

    const { data, error } = await supabase
      .from("qr_tokens")
      .insert({
        event_id: id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setQrToken(data);
      generateQRCode(data.token);
      toast({ title: "Success", description: "QR code generated!" });
    }

    setGenerating(false);
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement("a");
    link.download = `event-${id}-qr.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const exportAttendanceCSV = () => {
    if (attendance.length === 0) {
      toast({ title: "No Data", description: "No attendance records to export" });
      return;
    }

    const headers = ["Name", "Email", "Type", "Check-in Time"];
    const rows = attendance.map(a => [
      a.user?.name || a.guest_label || "Unknown",
      a.user?.email || "Guest",
      a.user_id ? "Member" : "Guest",
      format(new Date(a.checked_in_at), "yyyy-MM-dd HH:mm:ss"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${id}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Success", description: "Attendance exported!" });
  };

  const canManageAttendance = () => {
    if (!profile || !event) return false;
    return (
      event.club_id === profile.club_id &&
      (profile.role === "officer" || profile.role === "sponsor")
    ) || profile.role === "admin";
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

  if (!event || event.status !== "sa_approved") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Attendance tracking is only available for approved events.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!canManageAttendance()) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              You don't have permission to manage attendance for this event.
            </AlertDescription>
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
          onClick={() => navigate(`/events/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Event
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Check-in QR Code
              </CardTitle>
              <CardDescription>{event.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrToken ? (
                <>
                  <div className="flex justify-center p-6 bg-white rounded-lg">
                    {qrDataUrl && (
                      <img src={qrDataUrl} alt="Check-in QR Code" className="max-w-full" />
                    )}
                  </div>
                  
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <AlertDescription>
                      QR code is valid until {format(new Date(qrToken.expires_at), "MMM d, yyyy h:mm a")}
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button onClick={downloadQRCode} variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button onClick={handleGenerateQR} disabled={generating} className="flex-1">
                      {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Regenerate
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">No active QR code for this event</p>
                  <Button onClick={handleGenerateQR} disabled={generating}>
                    {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate QR Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Attendance Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-primary">{attendance.length}</p>
                  <p className="text-sm text-muted-foreground">Total Check-ins</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-accent">
                    {attendance.filter(a => a.user_id).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Members</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-success">
                    {attendance.filter(a => !a.user_id).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Guests</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-muted-foreground">
                    {Math.round((attendance.length / event.expected_attendees) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">vs Expected</p>
                </div>
              </div>

              <Button onClick={exportAttendanceCSV} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export Attendance CSV
              </Button>
            </CardContent>
          </Card>

          {/* Attendance List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                {attendance.length} total check-in(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No one has checked in yet
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {attendance.map((record) => (
                    <div
                      key={record.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">
                          {record.user?.name || record.guest_label || "Anonymous"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.user?.email || "Guest"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {format(new Date(record.checked_in_at), "h:mm a")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.checked_in_at), "MMM d")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
