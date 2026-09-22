import type {
  Conflict,
  DemandPrediction,
  EventListItem,
  Feedback,
  HealthScoreResult,
} from "@/types";

/**
 * Pure, transparent scoring functions used by both stores.
 * Every score is computed from real event data — no random values.
 */

const SEVERITY_PENALTY: Record<Conflict["severity"], number> = {
  high: 5,
  medium: 3,
  low: 1,
};

export function computeHealthScore(args: {
  event: Pick<EventListItem, "capacity" | "eventDate">;
  registrations: number;
  attendance: number;
  feedback: Feedback[];
  conflicts: Conflict[];
  expectedAttendance?: number;
}): HealthScoreResult {
  const { event, registrations, attendance, feedback, conflicts } = args;
  const isPast = new Date(event.eventDate).getTime() < Date.now();

  // 1. Registration fill (0–30)
  const regRate = event.capacity > 0 ? Math.min(1, registrations / event.capacity) : 0;
  const regScore = regRate * 30;

  // 2. Attendance (0–30) — use recorded attendance for past events,
  //    expected utilization from demand prediction for upcoming ones.
  let attendanceRate = 0;
  if (registrations > 0 && isPast) {
    attendanceRate = Math.min(1, attendance / registrations);
  } else if (args.expectedAttendance != null && event.capacity > 0) {
    attendanceRate = Math.min(1, args.expectedAttendance / event.capacity);
  }
  const attendanceScore = attendanceRate * 30;

  // 3. Feedback rating (0–20)
  let ratingScore = 12;
  if (feedback.length > 0) {
    const avg =
      feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
    ratingScore = Math.max(0, Math.min(1, avg / 5)) * 20;
  }

  // 4. Engagement (0–10) — proportion of attendees who left feedback.
  let engagementScore = 4;
  if (registrations > 0) {
    const rate = Math.min(1, feedback.length / Math.max(1, attendance || registrations));
    engagementScore = rate * 10;
  }

  // 5. Conflict penalty (0–10 deduction)
  const penalty = Math.min(10, conflicts.reduce((sum, c) => sum + SEVERITY_PENALTY[c.severity], 0));

  const score = Math.max(0, Math.min(100, Math.round(regScore + attendanceScore + ratingScore + engagementScore - penalty)));
  const status = score >= 80 ? "healthy" : score >= 60 ? "attention" : "critical";

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: string[] = [];

  if (regRate >= 0.7) strengths.push("High registration fill");
  else if (regRate > 0.3) concerns.push("Registration is slower than capacity allows");
  else concerns.push("Very few registrations relative to capacity");

  if (attendanceRate >= 0.7) strengths.push("Good attendance rate");
  else if (isPast) concerns.push("Attendance rate was lower than expected");

  if (feedback.length > 0) {
    const avg = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
    if (avg >= 4) strengths.push("Positive participant feedback");
    else if (avg >= 3) concerns.push("Average rating is moderate");
    else concerns.push("Participants rated the event poorly");
  } else {
    concerns.push("No feedback collected yet");
    recommendations.push("Encourage attendees to submit feedback");
  }

  if (conflicts.length > 0) {
    const severe = conflicts.find((c) => c.severity === "high");
    concerns.push(
      severe
        ? "A venue or time conflict affected the schedule"
        : "Scheduling overlaps may have reduced participation"
    );
    recommendations.push("Schedule overlapping events separately next time");
  }

  if (recommendations.length === 0) {
    recommendations.push("Maintain the current format for the next edition");
  }

  return { score, status, strengths, concerns, recommendations };
}

export function predictDemand(args: {
  event: Pick<EventListItem, "capacity" | "eventDate" | "createdAt" | "category" | "status">;
  registrations: number;
  historicalAttendanceRate: number;
  categoryPopularity: number;
}): DemandPrediction {
  const { event, registrations, historicalAttendanceRate, categoryPopularity } = args;
  const capacity = Math.max(1, event.capacity);
  const now = Date.now();
  const eventTime = new Date(event.eventDate).getTime();
  const daysToEvent = Math.max(0, (eventTime - now) / 86_400_000);
  const daysSinceCreated = Math.max(1, (now - new Date(event.createdAt).getTime()) / 86_400_000);

  // Registration velocity: how many people signed up per day so far.
  const velocity = registrations / daysSinceCreated;

  // Projected registrations: current + velocity * remaining days (capped at capacity).
  const projected = Math.min(capacity, Math.round(registrations + velocity * daysToEvent));

  // Expected attendance applies the historical show-up rate for this category.
  const attendanceRate = historicalAttendanceRate > 0 ? historicalAttendanceRate : 0.65;
  const expectedAttendance = Math.min(
    capacity,
    Math.round(projected * attendanceRate)
  );

  const expectedUtilization = Math.round((expectedAttendance / capacity) * 100);
  const fillPressure = Math.min(capacity, projected) / capacity;

  let demand: DemandPrediction["demand"];
  let explanation: string;

  if (fillPressure >= 0.75 && expectedUtilization >= 0.6) {
    demand = "high";
    explanation = "High registration velocity and strong category popularity point to a well-attended event.";
  } else if (daysToEvent < 2) {
    demand = "high";
    explanation = "The event is very soon and registrations are still coming in.";
  } else if (fillPressure >= 0.4 || categoryPopularity >= 0.5) {
    demand = "medium";
    explanation = "Moderate interest from the target audience and average historical turnout.";
  } else {
    demand = "low";
    explanation = "Slow registration pace and limited historical demand in this category.";
  }

  return {
    expectedAttendance,
    capacity,
    expectedUtilization,
    demand,
    explanation,
  };
}