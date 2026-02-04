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
import { Loader2, Users, Plus, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClubManagement() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    if (profile?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    loadClubs();
  }, [profile, navigate]);

  const loadClubs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clubs")
      .select("*")
      .order("name");
    
    if (data) setClubs(data);
    setLoading(false);
  };

  const loadMembers = async (clubId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("club_id", clubId)
      .order("name");
    
    if (data) setMembers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const clubData = {
      name: name.trim(),
      description: description.trim() || null,
    };

    if (editingClub) {
      const { error } = await supabase
        .from("clubs")
        .update(clubData)
        .eq("id", editingClub.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Club updated!" });
        resetForm();
        setDialogOpen(false);
        loadClubs();
      }
    } else {
      const { error } = await supabase
        .from("clubs")
        .insert(clubData);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Club created!" });
        resetForm();
        setDialogOpen(false);
        loadClubs();
      }
    }
  };

  const handleEdit = (club: any) => {
    setEditingClub(club);
    setName(club.name);
    setDescription(club.description || "");
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this club? This will affect all associated members and events.")) return;

    const { error } = await supabase
      .from("clubs")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Club deleted!" });
      loadClubs();
    }
  };

  const handleViewMembers = (club: any) => {
    setSelectedClub(club);
    loadMembers(club.id);
    setMemberDialogOpen(true);
  };

  const handleUpdateMemberRole = async () => {
    if (!selectedMemberId || !selectedRole) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: selectedRole as any })
      .eq("id", selectedMemberId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Member role updated!" });
      loadMembers(selectedClub.id);
      setSelectedMemberId("");
      setSelectedRole("");
    }
  };

  const resetForm = () => {
    setEditingClub(null);
    setName("");
    setDescription("");
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
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Club Management</h1>
              <p className="text-muted-foreground">Manage clubs and members</p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Club
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClub ? "Edit Club" : "Add New Club"}</DialogTitle>
                <DialogDescription>
                  {editingClub ? "Update club details" : "Create a new club"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Club Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingClub ? "Update Club" : "Create Club"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clubs</CardTitle>
            <CardDescription>{clubs.length} clubs registered</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubs.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell className="font-medium">{club.name}</TableCell>
                    <TableCell>{club.description || "-"}</TableCell>
                    <TableCell>
                      <span className={club.active ? "text-success" : "text-muted-foreground"}>
                        {club.active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewMembers(club)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Members
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(club)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(club.id)}
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

        <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Members - {selectedClub?.name}</DialogTitle>
              <DialogDescription>
                View and manage club members
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell className="capitalize">{member.role}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMemberId(member.id);
                            setSelectedRole(member.role);
                          }}
                        >
                          Change Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {selectedMemberId && (
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>New Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="officer">Officer</SelectItem>
                        <SelectItem value="sponsor">Sponsor</SelectItem>
                        <SelectItem value="sa">SA Reviewer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleUpdateMemberRole}>Update Role</Button>
                  <Button variant="outline" onClick={() => {
                    setSelectedMemberId("");
                    setSelectedRole("");
                  }}>Cancel</Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
