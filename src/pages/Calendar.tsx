import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Calendar as BigCalendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Loader2, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const localizer = momentLocalizer(moment);

export default function Calendar() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [view, setView] = useState<View>("month");

  useEffect(() => {
    loadEvents();
    
    // Realtime subscription
    const channel = supabase
      .channel('calendar-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => loadEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const loadEvents = async () => {
    setLoading(true);
    
    let query = supabase
      .from("events")
      .select("*, venue:venues(name), club:clubs(name)");

    if (profile?.role === "member") {
      query = query.in("status", ["club_approved", "sa_approved"]);
    } else if (profile?.role === "officer" || profile?.role === "sponsor") {
      query = query.or(`club_id.eq.${profile.club_id},status.in.(club_approved,sa_approved)`);
    }

    const { data } = await query;
    if (data) setEvents(data);
    setLoading(false);
  };

  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_at),
      end: new Date(event.end_at),
      resource: event,
    }));
  }, [events]);

  const eventStyleGetter = (event: any) => {
    const status = event.resource.status;
    let backgroundColor = "#3174ad";
    
    if (status === "draft") backgroundColor = "#9ca3af";
    else if (status === "submitted") backgroundColor = "#eab308";
    else if (status === "club_approved") backgroundColor = "#3b82f6";
    else if (status === "sa_approved") backgroundColor = "#10b981";
    else if (status === "rejected") backgroundColor = "#ef4444";
    else if (status === "changes_required") backgroundColor = "#f97316";

    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <CalendarDays className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Event Calendar</h1>
            <p className="text-muted-foreground">View all events in calendar format</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "700px" }}>
              <BigCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => navigate(`/events/${event.id}`)}
                popup
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#9ca3af" }}></div>
            <span className="text-sm">Draft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#eab308" }}></div>
            <span className="text-sm">Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
            <span className="text-sm">Club Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }}></div>
            <span className="text-sm">SA Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f97316" }}></div>
            <span className="text-sm">Changes Required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }}></div>
            <span className="text-sm">Rejected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
