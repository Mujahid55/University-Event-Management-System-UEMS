import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Plus, Edit, Trash2, Calendar, X } from "lucide-react";
import { format } from "date-fns";

export default function AdminVenues() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<any>(null);
  const [blackoutDialogOpen, setBlackoutDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [blackoutDates, setBlackoutDates] = useState<any[]>([]);
  
  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  
  // Blackout form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (profile?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    loadVenues();
  }, [profile, navigate]);

  const loadVenues = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("venues")
      .select("*")
      .order("name");
    
    if (data) setVenues(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const venueData = {
      name: name.trim(),
      location: location.trim(),
      capacity: parseInt(capacity),
      active: true,
    };

    if (editingVenue) {
      const { error } = await supabase
        .from("venues")
        .update(venueData)
        .eq("id", editingVenue.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Venue updated!" });
        setDialogOpen(false);
        resetForm();
        loadVenues();
      }
    } else {
      const { error } = await supabase
        .from("venues")
        .insert(venueData);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Venue created!" });
        setDialogOpen(false);
        resetForm();
        loadVenues();
      }
    }
  };

  const handleEdit = (venue: any) => {
    setEditingVenue(venue);
    setName(venue.name);
    setLocation(venue.location);
    setCapacity(venue.capacity.toString());
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this venue?")) return;

    const { error } = await supabase
      .from("venues")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Venue deleted!" });
      loadVenues();
    }
  };

  const resetForm = () => {
    setEditingVenue(null);
    setName("");
    setLocation("");
    setCapacity("");
  };

  const loadBlackoutDates = async (venueId: string) => {
    const { data } = await supabase
      .from("blackout_dates")
      .select("*")
      .eq("venue_id", venueId)
      .order("start_date");
    
    if (data) setBlackoutDates(data);
  };

  const handleManageBlackouts = (venue: any) => {
    setSelectedVenue(venue);
    loadBlackoutDates(venue.id);
    setBlackoutDialogOpen(true);
  };

  const handleAddBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from("blackout_dates")
      .insert({
        venue_id: selectedVenue.id,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Blackout date added!" });
      setStartDate("");
      setEndDate("");
      setReason("");
      loadBlackoutDates(selectedVenue.id);
    }
  };

  const handleDeleteBlackout = async (id: string) => {
    const { error } = await supabase
      .from("blackout_dates")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Blackout date removed!" });
      loadBlackoutDates(selectedVenue.id);
    }
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
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Venue Management</h1>
              <p className="text-muted-foreground">Manage event venues and capacities</p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Venue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingVenue ? "Edit Venue" : "Add New Venue"}</DialogTitle>
                <DialogDescription>
                  {editingVenue ? "Update venue details" : "Create a new venue for events"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Venue Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Building, Room Number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingVenue ? "Update Venue" : "Create Venue"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Venues</CardTitle>
            <CardDescription>{venues.length} venues available</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venues.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell className="font-medium">{venue.name}</TableCell>
                    <TableCell>{venue.location}</TableCell>
                    <TableCell>{venue.capacity}</TableCell>
                    <TableCell>
                      <span className={venue.active ? "text-success" : "text-muted-foreground"}>
                        {venue.active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleManageBlackouts(venue)}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(venue)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(venue.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={blackoutDialogOpen} onOpenChange={setBlackoutDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Blackout Dates - {selectedVenue?.name}</DialogTitle>
              <DialogDescription>
                Block specific dates when this venue is unavailable
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddBlackout} className="space-y-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date *</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date *</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Maintenance, Private event, Renovations"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Blackout Date
              </Button>
            </form>

            {blackoutDates.length > 0 ? (
              <div className="space-y-2">
                <Label>Current Blackout Dates</Label>
                <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                  {blackoutDates.map((blackout) => (
                    <div key={blackout.id} className="p-3 flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">
                          {format(new Date(blackout.start_date), "MMM d, yyyy")} - {format(new Date(blackout.end_date), "MMM d, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {blackout.reason}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBlackout(blackout.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No blackout dates configured
              </p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
