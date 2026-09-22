"use client";

import * as React from "react";
import { Calendar, Search } from "lucide-react";
import type { Category, EventListItem } from "@/types";
import { getStore } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { EventCard } from "@/components/event/event-card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function BrowseEventsPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [events, setEvents] = React.useState<EventListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string>("all");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [cats, evts] = await Promise.all([
          getStore().getCategories(),
          getStore().getEvents({ upcoming: true }),
        ]);
        if (cancelled) return;
        setCategories(cats);
        setEvents(evts.filter((e) => e.status === "approved"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return events.filter((e) => {
      const byCategory = categoryId === "all" || e.categoryId === categoryId;
      const bySearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.name.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q);
      return byCategory && bySearch;
    });
  }, [events, search, categoryId]);

  const byDate = React.useMemo(
    () =>
      filtered.reduce<Record<string, EventListItem[]>>((acc, e) => {
        const key = new Date(e.eventDate).toDateString();
        (acc[key] ??= []).push(e);
        return acc;
      }, {}),
    [filtered]
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Browse Events"
        subtitle="Find your next workshop, competition or hackathon."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search events, categories, locations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryId("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              categoryId === "all"
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600"
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                categoryId === c.id
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events found"
          description="Try a different search term or category."
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(byDate).map(([day, dayEvents]) => (
            <div key={day}>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                {new Date(day).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dayEvents.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    href={`/student/events/${e.id}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}