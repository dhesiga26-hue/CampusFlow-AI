"use client";

import * as React from "react";
import {
  BrainCircuit,
  CheckCircle2,
  MessageCircle,
  Send,
  Star,
  ThumbsUp,
} from "lucide-react";
import type { AIFeedbackAnalysis, EventListItem, FeedbackWithStudent, Profile } from "@/types";
import { getStore } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn, formatDateShort } from "@/lib/utils";

const RATING_LABELS = ["", "Poor", "Fair", "Average", "Good", "Excellent"];

export function FeedbackSubmit({
  event,
  user,
}: {
  event: EventListItem;
  user: Profile;
}) {
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const { push } = useToast();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const done = await getStore().hasFeedback(event.id, user.id);
        if (!cancelled) setSubmitted(done);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event.id, user.id]);

  const submit = async () => {
    if (rating === 0) {
      push("Pick a rating first.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await getStore().submitFeedback({
        eventId: event.id,
        studentId: user.id,
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
      push("Thanks! Your feedback helps improve future events.", "success");
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not submit feedback.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <MessageCircle className="size-4 text-violet-500" />
        Share your feedback
      </div>

      {submitted ? (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4.5" />
          Thanks for your feedback — it&apos;s been recorded for the organizers.
        </div>
      ) : (
        <>
          <div className="mt-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "size-6",
                      (hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-slate-300"
                    )}
                  />
                </button>
              ))}
              {rating > 0 ? (
                <span className="ml-2 text-sm font-medium text-amber-600">
                  {RATING_LABELS[rating]}
                </span>
              ) : null}
            </div>
          </div>
          <Textarea
            className="mt-3 min-h-24"
            placeholder="What did you like? What could be improved? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button
            variant="gradient"
            size="sm"
            className="mt-3"
            onClick={submit}
            loading={submitting}
          >
            <Send className="size-3.5" />
            Submit Feedback
          </Button>
        </>
      )}
    </Card>
  );
}

export function FeedbackReview({ event }: { event: EventListItem }) {
  const [items, setItems] = React.useState<FeedbackWithStudent[]>([]);
  const [analysis, setAnalysis] = React.useState<AIFeedbackAnalysis | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [analyzing, setAnalyzing] = React.useState(false);
  const { push } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const fb = await getStore().getFeedback(event.id);
      setItems(fb);
      const avg = fb.length ? fb.reduce((s, f) => s + f.rating, 0) / fb.length : 0;
      setAnalysis({
        eventId: event.id,
        averageRating: Math.round(avg * 10) / 10,
        count: fb.length,
        sentiment: "neutral",
        summary: "",
        positivePoints: [],
        issues: [],
        themes: [],
        recommendations: [],
        source: "fallback",
      });
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  React.useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const runAnalysis = async () => {
    if (items.length === 0) {
      push("No feedback to analyze yet.", "error");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed.");
      setAnalysis(data.analysis);
      await getStore().saveInsight(event.id, {
        eventHealthScore: undefined,
        expectedAttendance: undefined,
        sentimentSummary: data.analysis.summary,
        positivePoints: data.analysis.positivePoints,
        issues: data.analysis.issues,
        recommendations: data.analysis.recommendations,
      });
    } catch (err) {
      push(err instanceof Error ? err.message : "AI analysis unavailable.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="h-32 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />;
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BrainCircuit className="size-4 text-violet-500" />
            AI Feedback Intelligence
            {analysis?.source === "gemini" && (
              <Badge variant="secondary" className="gap-1">
                <ThumbsUp className="size-3" /> Gemini
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={runAnalysis} loading={analyzing}>
            <BrainCircuit className="size-3.5" />
            {analysis?.summary ? "Re-analyze" : "Analyze Feedback"} ({items.length})
          </Button>
        </div>

        {analysis?.summary ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Overall sentiment</p>
                <p
                  className={cn(
                    "mt-1 text-lg font-bold",
                    analysis.sentiment === "positive"
                      ? "text-emerald-600"
                      : analysis.sentiment === "neutral"
                        ? "text-amber-600"
                        : "text-rose-600"
                  )}
                >
                  {String(analysis.sentiment).toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Average rating</p>
                <p className="mt-1 flex items-center gap-1 text-lg font-bold text-slate-900">
                  {analysis.averageRating}
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-normal text-slate-400">/ 5 · {analysis.count} responses</span>
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Summary</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{analysis.summary}</p>
            </div>
            {analysis.positivePoints.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-600">Highlights</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {analysis.positivePoints.slice(0, 4).map((p) => (
                    <li key={p} className="flex gap-1.5">
                      <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-500" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.issues.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-rose-600">Issues raised</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {analysis.issues.slice(0, 4).map((p) => (
                    <li key={p} className="flex gap-1.5">
                      <span className="mt-1 size-1 shrink-0 rounded-full bg-rose-400" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.recommendations.length > 0 && (
              <div className="sm:col-span-2 rounded-xl bg-violet-50/70 p-3 text-xs leading-relaxed text-violet-800">
                <span className="font-semibold">Recommended actions: </span>
                {analysis.recommendations.slice(0, 3).join(" ")}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            {items.length === 0
              ? "No feedback yet. Share the event link with attendees to collect responses."
              : "Run the analysis to turn these responses into actionable insights."}
          </p>
        )}
      </Card>

      {items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Student</span>
            <span>Rating</span>
            <span>Date</span>
          </div>
          {items.map((f) => (
            <div
              key={f.id}
              className="grid grid-cols-1 gap-2 border-b border-slate-100 px-5 py-3.5 last:border-0 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
            >
              <div className="flex items-center gap-3">
                <Avatar name={f.student.fullName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{f.student.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{f.comment || "No comment."}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn("size-3.5", n <= f.rating ? "fill-amber-400 text-amber-400" : "text-slate-200")}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDateShort(f.createdAt).month} {formatDateShort(f.createdAt).day}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}