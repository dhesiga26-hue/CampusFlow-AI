"use client";

import * as React from "react";
import type { EventListItem, Recommendation, RecommendationResponse } from "@/types";
import { getStore } from "@/lib/db";

interface UseRecommendationsResult {
  recommendations: (Recommendation & { event?: EventListItem })[];
  source: "gemini" | "fallback";
  loading: boolean;
  error: string | null;
}

export function useRecommendations(
  events: EventListItem[],
  interests: string[],
  limit = 4
): UseRecommendationsResult {
  const [result, setResult] = React.useState<UseRecommendationsResult>({
    recommendations: [],
    source: "fallback",
    loading: true,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;

    const apply = (recs: (Recommendation & { event?: EventListItem })[], source: "gemini" | "fallback") => {
      if (cancelled) return;
      setResult({
        recommendations: recs.slice(0, limit),
        source,
        loading: false,
        error: null,
      });
    };

    const timer = window.setTimeout(() => {
      const upcoming = events.filter(
        (e) => e.status === "approved" && new Date(e.eventDate).getTime() >= Date.now()
      );

      if (interests.length === 0 || upcoming.length === 0) {
        setResult({ recommendations: [], source: "fallback", loading: false, error: null });
        return;
      }

      (async () => {
      // instant fallback ranking
      const local = await getStore().rankEvents(upcoming, interests);
      if (cancelled) return;
      apply(
        local.map((r) => ({ ...r, event: upcoming.find((e) => e.id === r.eventId) })),
        "fallback"
      );

      // upgrade with Gemini when available
      try {
        const minimalEvents = upcoming.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          categoryId: e.categoryId,
          eventDate: e.eventDate,
          skillLevel: e.skillLevel,
          status: e.status,
          capacity: e.capacity,
          category: e.category,
          createdAt: e.createdAt,
        }));
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interests, events: minimalEvents }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as RecommendationResponse;
        if (cancelled) return;
        if (data.source === "gemini" && data.recommendations.length > 0) {
          apply(
            data.recommendations.map((r) => ({
              ...r,
              event: events.find((e) => e.id === r.eventId),
            })),
            "gemini"
          );
        }
      } catch {
        // keep fallback
      }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [events, interests, limit]);

  return result;
}