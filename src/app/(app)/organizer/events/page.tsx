"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarPlus, Pencil, Plus, QrCode, Trash2, Users } from "lucide-react";
import type { EventListItem } from "@/types";
import { useAuth } from "@/components/auth-context";
import { getStore } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/event/badges";
import { formatDate, isPast, timeUntil, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type Filter = "all" | "upcoming" | "past" | "pending";

export default function OrganizerEventsPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [events, setEvents] = React.useState<EventListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setEvents(await getStore().getEvents({ mine: true, organizerId: user.id }));
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const filtered = events.filter((e) => {
    if (filter === "upcoming") return !isPast(e.eventDate);
    if (filter === "past") return isPast(e.eventDate);
    if (filter === "pending") return e.status === "pending";
    return true;
  });

  const handleDelete = async (event: EventListItem) => {
    if (!user) return;
    if (!window.confirm(`Delete "${event.title}"? This also removes all registrations.`)) return;
    setDeleting(event.id);
    try {
      await getStore().deleteEvent(event.id, user.id);
      push("Event deleted.", "info");
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(null);
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "pending", label: "Pending" },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="My Events"
        subtitle="Create, edit and manage your events."
        actions={
          <Link href="/organizer/events/new">
            <Button variant="gradient" size="sm">
              <Plus className="size-4" />
              New Event
            </Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              filter === f.key
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600"
            )}
          >
            {f.label}
            <span className="ml-1 opacity-60">
              {f.key === "all"
                ? events.length
                : events.filter((e) =>
                    f.key === "upcoming"
                      ? !isPast(e.eventDate)
                      : f.key === "past"
                      ? isPast(e.eventDate)
                      : e.status === "pending"
                  ).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="No events here yet"
          description="Create an event and watch registrations roll in."
          action={{ label: "Create Event", href: "/organizer/events/new" }}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="card-hover flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-white shadow-sm",
                    e.category.accent
                  )}
                >
                  <span className="text-lg font-bold leading-none">
                    {new Date(e.eventDate).toLocaleDateString("en-US", { day: "numeric" })}
                  </span>
                  <span className="text-[10px] uppercase opacity-90">
                    {new Date(e.eventDate).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-slate-900">{e.title}</h3>
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(e.eventDate)} · {e.location}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPast(e.eventDate) ? "Ended" : `Starts in ${timeUntil(e.eventDate)}`} ·{" "}
                    <span className={e.registrationsCount >= e.capacity ? "text-rose-600 font-medium" : ""}>
                      {e.registrationsCount}/{e.capacity} registered
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {e.status === "pending" ? (
                  <Badge variant="warning" className="text-[10px]">Awaiting admin approval</Badge>
                ) : null}
                <Link href={`/organizer/events/${e.id}`}>
                  <Button variant="outline" size="sm">
                    <Users className="size-4" />
                    {e.registrationsCount}
                  </Button>
                </Link>
                <Link href={`/organizer/scan?event=${e.id}`}>
                  <Button variant="secondary" size="sm">
                    <QrCode className="size-4" />
                    Scan
                  </Button>
                </Link>
                <Link href={`/organizer/events/${e.id}/edit`}>
                  <Button variant="ghost" size="icon-sm">
                    <Pencil className="size-4 text-slate-500" />
                  </Button>
                </Link>
                <button
                  type="button"
                  disabled={deleting === e.id}
                  onClick={() => handleDelete(e)}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}