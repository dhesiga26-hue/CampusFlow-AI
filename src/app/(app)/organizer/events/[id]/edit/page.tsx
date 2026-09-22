"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Category, EventListItem } from "@/types";
import { useAuth } from "@/components/auth-context";
import { getStore } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EventForm } from "@/components/event/event-form";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const { user } = useAuth();
  const router = useRouter();
  const { push } = useToast();

  const [event, setEvent] = React.useState<EventListItem | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [evt, cats] = await Promise.all([
          getStore().getEvent(eventId),
          getStore().getCategories(),
        ]);
        if (cancelled) return;
        setEvent(evt);
        setCategories(cats);
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
        <Link href="/organizer/events" className="mt-2 inline-block text-sm text-violet-600">
          Back to My Events
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <Link
        href={`/organizer/events/${event.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-violet-600"
      >
        <ArrowLeft className="size-4" />
        Back to Event
      </Link>

      <PageHeader title="Edit Event" subtitle="Update the details below." />

      <Card>
        <CardContent className="p-6">
          <EventForm
            categories={categories}
            initialValues={event}
            submitLabel="Save Changes"
            submitting={submitting}
            onSubmit={async (values) => {
              if (!user) return;
              setSubmitting(true);
              try {
                await getStore().updateEvent(event.id, user.id, values);
                push("Event updated!", "success");
                router.replace(`/organizer/events/${event.id}`);
              } finally {
                setSubmitting(false);
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}