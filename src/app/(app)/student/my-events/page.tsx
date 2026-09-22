"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  QrCode,
  XCircle,
} from "lucide-react";
import type { RegistrationWithEvent } from "@/types";
import { useAuth } from "@/components/auth-context";
import { getStore } from "@/lib/db";
import { PageHeader, SectionHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatDateShort, formatDate, isPast, cn } from "@/lib/utils";

export default function MyEventsPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [registrations, setRegistrations] = React.useState<RegistrationWithEvent[]>([]);
  const [attendedEventIds, setAttendedEventIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [cancelling, setCancelling] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [regs, attendance] = await Promise.all([
        getStore().getMyRegistrations(user.id),
        getStore().getMyAttendance(user.id),
      ]);
      setRegistrations(regs);
      setAttendedEventIds(new Set(attendance.map((a) => a.eventId)));
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const upcoming = registrations.filter(
    (r) => !isPast(r.event.eventDate) && r.event.status === "approved"
  );
  const past = registrations.filter((r) => isPast(r.event.eventDate));
  const attended = (r: RegistrationWithEvent) => attendedEventIds.has(r.event.id);

  const handleCancel = async (r: RegistrationWithEvent) => {
    if (!user) return;
    setCancelling(r.id);
    try {
      await getStore().cancelRegistration(r.id, user.id);
      push("Registration cancelled.", "info");
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Failed to cancel.", "error");
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return <PageLoader label="Loading your registrations…" />;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="My Events"
        subtitle="Your registrations and QR passes in one place."
        actions={
          <Link href="/student/events">
            <Button variant="gradient" size="sm">
              <Calendar className="size-4" /> Discover More
            </Button>
          </Link>
        }
      />

      <SectionHeader title={`Upcoming (${upcoming.length})`} />
      {upcoming.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No upcoming registrations"
          description="Browse events and register to get your QR pass."
          action={{ label: "Browse events", href: "/student/events" }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {upcoming.map((r) => {
            const d = formatDateShort(r.event.eventDate);
            return (
              <Card key={r.id} className="card-hover flex gap-4 p-4">
                <div
                  className={cn(
                    "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl text-white shadow-sm",
                    r.event.category.accent
                  )}
                >
                  <span className="text-xl font-bold leading-none">{d.day}</span>
                  <span className="text-[10px] uppercase opacity-90">{d.month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="gap-1 text-[10px]">
                      <CheckCircle2 className="size-3" /> Registered
                    </Badge>
                    {r.event.registrationsCount >= r.event.capacity ? (
                      <Badge variant="warning" className="text-[10px]">Full</Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-1.5 truncate font-semibold text-slate-900">{r.event.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(r.event.eventDate)} · {r.event.location}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <Link href={`/student/my-events/${r.event.id}/pass`}>
                      <Button variant="gradient" size="sm">
                        <QrCode className="size-4" /> QR Pass
                      </Button>
                    </Link>
                    <button
                      type="button"
                      disabled={cancelling === r.id}
                      onClick={() => handleCancel(r)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-rose-600 disabled:opacity-50"
                    >
                      <XCircle className="size-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {past.length > 0 ? (
        <>
          <SectionHeader title={`Past (${past.length})`} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {past.map((r) => {
              const d = formatDateShort(r.event.eventDate);
              return (
                <Card key={r.id} className="flex gap-4 p-4 opacity-75">
                  <div
                    className={cn(
                      "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl text-white shadow-sm",
                      r.event.category.accent
                    )}
                  >
                    <span className="text-xl font-bold leading-none">{d.day}</span>
                    <span className="text-[10px] uppercase opacity-90">{d.month}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-900">{r.event.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(r.event.eventDate)}
                    </p>
                    <Badge
                      variant={attended(r) ? "success" : "secondary"}
                      className="mt-2 text-[10px]"
                    >
                      {attended(r) ? "Attended ✓" : "Not checked in"}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}