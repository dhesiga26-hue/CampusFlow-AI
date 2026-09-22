"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  QrCode,
  Sparkles,
  Ticket,
  TrendingUp,
  Wand2,
} from "lucide-react";
import type { EventListItem, RegistrationWithEvent } from "@/types";
import { useAuth } from "@/components/auth-context";
import { getStore } from "@/lib/db";
import { PageHeader, SectionHeader } from "@/components/dashboard/page-header";
import { EventCard } from "@/components/event/event-card";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useRecommendations } from "@/hooks/use-recommendations";
import { formatDateShort, cn } from "@/lib/utils";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = React.useState<EventListItem[]>([]);
  const [mine, setMine] = React.useState<RegistrationWithEvent[]>([]);
  const [attendance, setAttendance] = React.useState<{ eventId: string; markedAt: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [now] = React.useState(() => Date.now());

  const recs = useRecommendations(upcoming, user?.interests ?? [], 3);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [events, myRegs, myAttendance] = await Promise.all([
          getStore().getEvents({ upcoming: true }),
          getStore().getMyRegistrations(user.id),
          getStore().getMyAttendance(user.id),
        ]);
        if (cancelled) return;
        setUpcoming(events.filter((e) => e.status === "approved"));
        setMine(myRegs);
        setAttendance(myAttendance);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const firstName = user?.fullName.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const activeRegs = mine.filter((m) => new Date(m.event.eventDate).getTime() >= now);
  const upcomingRegs = activeRegs.slice(0, 3);
  const attendedCount = attendance.length;
  const attendanceRate = activeRegs.length + attendedCount === 0
    ? "—"
    : `${Math.round((attendedCount / (attendedCount + activeRegs.length)) * 100)}%`;

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="mb-8 h-4 w-96 max-w-full" />
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`${greeting}, ${firstName}!`}
        subtitle="Here's what's happening across campus today."
        actions={
          <div className="flex gap-2">
            <Link href="/student/events">
              <Button variant="outline" size="sm">
                <Calendar className="size-4" />
                Browse Events
              </Button>
            </Link>
            <Link href="/student/my-events">
              <Button variant="gradient" size="sm">
                <QrCode className="size-4" />
                My Passes
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Registered" value={mine.length} icon={Ticket} accent="violet" />
        <StatCard label="Attended" value={attendedCount} icon={CheckCircle2} accent="emerald" />
        <StatCard label="Attendance Rate" value={attendanceRate} icon={TrendingUp} accent="sky" />
        <StatCard label="Upcoming Bookings" value={activeRegs.length} icon={CalendarPlus} accent="amber" />
      </div>

      {!user?.interests?.length ? (
        <Card className="mb-8 flex items-start gap-3 border-violet-200 bg-violet-50/60 p-4">
          <Wand2 className="mt-0.5 size-5 shrink-0 text-violet-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-violet-900">
              Unlock AI recommendations for you
            </p>
            <p className="text-sm text-violet-700">
              Select interests to get personalized event suggestions from CampusFlow AI.
            </p>
          </div>
          <Link href="/register">
            <Button variant="secondary" size="sm">Select Interests</Button>
          </Link>
        </Card>
      ) : (
        <section className="mb-10">
          <SectionHeader
            title="AI Recommended For You"
            subtitle={recs.source === "gemini" ? "Powered by Gemini AI" : "Smart match based on your interests"}
            action={
              <Badge variant="default" className="gap-1">
                <Sparkles className="size-3" />
                {recs.source === "gemini" ? "Gemini AI" : "Smart Match"}
              </Badge>
            }
          />
          {recs.loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : recs.recommendations.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No matches yet"
              description="We couldn't find events matching your interests right now. Check back soon."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {recs.recommendations.map((r, i) => (
                <div
                  key={r.eventId}
                  className="card-hover group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all"
                >
                  {r.event ? (
                    <>
                      <div
                        className={cn(
                          "flex h-1.5 w-full bg-gradient-to-r",
                          ["from-violet-500 to-purple-600", "from-sky-500 to-blue-600", "from-emerald-500 to-teal-600"][i % 3]
                        )}
                      />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="default" className="gap-1 text-[10px]">
                            <Sparkles className="size-3" />
                            {Math.round(r.score)}% match
                          </Badge>
                          <span className="text-xs text-muted-foreground">{r.score >= 90 ? "Top pick" : "Great fit"}</span>
                        </div>
                        <h3 className="mt-2 text-sm font-semibold leading-snug text-slate-900">
                          {r.event.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {r.event.category.name} ·{" "}
                          {formatDateShort(r.event.eventDate).month} {formatDateShort(r.event.eventDate).day},{" "}
                          {formatDateShort(r.event.eventDate).time}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-500">{r.reason}</p>
                        <Link
                          href={`/student/events/${r.event.id}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
                        >
                          View event <ChevronRight className="size-3.5" />
                        </Link>
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionHeader
            title="Upcoming Events"
            action={
              <Link href="/student/events" className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                View all ↗
              </Link>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming events"
              description="New events are added all the time. Check back soon!"
              action={{ label: "Browse events", href: "/student/events" }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {upcoming.slice(0, 4).map((e) => (
                <EventCard key={e.id} event={e} href={`/student/events/${e.id}`} compact />
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-2">
          <SectionHeader
            title="My Registrations"
            action={
              <Link href="/student/my-events" className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                Manage ↗
              </Link>
            }
          />
          {upcomingRegs.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Nothing booked yet"
              description="Register for an event and your QR pass will appear here."
              action={{ label: "Discover events", href: "/student/events" }}
            />
          ) : (
            <div className="space-y-3">
              {upcomingRegs.map((r) => (
                <Card key={r.id} className="card-hover flex items-center gap-3 p-3">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-white",
                      r.event.category.accent
                    )}
                  >
                    <span className="text-sm font-bold leading-none">{formatDateShort(r.event.eventDate).day}</span>
                    <span className="text-[9px] uppercase opacity-90">{formatDateShort(r.event.eventDate).month}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{r.event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(r.event.eventDate).time} · {r.event.location}
                    </p>
                  </div>
                  <Link href={`/student/my-events/${r.event.id}/pass`}>
                    <Button variant="secondary" size="sm">
                      <QrCode className="size-4" />
                      Pass
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}