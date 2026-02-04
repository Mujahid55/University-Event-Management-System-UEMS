import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/hooks/useUserRoles";
import type { Database } from "@/integrations/supabase/types";

type EventStatus = Database["public"]["Enums"]["event_status"];

export interface ApprovalLevel {
  level: number;
  required_roles: AppRole[];
  approval_rule: "AND" | "OR";
}

// Define the approval workflow as per RBAC specification
export const APPROVAL_WORKFLOW: ApprovalLevel[] = [
  {
    level: 1,
    required_roles: ["department_director", "academic_advisor"],
    approval_rule: "AND"
  },
  {
    level: 2,
    required_roles: ["general_director"],
    approval_rule: "OR"
  },
  {
    level: 3,
    required_roles: ["vice_president"],
    approval_rule: "OR"
  },
  {
    level: 4,
    required_roles: ["president"],
    approval_rule: "OR"
  }
];

export async function initializeApprovalLevels(eventId: string) {
  const approvalLevels = APPROVAL_WORKFLOW.map(level => ({
    event_id: eventId,
    level: level.level,
    required_roles: level.required_roles,
    approval_rule: level.approval_rule,
    status: "pending"
  }));

  const { error } = await supabase
    .from("approval_levels")
    .insert(approvalLevels);

  if (error) {
    console.error("Failed to initialize approval levels:", error);
    throw error;
  }
}

export async function getApprovalLevelsForEvent(eventId: string) {
  const { data, error } = await supabase
    .from("approval_levels")
    .select("*")
    .eq("event_id", eventId)
    .order("level");

  if (error) {
    console.error("Failed to fetch approval levels:", error);
    return [];
  }

  return data || [];
}

export async function approveLevel(
  eventId: string,
  level: number,
  userId: string,
  comment?: string
) {
  // Check if user is the creator (prevent self-approval)
  const { data: event } = await supabase
    .from("events")
    .select("created_by")
    .eq("id", eventId)
    .single();

  if (event?.created_by === userId) {
    throw new Error("Creator cannot approve their own event");
  }

  const { error } = await supabase
    .from("approval_levels")
    .update({
      status: "approved",
      approved_by: userId,
      approved_at: new Date().toISOString(),
      comment: comment || null
    })
    .eq("event_id", eventId)
    .eq("level", level);

  if (error) throw error;

  // Check if all levels are approved
  await checkAndFinalizeEvent(eventId);
}

export async function rejectLevel(
  eventId: string,
  level: number,
  userId: string,
  comment: string
) {
  const { error } = await supabase
    .from("approval_levels")
    .update({
      status: "rejected",
      approved_by: userId,
      approved_at: new Date().toISOString(),
      comment
    })
    .eq("event_id", eventId)
    .eq("level", level);

  if (error) throw error;

  // Update event status to rejected
  await supabase
    .from("events")
    .update({ status: "rejected" })
    .eq("id", eventId);
}

async function checkAndFinalizeEvent(eventId: string) {
  const levels = await getApprovalLevelsForEvent(eventId);
  
  // Check if any level is rejected
  if (levels.some(l => l.status === "rejected")) {
    await supabase
      .from("events")
      .update({ status: "rejected" })
      .eq("id", eventId);
    return;
  }

  // Check if all levels are approved
  const allApproved = levels.every(l => l.status === "approved");
  
  if (allApproved) {
    await supabase
      .from("events")
      .update({ 
        status: "approved" as EventStatus,
        last_decision_at: new Date().toISOString()
      })
      .eq("id", eventId);
  } else {
    // Update to in_progress if at least one is approved but not all
    const anyApproved = levels.some(l => l.status === "approved");
    if (anyApproved) {
      await supabase
        .from("events")
        .update({ status: "in_review" as EventStatus })
        .eq("id", eventId);
    }
  }
}

export async function canUserApproveLevel(
  userId: string,
  eventId: string,
  level: number
): Promise<boolean> {
  // Get the approval level details
  const { data: approvalLevel } = await supabase
    .from("approval_levels")
    .select("*")
    .eq("event_id", eventId)
    .eq("level", level)
    .single();

  if (!approvalLevel || approvalLevel.status !== "pending") {
    return false;
  }

  // Check if user has any of the required roles
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (!userRoles) return false;

  const hasRequiredRole = userRoles.some(ur => 
    approvalLevel.required_roles.includes(ur.role as AppRole)
  );

  return hasRequiredRole;
}

export async function getCurrentApprovalLevel(eventId: string): Promise<number> {
  const levels = await getApprovalLevelsForEvent(eventId);
  
  // Find the first pending level
  const pendingLevel = levels.find(l => l.status === "pending");
  
  return pendingLevel?.level || 0;
}
