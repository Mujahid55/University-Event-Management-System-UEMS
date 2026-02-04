import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, UserCog, Shield, CheckSquare } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { RoleManagement } from "@/components/RoleManagement";
import { useUserRoles } from "@/hooks/useUserRoles";

type UserRole = "member" | "officer" | "sponsor" | "sa" | "admin";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  club_id: string | null;
  club?: {
    name: string;
  };
}

interface Club {
  id: string;
  name: string;
}

export default function Admin() {
  const { profile } = useAuth();
  const { canManageVenues } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [bulkComment, setBulkComment] = useState("");

  useEffect(() => {
    if (!canManageVenues()) {
      navigate("/dashboard");
      return;
    }
    loadData();

    const channel = supabase
      .channel('admin-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canManageVenues, navigate]);

  const loadData = async () => {
    setLoading(true);
    
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, email, role, club_id")
      .order("name");

    const { data: clubsData, error: clubsError } = await supabase
      .from("clubs")
      .select("id, name")
      .eq("active", true)
      .order("name");

    const { data: eventsData } = await supabase
      .from("events")
      .select(`
        *,
        club:clubs(name),
        venue:venues(name)
      `)
      .in("status", ["submitted", "club_approved"])
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast({ 
        title: "Error", 
        description: "Failed to load users",
        variant: "destructive" 
      });
    } else if (clubsError) {
      toast({ 
        title: "Error", 
        description: "Failed to load clubs",
        variant: "destructive" 
      });
    } else {
      const profilesWithClubs = profilesData?.map(profile => ({
        ...profile,
        club: profile.club_id 
          ? clubsData?.find(club => club.id === profile.club_id)
          : null
      }));
      setProfiles(profilesWithClubs as any);
      setClubs(clubsData || []);
      setPendingEvents(eventsData || []);
    }

    setLoading(false);
  };

  const handleBulkApprove = async () => {
    if (selectedEvents.size === 0) {
      toast({ title: "Error", description: "Select events to approve", variant: "destructive" });
      return;
    }

    setUpdating("bulk");

    for (const eventId of selectedEvents) {
      await supabase.from("events").update({ status: "sa_approved" }).eq("id", eventId);
      
      if (bulkComment.trim()) {
        await supabase.from("approvals").insert({
          event_id: eventId,
          reviewer_id: profile?.id,
          stage: "sa",
          status: "approved",
          comment: bulkComment.trim(),
        });
      }
    }

    toast({ title: "Success", description: `${selectedEvents.size} event(s) approved!` });
    setSelectedEvents(new Set());
    setBulkComment("");
    loadData();
    setUpdating(null);
  };

  const handleBulkReject = async () => {
    if (selectedEvents.size === 0) {
      toast({ title: "Error", description: "Select events to reject", variant: "destructive" });
      return;
    }

    if (!bulkComment.trim()) {
      toast({ title: "Error", description: "Comment required for rejection", variant: "destructive" });
      return;
    }

    setUpdating("bulk");

    for (const eventId of selectedEvents) {
      const event = pendingEvents.find(e => e.id === eventId);

      await supabase.from("events").update({ status: "rejected" }).eq("id", eventId);
      
      await supabase.from("approvals").insert({
        event_id: eventId,
        reviewer_id: profile?.id,
        stage: event?.status === "submitted" ? "club" : "sa",
        status: "rejected",
        comment: bulkComment.trim(),
      });
    }

    toast({ title: "Success", description: `${selectedEvents.size} event(s) rejected!` });
    setSelectedEvents(new Set());
    setBulkComment("");
    loadData();
    setUpdating(null);
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    setUpdating(userId);
    
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Success", 
        description: "User role updated successfully" 
      });
      loadData();
    }

    setUpdating(null);
  };

  const updateUserClub = async (userId: string, clubId: string | null) => {
    setUpdating(userId);
    
    const { error } = await supabase
      .from("profiles")
      .update({ club_id: clubId })
      .eq("id", userId);

    if (error) {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Success", 
        description: "User club updated successfully" 
      });
      loadData();
    }

    setUpdating(null);
  };

  if (!canManageVenues()) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage roles, users, and events</p>
          </div>
        </div>

        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roles">Roles Management</TabsTrigger>
            <TabsTrigger value="users">Legacy Users</TabsTrigger>
            <TabsTrigger value="events">Bulk Approval</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="mt-6">
            <RoleManagement />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management (Legacy)</CardTitle>
                <CardDescription>
                  {profiles.length} registered users - Legacy role system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) => updateUserRole(user.id, value as UserRole)}
                              disabled={updating === user.id}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="officer">Officer</SelectItem>
                                <SelectItem value="sponsor">Sponsor</SelectItem>
                                <SelectItem value="sa">SA</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.club_id || "none"}
                              onValueChange={(value) => updateUserClub(user.id, value === "none" ? null : value)}
                              disabled={updating === user.id}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="No club assigned">
                                  {user.club_id && user.club ? user.club.name : "No club"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No club</SelectItem>
                                {clubs.map((club) => (
                                  <SelectItem key={club.id} value={club.id}>
                                    {club.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {updating === user.id && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            {pendingEvents.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Event Approval</CardTitle>
                  <CardDescription>
                    {pendingEvents.length} events pending review
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {pendingEvents.map((event) => (
                      <div key={event.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={selectedEvents.has(event.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedEvents);
                            if (checked) {
                              newSet.add(event.id);
                            } else {
                              newSet.delete(event.id);
                            }
                            setSelectedEvents(newSet);
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.club?.name} • {event.venue?.name}
                          </p>
                        </div>
                        <StatusBadge status={event.status} />
                      </div>
                    ))}
                  </div>

                  {selectedEvents.size > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Comment (optional for approval, required for rejection)</Label>
                        <Textarea
                          value={bulkComment}
                          onChange={(e) => setBulkComment(e.target.value)}
                          placeholder="Add a comment for selected events..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleBulkApprove}
                          disabled={updating === "bulk"}
                        >
                          {updating === "bulk" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckSquare className="mr-2 h-4 w-4" />}
                          Approve {selectedEvents.size} Event(s)
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleBulkReject}
                          disabled={updating === "bulk"}
                        >
                          Reject {selectedEvents.size} Event(s)
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedEvents(new Set());
                            setBulkComment("");
                          }}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No events pending approval
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
