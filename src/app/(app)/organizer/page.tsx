"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Plus,
  QrCode,
  Ticket,
  Users,
} from "lucide-react";
import type { EventListItem } from "@/types";
import { useAuth } from "@/components/auth-context";
import { getStore } from "@/lib/db";
import { PageHeader, SectionHeader } from "@/components/dashboard/page-header";
import { EventCard } from "@/components/event/event-card";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { isPast, timeUntil } from "@/lib/utils";

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = React.useState<EventListItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await getStore().getEvents({ mine: true, organizerId: user.id });
        if (!cancelled) setEvents(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="mb-8 h-4 w-96 max-w-full" />
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const firstName = user?.fullName.split(" ")[0] ?? "there";
  const totalRegistrations = events.reduce((sum, e) => sum + e.registrationsCount, 0);
  const totalAttendance = events.reduce((sum, e) => sum + e.attendeeCount, 0);
  const upcoming = events.filter((e) => !isPast(e.eventDate));
  const today = new Date().toDateString();
  const todayAttendance = events
    .filter((e) => new Date(e.eventDate).toDateString() === today)
    .reduce((sum, e) => sum + e.attendeeCount, 0);
  const pendingCount = events.filter((e) => e.status === "pending").length;
  const recent = events
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`Welcome back, ${firstName}!`}
        subtitle="Manage your events, check-in students and track attendance."
        actions={
          <Link href="/organizer/events/new">
            <Button variant="gradient" size="sm">
              <Plus className="size-4" />
              Create Event
            </Button>
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Events" value={events.length} icon={Calendar} accent="violet" />
        <StatCard label="Total Registrations" value={totalRegistrations} icon={Ticket} accent="sky" />
        <StatCard label="Total Attendance" value={totalAttendance} icon={CheckCircle2} accent="emerald" />
        <StatCard label="Pending Review" value={pendingCount} icon={Clock} accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionHeader
            title="Upcoming Events"
            action={
              <Link href="/organizer/events" className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                Manage all ↗
              </Link>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="No upcoming events"
              description="Create your first event to start collecting registrations."
              action={{ label: "Create Event", href: "/organizer/events/new" }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {upcoming.slice(0, 4).map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  href={`/organizer/events/${e.id}`}
                  compact
                />
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-2">
          <SectionHeader
            title="Recent Activity"
            action={
              <Badge variant="secondary" className="text-[10px]">Last updated</Badge>
            }
          />
          {recent.length === 0 ? (
            <EmptyState icon={QrCode} title="No activity yet" />
          ) : (
            <div className="space-y-3">
              {recent.map((e) => (
                <Link key={e.id} href={`/organizer/events/${e.id}`} className="block">
                  <Card className="card-hover flex items-center gap-3 p-3 hover:bg-white">
                    <Avatar name={e.title} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{e.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.registrationsCount} registered ·{" "}
                        {e.status === "approved"
                          ? isPast(e.eventDate)
                            ? "Ended"
                            : `Starts in ${timeUntil(e.eventDate)}`
                          : e.status}
                      </p>
                    </div>
                    <Badge variant={e.status === "approved" ? "success" : "warning"} className="text-[10px]">
                      {e.status}
                    </Badge>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6">
            <SectionHeader title="Quick Actions" />
            <div className="grid grid-cols-1 gap-3">
              <Link href="/organizer/scan">
                <Card className="card-hover flex items-center gap-3 p-4 hover:bg-white">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <QrCode className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Scan QR Passes</p>
                    <p className="text-xs text-muted-foreground">Check in students at the event entrance</p>
                  </div>
                </Card>
              </Link>
              <Link href="/organizer/events/new">
                <Card className="card-hover flex items-center gap-3 p-4 hover:bg-white">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Plus className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Create a New Event</p>
                    <p className="text-xs text-muted-foreground">Reach students and collect registrations</p>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-violet-900">
              <Users className="size-4" />
              {totalAttendance} students checked in
            </p>
            <p className="text-xs text-violet-700">
              Today: {todayAttendance} · Lifetime attendance rate{" "}
              {totalRegistrations > 0
                ? `${Math.round((totalAttendance / totalRegistrations) * 100)}%`
                : "—"}
            </p>
          </div>
          <Link href="/organizer/scan">
            <Button variant="secondary" size="sm">
              <QrCode className="size-4" /> Open Scanner
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}