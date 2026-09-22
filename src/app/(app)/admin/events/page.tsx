"use client";

import * as React from "react";
import { CheckCircle2, PartyPopper, Search, X, XCircle } from "lucide-react";
import type { EventListItem, EventStatus } from "@/types";
import { getStore } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/event/badges";
import { formatDate, isPast, timeUntil, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type Filter = EventStatus | "all";

export default function AdminEventsPage() {
  const { push } = useToast();
  const [events, setEvents] = React.useState<EventListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [search, setSearch] = React.useState("");
  const [acting, setActing] = React.useState<string | null>(null);
  const [rejecting, setRejecting] = React.useState<EventListItem | null>(null);
  const [reason, setReason] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await getStore().getEvents());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const act = async (id: string, status: EventStatus, msg: string) => {
    setActing(id);
    try {
      await getStore().setEventStatus(id, status);
      push(msg, status === "approved" ? "success" : "info");
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Action failed.", "error");
    } finally {
      setActing(null);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    setActing(rejecting.id);
    try {
      await getStore().setEventStatus(rejecting.id, "rejected", reason.trim() || "No reason provided.");
      push("Event rejected with reason.", "info");
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Rejection failed.", "error");
    } finally {
      setActing(null);
      setRejecting(null);
      setReason("");
    }
  };

  const filtered = events.filter((e) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
    const matchesFilter = filter === "all" || e.status === filter;
    return matchesSearch && matchesFilter;
  });

  const counts: Record<Filter, number> = {
    all: events.length,
    draft: events.filter((e) => e.status === "draft").length,
    pending: events.filter((e) => e.status === "pending").length,
    approved: events.filter((e) => e.status === "approved").length,
    rejected: events.filter((e) => e.status === "rejected").length,
    cancelled: events.filter((e) => e.status === "cancelled").length,
    completed: events.filter((e) => e.status === "completed").length,
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Moderation Hub"
        subtitle="Review, approve and manage every event on the campus."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "draft", "pending", "approved", "rejected", "cancelled", "completed"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600"
              )}
            >
              {f} <span className="ml-1 opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={PartyPopper} title="Nothing here" description="No events match this view." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => (
            <Card key={e.id} className="card-hover flex flex-col p-5 hover:bg-white">
              <div className="flex items-start justify-between gap-2">
                <StatusBadge status={e.status} />
                <span className="text-xs text-muted-foreground">
                  {isPast(e.eventDate) ? `Ended` : `in ${timeUntil(e.eventDate)}`}
                </span>
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{e.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{e.description}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[10px]">{e.category.name}</Badge>
                <Badge variant="secondary" className="text-[10px]">{e.capacity} cap</Badge>
                <Badge variant="secondary" className="text-[10px]">{e.registrationsCount} registered</Badge>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-muted-foreground">
                <span className="min-w-0 truncate font-medium text-slate-600">
                  {e.organizer?.fullName ?? "—"}
                </span>
                <span className="ml-auto">· {formatDate(e.eventDate)}</span>
              </div>

              <div className="mt-3 flex items-center gap-2 pt-1">
                {e.status === "pending" ? (
                  <>
                    <Button variant="secondary" size="sm" className="flex-1" loading={acting === e.id} onClick={() => act(e.id, "approved", "Event approved.")}>
                      <CheckCircle2 className="size-4" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" disabled={acting === e.id} onClick={() => setRejecting(e)}>
                      <XCircle className="size-4" /> Reject
                    </Button>
                  </>
                ) : (
                  <>
                    {e.status === "approved" ? (
                      <Button variant="outline" size="sm" className="flex-1" disabled={acting === e.id} onClick={() => act(e.id, "cancelled", "Event cancelled.")}>
                        Cancel Event
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" className="flex-1" disabled={acting === e.id} onClick={() => act(e.id, "approved", "Event approved.")}>
                        <CheckCircle2 className="size-4" /> Re-publish
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {rejecting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Reject &quot;{rejecting.title}&quot;</h3>
              <button
                type="button"
                onClick={() => { setRejecting(null); setReason(""); }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              A note explains the outcome to the organizer.
            </p>
            <div className="mt-4">
              <Label>Reason for rejection (optional)</Label>
              <Textarea
                className="min-h-24"
                placeholder="e.g. Event date conflicts with mid-semester exams; capacity may exceed the venue."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={acting === rejecting.id}
                onClick={() => { setRejecting(null); setReason(""); }}
              >
                Cancel
              </Button>
              <Button variant="destructive" size="sm" loading={acting === rejecting.id} onClick={confirmReject}>
                <XCircle className="size-4" />
                Reject Event
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}