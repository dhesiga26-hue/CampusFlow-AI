"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Category } from "@/types";
import { useAuth } from "@/components/auth-context";
import { getStore } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EventForm, type EventFormHandle } from "@/components/event/event-form";
import CopilotPanel from "@/components/event/copilot-panel";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { push } = useToast();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const formRef = React.useRef<EventFormHandle>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await getStore().getCategories();
        if (!cancelled) setCategories(cats);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageLoader label="Preparing the editor…" />;

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <Link
        href="/organizer/events"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-violet-600"
      >
        <ArrowLeft className="size-4" />
        Back to My Events
      </Link>

      <PageHeader
        title="Create an Event"
        subtitle="Your event will be reviewed by an admin before going live."
      />

      <CopilotPanel
        categories={categories}
        onApply={(v) => {
          formRef.current?.setValues(v);
          document
            .getElementById("event-create-form")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <Card className="mt-6" id="event-create-form">
        <CardContent className="p-6">
          <EventForm
            ref={formRef}
            categories={categories}
            submitLabel="Submit Event for Review"
            submitting={submitting}
            onSubmit={async (values) => {
              if (!user) return;
              setSubmitting(true);
              try {
                await getStore().createEvent(user.id, { ...values, aiGenerated: true });
                push("Event submitted for review!", "success");
                router.replace("/organizer/events");
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