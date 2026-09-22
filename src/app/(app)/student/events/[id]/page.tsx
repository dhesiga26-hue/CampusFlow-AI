"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  Ticket,
  User,
  Users,
} from "lucide-react";
import type { EventListItem } from "@/types";
import { useAuth } from "@/components/auth-context";
import { getStore } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { CategoryBadge, SkillBadge, StatusBadge } from "@/components/event/badges";
import { useToast } from "@/components/ui/toast";
import { FeedbackSubmit } from "@/components/event/feedback-panel";
import { formatDate, formatDateShort, isPast, timeUntil, pluralize, cn } from "@/lib/utils";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const { user } = useAuth();
  const router = useRouter();
  const { push } = useToast();

  const [event, setEvent] = React.useState<EventListItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [registering, setRegistering] = React.useState(false);
  const [justRegistered, setJustRegistered] = React.useState(false);
  const [attended, setAttended] = React.useState(false);
  const [now] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [e, att] = await Promise.all([
          getStore().getEvent(eventId, user?.id),
          user ? getStore().getMyAttendance(user.id) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setEvent(e);
        setAttended(att.some((a) => a.eventId === eventId));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, user?.id, user]);

  const handleRegister = async () => {
    if (!user || !event) return;
    setRegistering(true);
    try {
      await getStore().register(event.id, user.id);
      setJustRegistered(true);
      push("You're registered! Your QR pass is ready.", "success");
      router.refresh();
    } catch (err) {
      push(err instanceof Error ? err.message : "Registration failed.", "error");
      const fresh = await getStore().getEvent(event.id, user.id);
      setEvent(fresh);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <PageLoader label="Loading event…" />;
  if (!event) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">Event not found</p>
        <p className="mt-1 text-sm text-muted-foreground">It may have been removed.</p>
        <Link href="/student/events">
          <Button variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="size-4" /> Back to events
          </Button>
        </Link>
      </div>
    );
  }

  const past = isPast(event.eventDate);
  const deadlinePassed = new Date(event.registrationDeadline).getTime() < now;
  const full = event.registrationsCount >= event.capacity;

  const d = formatDateShort(event.eventDate);
  const spotsLeft = Math.max(0, event.capacity - event.registrationsCount);

  return (
    <div className="animate-fade-up">
      <Link
        href="/student/events"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-violet-600"
      >
        <ArrowLeft className="size-4" />
        Back to All Events
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className={cn("flex h-2 w-full bg-gradient-to-r", event.category.accent)} />
            <div className="p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={event.category} />
                <SkillBadge level={event.skillLevel} />
                {event.status !== "approved" ? <StatusBadge status={event.status} /> : null}
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {event.title}
              </h1>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                {event.description}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <InfoTile
                  icon={Calendar}
                  label="Date"
                  value={`${d.month} ${d.day}`}
                  sub={d.time}
                />
                <InfoTile icon={MapPin} label="Location" value={event.location} />
                <InfoTile
                  icon={Users}
                  label="Capacity"
                  value={`${event.registrationsCount} / ${event.capacity}`}
                  sub={`${spotsLeft} ${pluralize(spotsLeft, "spot")} left`}
                />
                <InfoTile
                  icon={User}
                  label="Organizer"
                  value={event.organizer.fullName}
                  sub={event.organizer.email}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6 lg:sticky lg:top-20">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-16 w-16 flex-col items-center justify-center rounded-2xl text-white shadow-sm",
                  event.category.accent
                )}
              >
                <span className="text-xl font-bold leading-none">{d.day}</span>
                <span className="text-[10px] uppercase opacity-90">{d.month}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{formatDate(event.eventDate)}</p>
                <p className="text-xs text-muted-foreground">
                  {event.status === "approved" && !past ? `Starts in ${timeUntil(event.eventDate)}` : "Event ended"}
                </p>
              </div>
            </div>

            <div className="my-5 h-px bg-slate-100" />

            {justRegistered || event.isRegistered ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="size-4.5" />
You&apos;re registered!
                </div>
                <p className="mt-1 text-xs text-emerald-700">
                  Show your QR pass at the entrance to check in.
                </p>
                <Link href={`/student/my-events/${event.id}/pass`}>
                  <Button variant="success" className="mt-3 w-full">
                    <QrCode className="size-4" />
                    View My QR Pass
                  </Button>
                </Link>
              </div>
            ) : past ? (
              <div className="text-center text-sm text-muted-foreground">This event has ended.</div>
            ) : deadlinePassed ? (
              <div className="text-center text-sm text-muted-foreground">Registration closed.</div>
            ) : full ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-medium text-amber-800">
                This event is full
              </div>
            ) : event.status !== "approved" ? (
              <div className="text-center text-sm text-muted-foreground">
                This event isn&apos;t open for registration yet.
              </div>
            ) : (
              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                onClick={handleRegister}
                loading={registering}
              >
                <Ticket className="size-4" />
                Register Now
              </Button>
            )}

            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Registration closes {formatDate(event.registrationDeadline)}
              </p>
              <p className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                {event.registrationsCount} registered
                {event.attendeeCount > 0 ? ` · ${event.attendeeCount} attended` : ""}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {past && attended && user ? (
        <div className="mt-6 max-w-2xl">
          <FeedbackSubmit event={event} user={user} />
        </div>
      ) : null}
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <Icon className="mb-1.5 size-4 text-violet-500" />
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900">{value}</div>
      {sub ? <div className="truncate text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}