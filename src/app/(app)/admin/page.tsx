"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import type { EventListItem, Profile } from "@/types";
import type { Stats } from "@/lib/db/interface";
import { useAuth } from "@/components/auth-context";
import { getStore } from "@/lib/db";
import { PageHeader, SectionHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/event/badges";
import { RoleBadge } from "@/components/event/badges";
import { formatDateShort } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { push } = useToast();

  const [stats, setStats] = React.useState<Stats | null>(null);
  const [pending, setPending] = React.useState<EventListItem[]>([]);
  const [recentUsers, setRecentUsers] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [acting, setActing] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, u] = await Promise.all([
        getStore().getStats(),
        getStore().getEvents({ status: "pending" }),
        getStore().listUsers(),
      ]);
      setStats(s);
      setPending(p);
      setRecentUsers(u.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const approve = async (id: string) => {
    setActing(id);
    try {
      await getStore().setEventStatus(id, "approved");
      push("Event approved and published.", "success");
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Action failed.", "error");
    } finally {
      setActing(null);
    }
  };

  const reject = async (id: string) => {
    setActing(id);
    try {
      await getStore().setEventStatus(id, "rejected");
      push("Event rejected.", "info");
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Action failed.", "error");
    } finally {
      setActing(null);
    }
  };

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
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const firstName = user?.fullName.split(" ")[0] ?? "admin";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`Platform overview, ${firstName}`}
        subtitle="Monitor campus events, approvals and users."
        actions={
          <Link href="/admin/events">
            <Button variant="outline" size="sm">
              <ShieldCheck className="size-4" /> Moderation Hub
            </Button>
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={stats?.totalStudents ?? 0} icon={Users} accent="violet" />
        <StatCard label="Events" value={stats?.totalEvents ?? 0} icon={Calendar} accent="sky" />
        <StatCard label="Registrations" value={stats?.totalRegistrations ?? 0} icon={Ticket} accent="emerald" />
        <StatCard
          label="Pending Approvals"
          value={stats?.pendingEvents ?? 0}
          icon={Clock}
          accent="amber"
          hint={stats && stats.pendingEvents > 0 ? `${stats.pendingEvents} awaiting` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionHeader
            title="Needs Review"
            action={
              <Link href="/admin/events" className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                All events ↗
              </Link>
            }
          />
          {pending.length === 0 ? (
            <Card className="flex items-center gap-3 p-5">
              <CheckCircle2 className="size-6 text-emerald-500" />
              <p className="text-sm text-muted-foreground">
                All caught up! No events waiting for review.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pending.map((e) => (
                <Card key={e.id} className="card-hover p-4 hover:bg-white">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/admin/events`} className="font-semibold text-slate-900 hover:text-violet-700">
                        {e.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {e.organizer?.fullName ?? "Unknown organizer"} · {formatDateShort(e.eventDate).month} {formatDateShort(e.eventDate).day}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <StatusBadge status={e.status} />
                        <Badge variant="secondary" className="text-[10px]">
                          {e.registrationsCount} registered
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={acting === e.id}
                        onClick={() => approve(e.id)}
                      >
                        Approve
                      </Button>
                      <Button variant="outline" size="sm" disabled={acting === e.id} onClick={() => reject(e.id)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8">
            <SectionHeader title="Attendance Today" action={undefined} />
            <Card className="p-5">
              {stats?.totalAttendance === 0 ? (
                <p className="text-sm text-muted-foreground">No check-ins recorded yet today.</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-slate-900">{stats?.totalAttendance ?? 0}</span> total
                  check-ins across all events this week.
                </p>
              )}
            </Card>
          </div>
        </section>

        <section className="lg:col-span-2">
          <SectionHeader
            title="Top Categories"
            action={
              <Badge variant="secondary" className="text-[10px]">Events</Badge>
            }
          />
          {!stats || stats.categories.length === 0 ? (
            <EmptyState icon={Calendar} title="No data yet" />
          ) : (
            <div className="space-y-3">
              {stats.categories.slice(0, 6).map((c: { name: string; events: number; registrations: number }) => {
                const max = Math.max(1, ...stats.categories.map((x: { name: string; events: number; registrations: number }) => x.events));
                return (
                  <div key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{c.name}</span>
                      <span className="text-muted-foreground">
                        {c.events} event{c.events === 1 ? "" : "s"} · {c.registrations} regs
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                        style={{ width: `${Math.max(8, (c.events / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8">
            <SectionHeader
              title="Recent Users"
              action={
                <Link href="/admin/users" className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                  View all ↗
                </Link>
              }
            />
            <div className="space-y-2">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5">
                  <Avatar name={u.fullName} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{u.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}