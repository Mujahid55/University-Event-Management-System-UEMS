import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, Calendar, CheckCircle } from "lucide-react";

export default function Analytics() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    approvedEvents: 0,
    pendingEvents: 0,
    totalAttendance: 0,
  });

  useEffect(() => {
    if (!profile) {
      navigate("/auth");
      return;
    }
    loadAnalytics();
  }, [profile, navigate]);

  const loadAnalytics = async () => {
    setLoading(true);

    // Get event counts
    const { count: totalEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    const { count: approvedEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .in("status", ["sa_approved", "club_approved"]);

    const { count: pendingEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted");

    // Get total attendance
    const { count: totalAttendance } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true });

    setStats({
      totalEvents: totalEvents || 0,
      approvedEvents: approvedEvents || 0,
      pendingEvents: pendingEvents || 0,
      totalAttendance: totalAttendance || 0,
    });

    setLoading(false);
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
      
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Overview of event statistics and attendance</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">All time events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved Events</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedEvents}</div>
              <p className="text-xs text-muted-foreground">Successfully approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingEvents}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttendance}</div>
              <p className="text-xs text-muted-foreground">Check-ins across all events</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>Quick insights into CEMS usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Approval Rate</span>
                <span className="font-semibold">
                  {stats.totalEvents > 0 
                    ? Math.round((stats.approvedEvents / stats.totalEvents) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Attendance per Event</span>
                <span className="font-semibold">
                  {stats.approvedEvents > 0 
                    ? Math.round(stats.totalAttendance / stats.approvedEvents)
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
