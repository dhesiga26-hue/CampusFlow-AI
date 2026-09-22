"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Info, QrCode } from "lucide-react";
import type { RegistrationWithEvent } from "@/types";
import { useAuth } from "@/components/auth-context";
import { getStore } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { generateQrDataUrl, displayCode } from "@/lib/qr";
import { formatDate, formatDateShort, cn } from "@/lib/utils";

export default function QrPassPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const { user } = useAuth();

  const [registration, setRegistration] = React.useState<RegistrationWithEvent | null>(null);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);

  React.useEffect(() => {
    if (!user || !eventId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const regs = await getStore().getMyRegistrations(user.id);
        const found = regs.find((r) => r.event.id === eventId) ?? null;
        if (cancelled) return;
        setRegistration(found);
        if (found?.qrPayload) {
          setGenerating(true);
          const url = await generateQrDataUrl(found.qrPayload, 300);
          if (!cancelled) setQrDataUrl(url);
          setGenerating(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, eventId]);

  if (loading) return <PageLoader label="Preparing your pass…" />;

  const event = registration?.event;

  return (
    <div className="animate-fade-up mx-auto max-w-md">
      <Link
        href="/student/my-events"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-violet-600"
      >
        <ArrowLeft className="size-4" />
        Back to My Events
      </Link>

      {!registration || !event ? (
        <EmptyState
          icon={QrCode}
          title="No QR pass found"
          description="You haven't registered for this event."
          action={{ label: "Browse events", href: "/student/events" }}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className={cn("flex h-2 w-full bg-gradient-to-r", event.category.accent)} />
          <div className="p-6">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-violet-600">
                Event QR Pass
              </p>
              <h1 className="mt-1 text-xl font-bold text-slate-900">{event.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(event.eventDate)} · {formatDateShort(event.eventDate).time}
              </p>
            </div>

            <div className="my-5 flex justify-center">
              {generating || !qrDataUrl ? (
                <div className="flex h-[300px] w-[300px] items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50">
                  <QrCode className="size-8 animate-pulse text-violet-400" />
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt={`QR pass for ${event.title}`} className="h-[276px] w-[276px]" />
                </div>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
              <div className="font-mono text-lg font-bold tracking-[0.2em] text-slate-800">
                {displayCode(registration.qrPayload)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Show at the event entrance</div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-3.5 py-2.5 text-xs text-violet-800">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Organizers scan this code to verify your attendance. Do not share your pass with
                others — it&apos;s unique to your registration.
              </span>
            </div>

            {qrDataUrl ? (
              <a href={qrDataUrl} download={`campusconnect-${event.id}.png`} className="mt-4 block">
                <Button variant="outline" className="w-full">
                  <Download className="size-4" />
                  Download Pass
                </Button>
              </a>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}