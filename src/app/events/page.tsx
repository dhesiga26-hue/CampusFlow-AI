"use client";

import * as React from "react";
import { Calendar, Search } from "lucide-react";
import type { Category, EventListItem } from "@/types";
import { getStore } from "@/lib/db";
import { EventCard } from "@/components/event/event-card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function PublicEventsPage() {
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

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Upcoming Campus Events</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Explore everything happening around campus. Sign in as a student to register and get your
          QR pass.
        </p>
      </div>

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered
            .slice()
            .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
            .map((e) => (
              <EventCard key={e.id} event={e} href={`/events/${e.id}`} />
            ))}
        </div>
      )}
    </div>
  );
}