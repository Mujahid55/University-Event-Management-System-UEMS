import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Trash2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";
import { getRoleDisplay, getRoleBadgeVariant } from "@/hooks/useUserRoles";

type AppRole = Database["public"]["Enums"]["app_role"];
type UserType = Database["public"]["Enums"]["user_type"];

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  user_type: UserType;
  club_id: string | null;
  profile?: {
    name: string;
    email: string;
  };
  club?: {
    name: string;
  };
}

interface Club {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
}

export function RoleManagement() {
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("member");
  const [selectedUserType, setSelectedUserType] = useState<UserType>("student");
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Load all user roles with profile and club data
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select(`
        *,
        profile:profiles!user_roles_user_id_fkey(name, email),
        club:clubs(name)
      `)
      .order("created_at", { ascending: false });

    // Load all clubs
    const { data: clubsData } = await supabase
      .from("clubs")
      .select("id, name")
      .eq("active", true)
      .order("name");

    // Load all profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, name, email")
      .order("name");

    if (rolesData) setUserRoles(rolesData as any);
    if (clubsData) setClubs(clubsData);
    if (profilesData) setProfiles(profilesData);

    setLoading(false);
  };

  const handleAddRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast({ title: "Error", description: "Please select a user and role", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: selectedUserId,
      role: selectedRole,
      user_type: selectedUserType,
      club_id: selectedClubId,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Role added successfully" });
      setDialogOpen(false);
      resetForm();
      loadData();
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Role removed successfully" });
      loadData();
    }
  };

  const resetForm = () => {
    setSelectedUserId("");
    setSelectedRole("member");
    setSelectedUserType("student");
    setSelectedClubId(null);
  };

  const roleNeedsClub = (role: AppRole) => {
    return ["president", "vice_president", "academic_advisor", "member"].includes(role);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Roles Management
            </CardTitle>
            <CardDescription>Manage user roles and permissions across the system</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Role to User</DialogTitle>
                <DialogDescription>
                  Add a new role assignment for a user. Some roles require a club association.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user">User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="user">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name} ({profile.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="president">President</SelectItem>
                      <SelectItem value="vice_president">Vice President</SelectItem>
                      <SelectItem value="academic_advisor">Academic Advisor</SelectItem>
                      <SelectItem value="department_director">Department Director</SelectItem>
                      <SelectItem value="general_director">General Director</SelectItem>
                      <SelectItem value="assistant_project_manager">Assistant Project Manager</SelectItem>
                      <SelectItem value="project_manager">Project Manager</SelectItem>
                      <SelectItem value="system_admin">System Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="user_type">User Type</Label>
                  <Select value={selectedUserType} onValueChange={(v) => setSelectedUserType(v as UserType)}>
                    <SelectTrigger id="user_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="psu_staff">PSU Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {roleNeedsClub(selectedRole) && (
                  <div>
                    <Label htmlFor="club">Club</Label>
                    <Select value={selectedClubId || ""} onValueChange={(v) => setSelectedClubId(v || null)}>
                      <SelectTrigger id="club">
                        <SelectValue placeholder="Select club" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={handleAddRole} className="w-full">
                  Add Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead>Club</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userRoles.map((userRole) => (
              <TableRow key={userRole.id}>
                <TableCell className="font-medium">{userRole.profile?.name}</TableCell>
                <TableCell>{userRole.profile?.email}</TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeVariant(userRole.role)}>
                    {getRoleDisplay(userRole.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {userRole.user_type === "student" ? "Student" : "PSU Staff"}
                  </Badge>
                </TableCell>
                <TableCell>{userRole.club?.name || "-"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRole(userRole.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {userRoles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No roles assigned yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
