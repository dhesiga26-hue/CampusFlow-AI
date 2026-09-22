import Link from "next/link";
import { MapPin, Users, CheckCircle2, Clock } from "lucide-react";
import type { EventListItem } from "@/types";
import { Card } from "@/components/ui/card";
import { CategoryBadge, SkillBadge, StatusBadge } from "@/components/event/badges";
import { formatDateShort, pluralize, cn } from "@/lib/utils";

interface EventCardProps {
  event: EventListItem;
  href?: string;
  compact?: boolean;
}

export function EventCard({ event, href, compact }: EventCardProps) {
  const d = formatDateShort(event.eventDate);
  const full = event.registrationsCount >= event.capacity;

  const inner = (
    <>
      <div className="flex gap-4">
        <div
          className={cn(
            "flex shrink-0 flex-col items-center justify-center rounded-xl text-white shadow-sm",
            event.category.accent,
            compact ? "h-14 w-14" : "h-16 w-16"
          )}
        >
          <span className={cn("font-bold leading-none", compact ? "text-lg" : "text-xl")}>
            {d.day}
          </span>
          <span className="text-[10px] font-medium uppercase opacity-90">{d.month}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={event.category} />
            <SkillBadge level={event.skillLevel} />
            {event.status !== "approved" ? <StatusBadge status={event.status} /> : null}
          </div>
          <h3 className={cn("mt-1.5 font-semibold tracking-tight text-slate-900", compact ? "text-sm" : "text-base")}>
            {event.title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {event.location}
          </p>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {d.time}
          </span>
          <span className={cn("flex items-center gap-1.5", full ? "text-rose-600" : "")}>
            <Users className="size-3.5" />
            {event.registrationsCount}/{event.capacity} {pluralize(event.registrationsCount, "spot", "spots")}
            {event.isRegistered ? (
              <span className="ml-1 flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="size-3.5" />
                Registered
              </span>
            ) : null}
          </span>
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className="card-hover h-full p-4 hover:bg-white">{inner}</Card>
      </Link>
    );
  }
  return <Card className="h-full p-4">{inner}</Card>;
}