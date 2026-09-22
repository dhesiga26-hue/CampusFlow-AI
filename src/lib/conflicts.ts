import type { Conflict, EventRecord } from "@/types";

/**
 * Smart conflict detection engine.
 *
 * Detects scheduling problems for a candidate/new event against every other
 * active event on campus. Pure function — works identically for the demo store
 * and the Supabase store (shared via this module).
 */

interface TimeWindow {
  start: number;
  end: number;
  date: number;
}

function windowFor(event: Pick<EventRecord, "eventDate" | "endTime">): TimeWindow | null {
  const start = new Date(event.eventDate).getTime();
  const end = new Date(event.endTime || event.eventDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return {
    start,
    end,
    // Same calendar date (local) is enough for campus scheduling.
    date: new Date(start).toDateString() as unknown as number,
  };
}

export function hasOverlap(a: TimeWindow, b: TimeWindow): boolean {
  return a.start < b.end && b.start < a.end;
}

function sameAudience(a: Pick<EventRecord, "targetAudience" | "department" | "skillLevel">, b: Pick<EventRecord, "targetAudience" | "department" | "skillLevel">): boolean {
  const aT = (a.targetAudience || a.department || "").toLowerCase();
  const bT = (b.targetAudience || b.department || "").toLowerCase();
  if (aT && bT && aT === bT) return true;
  const aD = (a.department || "").toLowerCase();
  const bD = (b.department || "").toLowerCase();
  return Boolean(aD && bD && aD === bD);
}

/**
 * Compute conflicts for `candidate` against `others`.
 * Ignores cancelled/draft events and duplicate ids.
 */
export function detectConflicts(
  candidate: Pick<EventRecord, "id" | "location" | "eventDate" | "endTime" | "targetAudience" | "department" | "skillLevel" | "status">,
  others: Pick<EventRecord, "id" | "title" | "location" | "eventDate" | "endTime" | "targetAudience" | "department" | "skillLevel" | "status">[]
): Conflict[] {
  const cw = windowFor(candidate);
  const conflicts: Conflict[] = [];

  for (const other of others) {
    if (other.id === candidate.id) continue;
    if (other.status === "cancelled" || other.status === "draft") continue;
    if (candidate.status === "cancelled" || candidate.status === "draft") continue;

    const ow = windowFor(other);
    if (!ow || !cw || !hasOverlap(cw, ow)) continue;

    const sameVenue = other.location?.toLowerCase() === candidate.location?.toLowerCase();

    if (sameVenue) {
      conflicts.push({
        id: `c-${candidate.id}-${other.id}`,
        eventId: candidate.id,
        conflictingEventId: other.id,
        reason: `Venue conflict detected. "${other.title}" is booked at ${other.location} during an overlapping time.`,
        severity: "high",
        suggestedResolution: `Move this event to an alternative venue or shift its time outside ${other.title}'s window.`,
        createdAt: new Date().toISOString(),
      });
    } else if (sameAudience(candidate, other)) {
      conflicts.push({
        id: `c-${candidate.id}-${other.id}`,
        eventId: candidate.id,
        conflictingEventId: other.id,
        reason: `Potential audience conflict. "${other.title}" targets the same audience (${other.targetAudience || other.department || "general"}) at the same time.`,
        severity: "medium",
        suggestedResolution: "Schedule the events at different times so students can attend both.",
        createdAt: new Date().toISOString(),
      });
    } else {
      conflicts.push({
        id: `c-${candidate.id}-${other.id}`,
        eventId: candidate.id,
        conflictingEventId: other.id,
        reason: `Event overlaps with "${other.title}" in time (${other.location}). Students must choose between them.`,
        severity: "low",
        suggestedResolution: "Consider moving one of the events to avoid the overlap.",
        createdAt: new Date().toISOString(),
      });
    }
  }

  return conflicts;
}

export function severityLabel(severity: Conflict["severity"]): string {
  return severity === "high" ? "High" : severity === "medium" ? "Medium" : "Low";
}