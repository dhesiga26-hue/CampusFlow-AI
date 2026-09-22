"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  HeartPulse,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminAnalytics } from "@/types";
import { getStore } from "@/lib/db";
import { PageHeader, SectionHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#14b8a6"];

export default function AdminStatsPage() {
  const [data, setData] = React.useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const a = await getStore().getAdminAnalytics();
        if (!cancelled) setData(a);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const trendData = React.useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { month: string; count: number; registrations: number }>();
    for (const m of data.eventsByMonth) map.set(m.month, { month: m.month, count: m.count, registrations: 0 });
    for (const m of data.registrationsByMonth) {
      const existing = map.get(m.month);
      if (existing) existing.registrations = m.count;
      else map.set(m.month, { month: m.month, count: 0, registrations: m.count });
    }
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  if (loading || !data) {
    return (
      <div>
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="mb-8 h-4 w-96 max-w-full" />
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const { totals, topEvents, needingAttention, conflicts } = data;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Platform-wide event performance, attendance and AI-derived health."
        actions={
          <Link href="/admin/events">
            <Button variant="outline" size="sm">
              <BarChart3 className="size-4" /> Moderation Hub
            </Button>
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Registered Students" value={totals.totalStudents} icon={Users} accent="violet" />
        <StatCard label="Total Events" value={totals.totalEvents} icon={Calendar} accent="sky" />
        <StatCard label="Registrations" value={totals.totalRegistrations} icon={Ticket} accent="emerald" />
        <StatCard label="Attendance Rate" value={`${(totals.avgAttendanceRate * 100).toFixed(0)}%`} icon={Activity} accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionHeader title="Events & Registrations Trend" action={undefined} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="ev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="count" name="Events" stroke="#7c3aed" strokeWidth={2} fill="url(#ev)" />
                <Area type="monotone" dataKey="registrations" name="Registrations" stroke="#0ea5e9" strokeWidth={2} fill="url(#rg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Events by Category" action={undefined} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.eventsByCategory}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {data.eventsByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
            {data.eventsByCategory.map((c, i) => (
              <span key={c.name} className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="size-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {c.name}
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Attendance Trend" action={undefined} />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.attendanceByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Check-ins"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50/70 px-4 py-2.5 text-xs">
            <span className="font-medium text-emerald-800">Average attendance rate</span>
            <span className="font-bold text-emerald-700">{(totals.avgAttendanceRate * 100).toFixed(1)}%</span>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Events by Department" action={undefined} />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.eventsByDepartment} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="count" name="Events" radius={[0, 6, 6, 0]} barSize={14} fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Top Events" action={<Badge variant="secondary" className="text-[10px]">By registrations</Badge>} />
          <div className="space-y-3">
            {topEvents.slice(0, 6).map((e, i) => (
              <Link key={e.id} href={`/admin/events`} className="block">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:border-violet-200 hover:bg-violet-50/40">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.registrations} registered · {e.attendance} attended
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">★ {e.rating || "—"}</p>
                    <HealthPill score={e.healthScore} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionHeader
            title="Needs Attention"
            action={<Badge variant="warning" className="gap-1 text-[10px]"><AlertTriangle className="size-3" /> {needingAttention.length}</Badge>}
          />
          {needingAttention.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-4 text-sm text-emerald-800">
              <HeartPulse className="size-5" />
              All events are performing well. No action required.
            </div>
          ) : (
            <div className="space-y-2.5">
              {needingAttention.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{e.title}</p>
                    <p className="text-xs text-amber-800">{e.reason}</p>
                  </div>
                  <HealthPill score={e.healthScore} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 lg:col-span-3">
          <SectionHeader
            title="Active Conflicts"
            action={<Badge variant={conflicts.length ? "warning" : "secondary"} className="text-[10px]">{conflicts.length} detected</Badge>}
          />
          {conflicts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scheduling conflicts across the platform.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {conflicts.slice(0, 9).map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        c.severity === "high" ? "bg-rose-500" : c.severity === "medium" ? "bg-amber-500" : "bg-sky-400"
                      )}
                    />
                    <Badge variant="secondary" className="text-[10px] normal-case">
                      {c.severity}
                    </Badge>
                    <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-400">Conflict</span>
                  </div>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-slate-700">{c.reason}</p>
                  <p className="mt-1 text-xs text-slate-500">{c.suggestedResolution}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function HealthPill({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-50 text-emerald-700" : score >= 60 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", color)}>
      <TrendingUp className="size-3" /> {score}
    </span>
  );
}