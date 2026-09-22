"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Gauge,
  Info,
  TrendingUp,
} from "lucide-react";
import type { Conflict, DemandPrediction, EventListItem, HealthScoreResult } from "@/types";
import { getStore } from "@/lib/db";
import { computeHealthScore, predictDemand } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function EventInsights({ event }: { event: EventListItem }) {
  const [health, setHealth] = React.useState<HealthScoreResult | null>(null);
  const [demand, setDemand] = React.useState<DemandPrediction | null>(null);
  const [conflicts, setConflicts] = React.useState<Conflict[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [att, fb, conflictsList] = await Promise.all([
          getStore().getAttendance(event.id),
          getStore().getFeedback(event.id),
          getStore().detectConflicts(event),
        ]);
        if (cancelled) return;
        setHealth(
          computeHealthScore({
            event: { capacity: event.capacity, eventDate: event.eventDate },
            registrations: event.registrationsCount,
            attendance: att.length,
            feedback: fb,
            conflicts: conflictsList,
            expectedAttendance: event.registrationsCount * 0.75,
          })
        );
        setDemand(
          predictDemand({
            event: { capacity: event.capacity, eventDate: event.eventDate, createdAt: event.createdAt, category: event.category, status: event.status },
            registrations: event.registrationsCount,
            historicalAttendanceRate: 0.68,
            categoryPopularity: 0.5,
          })
        );
        setConflicts(conflictsList);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event]);

  if (loading) {
    return (
      <CardSkeleton />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Gauge className="size-4 text-violet-500" /> Event Health
            </span>
            <Badge
              variant={health?.status === "healthy" ? "success" : health?.status === "attention" ? "warning" : "destructive"}
            >
              {health?.status === "healthy" ? "Healthy" : health?.status === "attention" ? "Needs Attention" : "Critical"}
            </Badge>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div
              className="relative flex size-20 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${scoreColor(health?.score ?? 0)}, #ede9fe ${100 - (health?.score ?? 0)}%)`,
              }}
            >
              <div className="flex size-[68%] flex-col items-center justify-center rounded-full bg-white">
                <span className="text-xl font-bold text-slate-900">{health?.score ?? "—"}</span>
                <span className="text-[9px] uppercase text-slate-400">/ 100</span>
              </div>
            </div>
            <div className="min-w-0 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> {health?.strengths[0] ?? "No strengths recorded"}</p>
              <p className="flex items-center gap-1.5"><AlertTriangle className="size-3.5 text-amber-500" /> {health?.concerns[0] ?? "No concerns"}</p>
            </div>
          </div>
          {health && health.recommendations.length > 0 && (
            <div className="mt-4 rounded-xl bg-violet-50/70 p-3 text-xs text-violet-800">
              <span className="font-semibold">Recommendation: </span>
              {health.recommendations[0]}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <TrendingUp className="size-4 text-sky-500" /> Demand Prediction
            </span>
            <Badge variant={demand?.demand === "high" ? "success" : demand?.demand === "medium" ? "warning" : "secondary"}>
              {demand?.demand ? demand.demand[0].toUpperCase() + demand.demand.slice(1) + " demand" : "—"}
            </Badge>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Expected attendance</span>
              <span className="font-semibold text-slate-900">
                {demand?.expectedAttendance ?? "—"} / {demand?.capacity ?? event.capacity}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Expected utilization</span>
                <span className="font-semibold text-slate-700">{demand?.expectedUtilization ?? "—"}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all")}
                  style={{ width: `${Math.min(100, demand?.expectedUtilization ?? 0)}%` }}
                />
              </div>
            </div>
            {demand?.explanation && (
              <p className="pt-1 text-xs leading-relaxed text-muted-foreground">{demand.explanation}</p>
            )}
          </div>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
              <AlertTriangle className="size-4 text-amber-600" /> Schedule Conflicts ({conflicts.length})
            </span>
            <Badge variant="warning">
              {conflicts.filter((c) => c.severity === "high").length} high
            </Badge>
          </div>
          <ul className="mt-3 space-y-2.5">
            {conflicts.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-start gap-2.5 rounded-xl bg-white/70 p-3 text-xs">
                <span
                  className={cn(
                    "mt-0.5 size-2 shrink-0 rounded-full",
                    c.severity === "high" ? "bg-rose-500" : c.severity === "medium" ? "bg-amber-500" : "bg-sky-400"
                  )}
                />
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{c.reason}</p>
                  <p className="mt-0.5 text-slate-500">{c.suggestedResolution}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="group rounded-2xl border border-slate-200 bg-white">
        <summary className="cursor-pointer list-none px-5 py-3.5 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <Info className="size-4 text-slate-400" />
            How is this computed?
            <ArrowUpRight className="size-3.5 transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="border-t border-slate-100 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
          <p>Health = fill rate (30) + attendance (30) + feedback rating (20) + engagement (10) − conflict penalties (≤10).</p>
          <p className="mt-1.5">Demand = registration velocity × projected attendance × historical show-up rate per category.</p>
          <p className="mt-1.5">Conflicts are detected against every other active event sharing venue, audience or time.</p>
        </div>
      </details>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#f43f5e";
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
      ))}
    </div>
  );
}