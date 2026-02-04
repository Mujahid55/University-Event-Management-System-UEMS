import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Calendar, MapPin, Users, Clock, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRoles } from "@/hooks/useUserRoles";

export default function Dashboard() {
  const { profile } = useAuth();
  const { roles, canCreateEvents, canApproveEvents, getRolesForClub } = useUserRoles();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
  });

  useEffect(() => {
    if (profile) {
      loadEvents();
      
      // Realtime subscription
      const channel = supabase
        .channel('dashboard-events')
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
    }
  }, [profile]);

  useEffect(() => {
    applyFilters();
  }, [events, searchQuery, statusFilter]);

  const loadEvents = async () => {
    setLoading(true);
    
    let query = supabase
      .from("events")
      .select(`
        *,
        club:clubs(name),
        venue:venues(name, location),
        creator:profiles!events_created_by_fkey(name)
      `)
      .order("created_at", { ascending: false });

    // Filter based on roles - show events from clubs where user has a role
    const userClubIds = roles
      .filter(r => r.club_id)
      .map(r => r.club_id as string);
    
    if (userClubIds.length > 0 && !canApproveEvents()) {
      // Regular members see their club's events
      query = query.in("club_id", userClubIds);
    } else if (canApproveEvents()) {
      // Approvers see events needing approval
      query = query.in("status", ["submitted", "in_review", "club_approved"]);
    }

    const { data, error } = await query;

    if (!error && data) {
      setEvents(data);
      
      // Get upcoming events
      const now = new Date();
      const upcoming = data
        .filter(e => new Date(e.start_at) > now && e.status === "sa_approved")
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
        .slice(0, 3);
      setUpcomingEvents(upcoming);
      
      // Calculate stats
      setStats({
        total: data.length,
        draft: data.filter(e => e.status === "draft").length,
        submitted: data.filter(e => e.status === "submitted" || e.status === "club_approved").length,
        approved: data.filter(e => e.status === "sa_approved").length,
      });
    }

    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = events;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.club?.name.toLowerCase().includes(query) ||
        e.venue?.name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    setFilteredEvents(filtered);
  };

  const getDashboardTitle = () => {
    if (profile?.role === "sa") return "Event Reviews";
    if (profile?.role === "admin") return "All Events";
    return "My Events";
  };

  const canCreateEvent = profile?.role === "officer" || profile?.role === "sponsor";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{getDashboardTitle()}</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track event approvals
            </p>
          </div>
          {canCreateEvent && (
            <Button 
              onClick={() => navigate("/events/new")}
              className="bg-gradient-primary shadow-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Events</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Draft</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">{stats.draft}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Review</CardDescription>
              <CardTitle className="text-3xl text-warning">{stats.submitted}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Approved</CardDescription>
              <CardTitle className="text-3xl text-success">{stats.approved}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Upcoming Events Widget */}
        {upcomingEvents.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Next 3 approved events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="p-3 border rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{event.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.start_at), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                      <Badge>{event.venue?.name}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="club_approved">Club Approved</SelectItem>
              <SelectItem value="sa_approved">SA Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="changes_required">Changes Required</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              {loading ? "Loading..." : `${filteredEvents.length} event(s) found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading events...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {events.length === 0 
                  ? `No events found. ${canCreateEvent ? "Create your first event to get started!" : ""}`
                  : "No events match your filters."
                }
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <StatusBadge status={event.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(event.start_at), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.venue?.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {event.expected_attendees} attendees
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.created_at), "MMM d")}
                      </div>
                      {event.status === "sa_approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${event.id}/attendance`);
                          }}
                        >
                          View Attendance
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
