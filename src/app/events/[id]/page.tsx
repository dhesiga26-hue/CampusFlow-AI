"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, Sparkles, User, Users } from "lucide-react";
import type { EventListItem } from "@/types";
import { getStore } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { CategoryBadge, SkillBadge } from "@/components/event/badges";
import { formatDate, formatDateShort, timeUntil, isPast, pluralize, cn } from "@/lib/utils";

export default function PublicEventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const [event, setEvent] = React.useState<EventListItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const e = await getStore().getEvent(eventId);
        if (!cancelled) setEvent(e && e.status === "approved" ? e : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) return <PageLoader label="Loading event…" />;
  if (!event) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">Event not found</p>
        <p className="mt-1 text-sm text-muted-foreground">It may have been removed or isn&apos;t live yet.</p>
        <Link href="/events">
          <Button variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="size-4" /> Back to events
          </Button>
        </Link>
      </div>
    );
  }

  const past = isPast(event.eventDate);
  const d = formatDateShort(event.eventDate);
  const spotsLeft = Math.max(0, event.capacity - event.registrationsCount);

  return (
    <div className="animate-fade-up">
      <Link
        href="/events"
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
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {event.title}
              </h1>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                {event.description}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <InfoTile icon={Calendar} label="Date" value={`${d.month} ${d.day}`} sub={d.time} />
                <InfoTile icon={MapPin} label="Location" value={event.location} />
                <InfoTile
                  icon={Users}
                  label="Capacity"
                  value={`${event.registrationsCount} / ${event.capacity}`}
                  sub={`${spotsLeft} ${pluralize(spotsLeft, "spot")} left`}
                />
                <InfoTile icon={User} label="Organizer" value={event.organizer.fullName} sub={event.organizer.email} />
              </div>

              {event.agenda ? (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Agenda</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{event.agenda}</p>
                </div>
              ) : null}

              {event.resources ? (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resources / Prerequisites</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{event.resources}</p>
                </div>
              ) : null}
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
                  {!past ? `Starts in ${timeUntil(event.eventDate)}` : "Event ended"}
                </p>
              </div>
            </div>

            <div className="my-5 h-px bg-slate-100" />

            {past ? (
              <div className="text-center text-sm text-muted-foreground">This event has ended.</div>
            ) : (
              <div className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white">
                <p className="text-sm font-semibold">Want to attend?</p>
                <p className="mt-1 text-xs text-violet-100">
                  Sign in as a student to register and get your QR pass.
                </p>
                <Link href="/login" className="mt-3 block">
                  <Button variant="success" size="sm" className="w-full">
                    <Sparkles className="size-4" />
                    Sign In to Register
                  </Button>
                </Link>
              </div>
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