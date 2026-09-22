import type { Category, SkillLevel, EventStatus, Role } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm",
        category.accent,
        className
      )}
    >
      {category.name}
    </span>
  );
}

export function SkillBadge({ level }: { level: SkillLevel }) {
  const config: Record<SkillLevel, { label: string; variant: "info" | "warning" | "destructive" | "secondary" }> = {
    beginner: { label: "Beginner", variant: "info" },
    intermediate: { label: "Intermediate", variant: "warning" },
    advanced: { label: "Advanced", variant: "destructive" },
    all: { label: "All Levels", variant: "secondary" },
  };
  const c = config[level];
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export function StatusBadge({ status }: { status: EventStatus }) {
  const config: Record<EventStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
    draft: { label: "Draft", variant: "secondary" },
    approved: { label: "Approved", variant: "success" },
    pending: { label: "Pending Review", variant: "warning" },
    rejected: { label: "Rejected", variant: "destructive" },
    cancelled: { label: "Cancelled", variant: "secondary" },
    completed: { label: "Completed", variant: "default" },
  };
  const c = config[status];
  return <Badge variant={c.variant}>{c.label}</Badge>
}

export function RoleBadge({ role }: { role: Role }) {
  const config: Record<Role, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" | "info" }> = {
    student: { label: "Student", variant: "info" },
    organizer: { label: "Organizer", variant: "warning" },
    admin: { label: "Admin", variant: "secondary" },
  };
  const c = config[role];
  return <Badge variant={c.variant}>{c.label}</Badge>;
}