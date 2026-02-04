import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type EventStatus = 
  | "draft" 
  | "submitted" 
  | "club_approved" 
  | "sa_approved" 
  | "changes_required" 
  | "rejected";

interface StatusBadgeProps {
  status: EventStatus;
  className?: string;
}

const statusConfig: Record<EventStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-status-draft text-status-draft-foreground border-status-draft",
  },
  submitted: {
    label: "Submitted",
    className: "bg-status-submitted text-status-submitted-foreground border-status-submitted",
  },
  club_approved: {
    label: "Club Approved",
    className: "bg-status-pending text-status-pending-foreground border-status-pending",
  },
  sa_approved: {
    label: "SA Approved",
    className: "bg-status-approved text-status-approved-foreground border-status-approved",
  },
  changes_required: {
    label: "Changes Required",
    className: "bg-warning text-warning-foreground border-warning",
  },
  rejected: {
    label: "Rejected",
    className: "bg-status-rejected text-status-rejected-foreground border-status-rejected",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, "font-medium", className)}
    >
      {config.label}
    </Badge>
  );
}
