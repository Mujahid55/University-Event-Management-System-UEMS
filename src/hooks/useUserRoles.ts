import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type AppRole = 
  | "president"
  | "vice_president"
  | "academic_advisor"
  | "department_director"
  | "general_director"
  | "assistant_project_manager"
  | "project_manager"
  | "system_admin"
  | "member";

export type UserType = "student" | "psu_staff";

export interface UserRole {
  id: string;
  user_id: string;
  club_id: string | null;
  role: AppRole;
  user_type: UserType;
  created_at: string;
  updated_at: string;
}

export function useUserRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRoles();
    } else {
      setRoles([]);
      setLoading(false);
    }
  }, [user?.id]);

  const loadRoles = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data) {
      setRoles(data as UserRole[]);
    }
    setLoading(false);
  };

  const hasRole = (role: AppRole, clubId?: string): boolean => {
    if (clubId) {
      return roles.some(r => r.role === role && r.club_id === clubId);
    }
    return roles.some(r => r.role === role);
  };

  const hasAnyRole = (checkRoles: AppRole[], clubId?: string): boolean => {
    return checkRoles.some(role => hasRole(role, clubId));
  };

  const getRolesForClub = (clubId: string): AppRole[] => {
    return roles
      .filter(r => r.club_id === clubId)
      .map(r => r.role);
  };

  const getPrimaryRole = (): AppRole | null => {
    // Priority order for display
    const priority: AppRole[] = [
      "system_admin",
      "president",
      "vice_president",
      "general_director",
      "academic_advisor",
      "department_director",
      "project_manager",
      "assistant_project_manager",
      "member"
    ];

    for (const role of priority) {
      if (hasRole(role)) return role;
    }
    return null;
  };

  const canApproveEvents = (): boolean => {
    return hasAnyRole([
      "system_admin",
      "president",
      "vice_president",
      "general_director",
      "academic_advisor",
      "department_director"
    ]);
  };

  const canCreateEvents = (clubId?: string): boolean => {
    if (!clubId) return false;
    // Officers can create events for their club
    return getRolesForClub(clubId).length > 0 && !hasRole("member", clubId);
  };

  const canManageVenues = (): boolean => {
    return hasAnyRole(["system_admin", "president", "vice_president"]);
  };

  const canExportAttendance = (scope: "project" | "organization"): boolean => {
    if (scope === "project") {
      return hasAnyRole([
        "project_manager",
        "assistant_project_manager", 
        "general_director",
        "vice_president",
        "president"
      ]);
    } else {
      return hasAnyRole(["vice_president", "president"]);
    }
  };

  return {
    roles,
    loading,
    hasRole,
    hasAnyRole,
    getRolesForClub,
    getPrimaryRole,
    canApproveEvents,
    canCreateEvents,
    canManageVenues,
    canExportAttendance,
    refreshRoles: loadRoles
  };
}

export function getRoleDisplay(role: AppRole): string {
  const roleMap: Record<AppRole, string> = {
    president: "President",
    vice_president: "Vice President",
    academic_advisor: "Academic Advisor",
    department_director: "Department Director",
    general_director: "General Director",
    assistant_project_manager: "Assistant Project Manager",
    project_manager: "Project Manager",
    system_admin: "System Admin",
    member: "Member"
  };
  return roleMap[role] || role;
}

export function getRoleBadgeVariant(role: AppRole): string {
  if (role === "system_admin") return "bg-destructive text-destructive-foreground";
  if (role === "president" || role === "vice_president") return "bg-primary text-primary-foreground";
  if (role === "general_director" || role === "department_director") return "bg-accent text-accent-foreground";
  return "bg-muted text-muted-foreground";
}
