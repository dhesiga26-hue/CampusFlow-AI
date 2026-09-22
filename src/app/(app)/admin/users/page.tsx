"use client";

import * as React from "react";
import { Search, UserRound, Users } from "lucide-react";
import type { Profile, Role } from "@/types";
import { getStore } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleBadge } from "@/components/event/badges";
import { formatDateShort, cn } from "@/lib/utils";

type RoleFilter = Role | "all";

export default function AdminUsersPage() {
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<RoleFilter>("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const users = await getStore().listUsers();
        users.sort((a, b) => a.fullName.localeCompare(b.fullName));
        if (!cancelled) setProfiles(users);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q);
    return matchesSearch && (filter === "all" || p.role === filter);
  });

  const counts: Record<RoleFilter, number> = {
    all: profiles.length,
    student: profiles.filter((p) => p.role === "student").length,
    organizer: profiles.filter((p) => p.role === "organizer").length,
    admin: profiles.filter((p) => p.role === "admin").length,
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Users" subtitle="Everyone on CampusFlow AI." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "student", "organizer", "admin"] as RoleFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600"
              )}
            >
              {f} <span className="ml-1 opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search or filter." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className="card-hover flex items-center gap-3 p-4 hover:bg-white">
              <Avatar name={p.fullName} className="size-11" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{p.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                  Joined {formatDateShort(p.createdAt).month} {formatDateShort(p.createdAt).day}
                </p>
              </div>
              <RoleBadge role={p.role} />
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-muted-foreground">
        <UserRound className="size-4 text-violet-500" />
        {profiles.length} total accounts · {counts.student} students · {counts.organizer} organizers ·{" "}
        {counts.admin} admins
      </div>
    </div>
  );
}