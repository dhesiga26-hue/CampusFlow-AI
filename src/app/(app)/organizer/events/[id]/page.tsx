"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Pencil,
  QrCode,
  Search,
  Users,
} from "lucide-react";
import type { EventListItem } from "@/types";
import { useAuth } from "@/components/auth-context";
import { getStore } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryBadge, SkillBadge, StatusBadge } from "@/components/event/badges";
import EventInsights from "@/components/event/event-insights";
import { FeedbackReview } from "@/components/event/feedback-panel";
import { formatDate, isPast } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface RegRow {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  attended: boolean;
  qrPayload: string;
}

export default function OrganizerEventPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const { user } = useAuth();
  const { push } = useToast();

  const [event, setEvent] = React.useState<EventListItem | null>(null);
  const [registrations, setRegistrations] = React.useState<RegRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [marking, setMarking] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [evt, regs] = await Promise.all([
        getStore().getEvent(eventId),
        getStore().getRegistrations(eventId),
      ]);
      setEvent(evt);
      setRegistrations(
        regs.map((r) => ({
          id: r.id,
          fullName: r.profile?.fullName ?? "Unknown student",
          email: r.profile?.email ?? "",
          createdAt: r.createdAt,
          attended: r.attended,
          qrPayload: r.qrPayload,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const filtered = registrations.filter((r) => {
    const q = search.toLowerCase().trim();
    return !q || r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  const attendedCount = registrations.filter((r) => r.attended).length;
  const remaining = Math.max(
    0,
    (event?.capacity ?? 0) - registrations.length
  );

  const handleManualCheckIn = async (r: RegRow) => {
    if (!user) return;
    setMarking(true);
    try {
      const result = await getStore().markAttendance(r.qrPayload, user.id);
      push(result.message, result.ok ? "success" : "error");
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Check-in failed.", "error");
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <PageLoader label="Loading event…" />;
  if (!event && !loading) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">Event not found</p>
        <Link href="/organizer/events" className="mt-2 inline-block text-sm text-violet-600">
          Back to My Events
        </Link>
      </div>
    );
  }

  const exportCsv = () => {
    const rows = [
      ["Name", "Email", "Registered At", "Attendance"],
      ...registrations.map((r) => [r.fullName, r.email, new Date(r.createdAt).toISOString(), r.attended ? "Present" : "Absent"]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event!.title.replace(/[^a-z0-9]+/gi, "-")}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-up">
      <Link
        href="/organizer/events"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-violet-600"
      >
        <ArrowLeft className="size-4" />
        Back to My Events
      </Link>

      <PageHeader
        title={event?.title ?? ""}
        subtitle={`${event?.location} · ${event ? formatDate(event.eventDate) : ""}`}
        actions={
          <div className="flex gap-2">
            <Link href={`/organizer/scan?event=${event?.id}`}>
              <Button variant="secondary" size="sm">
                <QrCode className="size-4" /> Scan Passes
              </Button>
            </Link>
            <Link href={`/organizer/events/${event?.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="size-4" /> Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="size-4" /> CSV
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Registered</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{registrations.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Checked In</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{attendedCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Spots Left</div>
          <div className="mt-1 text-2xl font-bold text-violet-600">{remaining}</div>
        </Card>
      </div>

      <Card className="mb-6 flex flex-wrap items-center gap-3 p-4">
        <CategoryBadge category={event!.category} />
        <SkillBadge level={event!.skillLevel} />
        <StatusBadge status={event!.status} />
        <span className="text-xs text-muted-foreground">
          {event!.registrationsCount}/{event!.capacity} spots filled ·{" "}
          {isPast(event!.eventDate) ? "Event has ended" : `Attendance open`}
        </span>
      </Card>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          AI Insights
        </h2>
        <EventInsights event={event!} />
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Participant Feedback
        </h2>
        <FeedbackReview event={event!} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Participants ({filtered.length})
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No participants yet"
          description={registrations.length === 0 ? "No one has registered yet. Share your event!" : "No results match your search."}
          action={{
            label: "Scan a pass",
            href: `/organizer/scan?event=${event?.id}`,
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[1fr_1fr_auto] items-center gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Student</span>
            <span>Registered</span>
            <span>Attendance</span>
          </div>
          {filtered.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-1 gap-3 border-b border-slate-100 px-5 py-3.5 last:border-0 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:gap-4"
            >
              <div className="flex items-center gap-3">
                <Avatar name={r.fullName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{r.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <div className="flex items-center justify-between sm:justify-end">
                {r.attended ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Present
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={marking}
                    onClick={() => handleManualCheckIn(r)}
                  >
                    <CheckCircle2 className="size-3.5" />
                    Mark Present
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}