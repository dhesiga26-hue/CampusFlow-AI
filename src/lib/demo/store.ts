import type {
  AdminAnalytics,
  AppNotification,
  AttendanceRecord,
  AttendanceResult,
  EventInput,
  EventInsight,
  EventListItem,
  EventRecord,
  EventStatus,
  Feedback,
  Profile,
  Recommendation,
  Registration,
  RegistrationWithEvent,
  SignUpInput,
} from "@/types";
import { getCategory } from "@/lib/categories";
import { isUpcoming, uid } from "@/lib/utils";
import type { EventFilters, Stats, Store } from "@/lib/db/interface";
import { detectConflicts } from "@/lib/conflicts";
import { computeHealthScore } from "@/lib/analytics";
import {
  KEYS,
  buildQrPayload,
  clearDemoSession,
  decodeQrPayload,
  delay,
  ensureSeeded,
  getDemoSessionProfile,
  makeEventListItem,
  readLocal,
  setDemoSession,
  sortEvents,
  writeLocal,
} from "@/lib/demo/store-core";

let seeded = false;

function state() {
  if (!seeded) {
    ensureSeeded();
    seeded = true;
  }
  return {
    profiles: readLocal<Profile[]>(KEYS.profiles, []),
    events: readLocal<EventRecord[]>(KEYS.events, []),
    registrations: readLocal<Registration[]>(KEYS.registrations, []),
    attendance: readLocal<AttendanceRecord[]>(KEYS.attendance, []),
    feedback: readLocal<Feedback[]>(KEYS.feedback, []),
    notifications: readLocal<AppNotification[]>(KEYS.notifications, []),
    insights: readLocal<EventInsight[]>(KEYS.insights, []),
  };
}

function persist(partial: Partial<Record<keyof typeof KEYS, unknown>>) {
  Object.entries(partial).forEach(([k, v]) => writeLocal(KEYS[k as keyof typeof KEYS], v));
}

function asList(filters: EventFilters = {}, userId?: string): EventListItem[] {
  const s = state();
  let events = s.events;
  if (filters.status) events = events.filter((e) => e.status === filters.status);
  if (filters.mine && filters.organizerId) {
    events = events.filter((e) => e.organizerId === filters.organizerId);
  }
  if (filters.upcoming !== undefined) {
    events = events.filter((e) =>
      filters.upcoming ? isUpcoming(e.eventDate) : !isUpcoming(e.eventDate)
    );
  }
  if (filters.past !== undefined) {
    events = events.filter((e) => (filters.past ? !isUpcoming(e.eventDate) : isUpcoming(e.eventDate)));
  }
  if (filters.categoryId) events = events.filter((e) => e.categoryId === filters.categoryId);
  if (filters.department) events = events.filter((e) => e.department === filters.department);
  if (filters.venue) events = events.filter((e) => e.location.toLowerCase().includes(filters.venue!.toLowerCase()));
  if (filters.skillLevel) events = events.filter((e) => e.skillLevel === filters.skillLevel);
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    events = events.filter((e) => new Date(e.eventDate).getTime() >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    events = events.filter((e) => new Date(e.eventDate).getTime() <= to);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        getCategory(e.categoryId).name.toLowerCase().includes(q)
    );
  }
  let items = events
    .map((e) => makeEventListItem(e, s.profiles, s.registrations, s.attendance, userId))
    .sort(sortEvents);

  if (filters.sortBy === "popularity") {
    items = items.sort((a, b) => b.registrationsCount - a.registrationsCount);
  } else if (filters.sortBy === "registrations") {
    items = items.sort((a, b) => b.registrationsCount - a.registrationsCount);
  }
  return items;
}

function eventToListItem(event: EventRecord, userId?: string): EventListItem {
  const s = state();
  return makeEventListItem(event, s.profiles, s.registrations, s.attendance, userId);
}

export const demoStore: Store = {
  demoMode: true,

  // ---- auth ----
  async signIn(email, password) {
    await delay();
    const s = state();
    const profile = s.profiles.find(
      (p) => p.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (!profile) throw new Error("No account found with that email.");
    const stored = readLocal<Record<string, string>>("cc_passwords", {});
    if (stored[profile.email] && stored[profile.email] !== password) {
      throw new Error("Incorrect password. Please try again.");
    }
    setDemoSession(profile);
    return profile;
  },

  async signUp(input: SignUpInput) {
    await delay();
    const s = state();
    const email = input.email.toLowerCase().trim();
    if (s.profiles.some((p) => p.email.toLowerCase() === email)) {
      throw new Error("An account with this email already exists.");
    }
    const profile: Profile = {
      id: uid(),
      email,
      fullName: input.fullName.trim(),
      role: "student",
      interests: input.interests,
      department: input.department,
      year: input.year,
      createdAt: new Date().toISOString(),
    };
    const passwords = readLocal<Record<string, string>>("cc_passwords", {});
    passwords[email] = input.password;
    persist({ profiles: [...s.profiles, profile] });
    writeLocal("cc_passwords", passwords);
    setDemoSession(profile);
    return profile;
  },

  async signOut() {
    await delay();
    clearDemoSession();
  },

  async getSessionProfile() {
    const fromCookie = getDemoSessionProfile();
    if (!fromCookie) return null;
    const s = state();
    const fresh = s.profiles.find((p) => p.id === fromCookie.id);
    if (!fresh) return null;
    if (JSON.stringify(fresh) !== JSON.stringify(fromCookie)) setDemoSession(fresh);
    return fresh;
  },

  async updateProfile(id, patch) {
    await delay();
    const s = state();
    const profiles = s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p));
    persist({ profiles });
    const updated = profiles.find((p) => p.id === id);
    if (updated) setDemoSession(updated);
    if (!updated) throw new Error("Profile not found.");
    return updated;
  },

  // ---- reads ----
  async getCategories() {
    const s = state();
    return s.events.length
      ? [
          ...new Map(
            s.events.map((e) => getCategory(e.categoryId)).map((c) => [c.id, c])
          ).values(),
        ]
      : [];
  },

  async getEvents(filters = {}) {
    await delay();
    return asList(filters);
  },

  async getEvent(id, userId) {
    await delay();
    const s = state();
    const event = s.events.find((e) => e.id === id);
    return event ? eventToListItem(event, userId) : null;
  },

  async getMyRegistrations(userId) {
    await delay();
    const s = state();
    return s.registrations
      .filter((r) => r.userId === userId && r.status === "registered")
      .map((r) => {
        const event = s.events.find((e) => e.id === r.eventId);
        return {
          ...r,
          event: event
            ? eventToListItem(event, userId)
            : ({} as unknown as EventListItem),
        } as RegistrationWithEvent;
      })
      .filter((r) => r.event?.id)
      .sort((a, b) => new Date(a.event.eventDate).getTime() - new Date(b.event.eventDate).getTime());
  },

  async getRegistrations(eventId) {
    await delay();
    const s = state();
    return s.registrations
      .filter((r) => r.eventId === eventId && r.status === "registered")
      .map((r) => ({
        ...r,
        profile: s.profiles.find((p) => p.id === r.userId) as Profile,
        attended: s.attendance.some((a) => a.registrationId === r.id),
      }));
  },

  async listUsers() {
    await delay();
    return state()
      .profiles.slice()
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  },

  async getStats(): Promise<Stats> {
    const s = state();
    const categories = new Map<string, { name: string; events: number; registrations: number }>();
    s.events.forEach((e) => {
      const cat = getCategory(e.categoryId);
      const entry = categories.get(cat.name) ?? { name: cat.name, events: 0, registrations: 0 };
      entry.events += 1;
      entry.registrations += s.registrations.filter(
        (r) => r.eventId === e.id && r.status === "registered"
      ).length;
      categories.set(cat.name, entry);
    });
    return {
      totalStudents: s.profiles.filter((p) => p.role === "student").length,
      totalOrganizers: s.profiles.filter((p) => p.role === "organizer").length,
      totalEvents: s.events.length,
      totalRegistrations: s.registrations.filter((r) => r.status === "registered").length,
      totalAttendance: s.attendance.length,
      pendingEvents: s.events.filter((e) => e.status === "pending").length,
      categories: [...categories.values()].sort((a, b) => b.events - a.events),
    };
  },

  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const s = state();
    const totalUsers = s.profiles.length;
    const totalStudents = s.profiles.filter((p) => p.role === "student").length;
    const totalOrganizers = s.profiles.filter((p) => p.role === "organizer").length;
    const totalAdmins = s.profiles.filter((p) => p.role === "admin").length;
    const activeEvents = s.events.filter((e) => e.status === "approved").length;
    const totalRegistrations = s.registrations.filter((r) => r.status === "registered").length;
    const totalAttendance = s.attendance.length;
    const pendingApprovals = s.events.filter((e) => e.status === "pending").length;

    const eventsByMonthMap = new Map<string, number>();
    const registrationsByMonthMap = new Map<string, number>();
    const attendanceByMonthMap = new Map<string, number>();
    const eventsByCategoryMap = new Map<string, number>();
    const eventsByDepartmentMap = new Map<string, number>();

    s.events.forEach((e) => {
      const month = new Date(e.eventDate).toLocaleString("en", { month: "short", year: "numeric" });
      eventsByMonthMap.set(month, (eventsByMonthMap.get(month) ?? 0) + 1);
      const catName = getCategory(e.categoryId).name;
      eventsByCategoryMap.set(catName, (eventsByCategoryMap.get(catName) ?? 0) + 1);
      const dept = e.department || "All";
      eventsByDepartmentMap.set(dept, (eventsByDepartmentMap.get(dept) ?? 0) + 1);
    });

    s.registrations.filter((r) => r.status === "registered").forEach((r) => {
      const event = s.events.find((e) => e.id === r.eventId);
      if (!event) return;
      const month = new Date(event.eventDate).toLocaleString("en", { month: "short", year: "numeric" });
      registrationsByMonthMap.set(month, (registrationsByMonthMap.get(month) ?? 0) + 1);
    });

    s.attendance.forEach((a) => {
      const event = s.events.find((e) => e.id === a.eventId);
      if (!event) return;
      const month = new Date(event.eventDate).toLocaleString("en", { month: "short", year: "numeric" });
      attendanceByMonthMap.set(month, (attendanceByMonthMap.get(month) ?? 0) + 1);
    });

    const topEvents = s.events
      .filter((e) => e.status === "approved" || e.status === "completed")
      .map((e) => {
        const regs = s.registrations.filter((r) => r.eventId === e.id && r.status === "registered").length;
        const att = s.attendance.filter((a) => a.eventId === e.id).length;
        const fbs = s.feedback.filter((f) => f.eventId === e.id);
        const avgRating = fbs.length ? fbs.reduce((sum, f) => sum + f.rating, 0) / fbs.length : 0;
        const conflicts = detectConflicts(e, s.events);
        const health = computeHealthScore({
          event: { capacity: e.capacity, eventDate: e.eventDate },
          registrations: regs,
          attendance: att,
          feedback: fbs,
          conflicts,
        });
        return { id: e.id, title: e.title, registrations: regs, attendance: att, rating: Math.round(avgRating * 10) / 10, healthScore: health.score };
      })
      .sort((a, b) => b.registrations - a.registrations);

    const needingAttention = topEvents
      .filter((e) => e.healthScore < 60)
      .map((e) => ({
        id: e.id,
        title: e.title,
        healthScore: e.healthScore,
        reason: e.healthScore < 40 ? "Critical health score" : "Below target health score",
      }));

    const avgAttendanceRate = totalRegistrations > 0 ? totalAttendance / totalRegistrations : 0;
    const allFbs = s.feedback;
    const avgRating = allFbs.length ? allFbs.reduce((sum, f) => sum + f.rating, 0) / allFbs.length : 0;

    const monthSort = (a: string, b: string) => {
      const da = new Date(a).getTime();
      const db = new Date(b).getTime();
      return da - db;
    };

    return {
      totals: {
        totalUsers,
        totalStudents,
        totalOrganizers,
        totalAdmins,
        totalEvents: s.events.length,
        activeEvents,
        totalRegistrations,
        totalAttendance,
        avgAttendanceRate: Math.round(avgAttendanceRate * 100) / 100,
        avgRating: Math.round(avgRating * 10) / 10,
        pendingApprovals,
      },
      eventsByMonth: [...eventsByMonthMap.entries()].map(([month, count]) => ({ month, count })).sort((a, b) => monthSort(a.month, b.month)),
      registrationsByMonth: [...registrationsByMonthMap.entries()].map(([month, count]) => ({ month, count })).sort((a, b) => monthSort(a.month, b.month)),
      attendanceByMonth: [...attendanceByMonthMap.entries()].map(([month, count]) => ({ month, count })).sort((a, b) => monthSort(a.month, b.month)),
      eventsByCategory: [...eventsByCategoryMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      eventsByDepartment: [...eventsByDepartmentMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      topEvents: topEvents.slice(0, 10),
      needingAttention,
      conflicts: s.events.flatMap((e) => detectConflicts(e, s.events)),
    };
  },

  // ---- feedback ----
  async getFeedback(eventId) {
    await delay();
    const s = state();
    return s.feedback
      .filter((f) => f.eventId === eventId)
      .map((f) => ({
        ...f,
        student: s.profiles.find((p) => p.id === f.studentId) ?? { id: f.studentId, email: "", fullName: "Student", role: "student" as const, interests: [], createdAt: "" },
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getMyFeedback(studentId) {
    await delay();
    return state().feedback.filter((f) => f.studentId === studentId);
  },

  async hasFeedback(eventId, studentId) {
    await delay();
    return state().feedback.some((f) => f.eventId === eventId && f.studentId === studentId);
  },

  async submitFeedback({ eventId, studentId, rating, comment }) {
    await delay();
    const s = state();
    const fb: Feedback = {
      id: uid(),
      eventId,
      studentId,
      rating,
      comment: comment.trim(),
      sentiment: rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative",
      createdAt: new Date().toISOString(),
    };
    persist({ feedback: [...s.feedback, fb] });
    return fb;
  },

  async saveInsight(eventId, partial) {
    await delay();
    const s = state();
    const insight: EventInsight = {
      id: uid(),
      eventId,
      ...partial,
      createdAt: new Date().toISOString(),
    };
    persist({ insights: [...s.insights.filter((i) => i.eventId !== eventId), insight] });
    return insight;
  },

  async getInsight(eventId) {
    await delay();
    return state().insights.find((i) => i.eventId === eventId) ?? null;
  },

  // ---- notifications ----
  async getNotifications(userId) {
    await delay();
    return state().notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markNotificationsRead(userId, ids) {
    await delay();
    const s = state();
    persist({
      notifications: s.notifications.map((n) =>
        n.userId === userId && (!ids || ids.includes(n.id)) ? { ...n, read: true } : n
      ),
    });
  },

  // ---- writes ----
  async createEvent(organizerId, input: EventInput) {
    await delay();
    const s = state();
    const organizer = s.profiles.find((p) => p.id === organizerId);
    if (!organizer || organizer.role === "student") {
      throw new Error("Only organizers can create events.");
    }
    const event: EventRecord = {
      id: uid(),
      organizerId,
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      location: input.location,
      eventDate: input.eventDate,
      endTime: input.endTime,
      registrationDeadline: input.registrationDeadline,
      capacity: input.capacity,
      skillLevel: input.skillLevel,
      department: input.department,
      targetAudience: input.targetAudience,
      agenda: input.agenda,
      resources: input.resources,
      aiGenerated: input.aiGenerated ?? false,
      status: organizer.role === "admin" ? "approved" : "pending",
      createdAt: new Date().toISOString(),
    };
    persist({ events: [...s.events, event] });
    return event;
  },

  async updateEvent(eventId, organizerId, input: Partial<EventInput>) {
    await delay();
    const s = state();
    const target = s.events.find((e) => e.id === eventId);
    if (!target) throw new Error("Event not found.");
    if (target.organizerId !== organizerId) {
      const actor = s.profiles.find((p) => p.id === organizerId);
      if (actor?.role !== "admin") throw new Error("You can only edit your own events.");
    }
    const updated: EventRecord = { ...target, ...input, aiGenerated: input.aiGenerated ?? target.aiGenerated };
    persist({ events: s.events.map((e) => (e.id === eventId ? updated : e)) });
    return updated;
  },

  async deleteEvent(eventId, organizerId) {
    await delay();
    const s = state();
    const target = s.events.find((e) => e.id === eventId);
    if (!target) throw new Error("Event not found.");
    const actor = s.profiles.find((p) => p.id === organizerId);
    if (target.organizerId !== organizerId && actor?.role !== "admin") {
      throw new Error("You can only delete your own events.");
    }
    persist({
      events: s.events.filter((e) => e.id !== eventId),
      registrations: s.registrations.filter((r) => r.eventId !== eventId),
      attendance: s.attendance.filter((a) => a.eventId !== eventId),
      feedback: s.feedback.filter((f) => f.eventId !== eventId),
    });
  },

  async setEventStatus(eventId, status: EventStatus, rejectionReason?: string) {
    await delay();
    const s = state();
    persist({
      events: s.events.map((e) =>
        e.id === eventId ? { ...e, status, rejectionReason: status === "rejected" ? rejectionReason : e.rejectionReason } : e
      ),
    });
  },

  async register(eventId, userId) {
    await delay();
    const s = state();
    const event = s.events.find((e) => e.id === eventId);
    if (!event) throw new Error("Event not found.");
    if (event.status !== "approved") throw new Error("This event is not open for registration.");
    if (!isUpcoming(event.eventDate)) throw new Error("This event has already ended.");
    if (new Date(event.registrationDeadline).getTime() < Date.now()) {
      throw new Error("Registration for this event has closed.");
    }
    const existing = s.registrations.find(
      (r) => r.eventId === eventId && r.userId === userId && r.status === "registered"
    );
    if (existing) throw new Error("You are already registered for this event.");
    const count = s.registrations.filter(
      (r) => r.eventId === eventId && r.status === "registered"
    ).length;
    if (count >= event.capacity) throw new Error("This event is full.");
    const registration: Registration = {
      id: uid(),
      eventId,
      userId,
      status: "registered",
      qrPayload: "",
      createdAt: new Date().toISOString(),
    };
    registration.qrPayload = buildQrPayload(registration.id, eventId, userId);
    persist({ registrations: [...s.registrations, registration] });
    return registration;
  },

  async cancelRegistration(registrationId, userId) {
    await delay();
    const s = state();
    const target = s.registrations.find((r) => r.id === registrationId);
    if (!target) throw new Error("Registration not found.");
    if (target.userId !== userId) throw new Error("Not your registration.");
    persist({
      registrations: s.registrations.map((r) =>
        r.id === registrationId ? { ...r, status: "cancelled" } : r
      ),
    });
  },

  // ---- attendance ----
  async markAttendance(payload: string, organizerId: string, expectedEventId?: string): Promise<AttendanceResult> {
    await delay();
    const s = state();
    const actor = s.profiles.find((p) => p.id === organizerId);
    if (!actor || actor.role === "student") {
      return { ok: false, message: "Only organizers or admins can scan passes." };
    }
    const decoded = decodeQrPayload(payload);
    const registration = s.registrations.find((r) => r.id === decoded.registrationId);
    if (!registration) {
      return { ok: false, invalid: true, message: "This QR pass is not recognized." };
    }
    if (expectedEventId && registration.eventId !== expectedEventId) {
      return { ok: false, invalid: true, message: "This pass belongs to a different event." };
    }
    const event = s.events.find((e) => e.id === registration.eventId);
    if (!event) {
      return { ok: false, invalid: true, message: "The event for this pass no longer exists." };
    }
    if (event.organizerId !== organizerId && actor.role !== "admin") {
      return { ok: false, message: "You can only scan passes for your own events." };
    }
    const student = s.profiles.find((p) => p.id === registration.userId);
    const existing = s.attendance.find((a) => a.registrationId === registration.id);
    if (existing) {
      return {
        ok: true,
        alreadyAttended: true,
        attended: true,
        studentName: student?.fullName ?? "Student",
        eventTitle: event.title,
        message: "Attendance already recorded earlier.",
      };
    }
    const record: AttendanceRecord = {
      id: uid(),
      registrationId: registration.id,
      eventId: event.id,
      userId: registration.userId,
      markedBy: organizerId,
      markedAt: new Date().toISOString(),
    };
    persist({ attendance: [...s.attendance, record] });
    return {
      ok: true,
      attended: true,
      studentName: student?.fullName ?? "Student",
      eventTitle: event.title,
      message: "Attendance recorded successfully!",
    };
  },

  async getAttendance(eventId) {
    return state().attendance.filter((a) => a.eventId === eventId);
  },

  async getMyAttendance(userId) {
    return state()
      .attendance.filter((a) => a.userId === userId)
      .map((a) => ({ eventId: a.eventId, markedAt: a.markedAt }));
  },

  // ---- conflicts ----
  async detectConflicts(candidate) {
    await delay();
    const s = state();
    return detectConflicts(
      { id: "candidate", status: "approved", ...candidate } as EventRecord,
      s.events
    );
  },

  async listConflicts() {
    await delay();
    const s = state();
    return s.events.flatMap((e) => detectConflicts(e, s.events));
  },

  // ---- recommendations ----
  async rankEvents(events: EventListItem[], interests: string[], previousParticipations?: string[]): Promise<Recommendation[]> {
    return rankEventsLocal(events, interests, previousParticipations);
  },
};

export function rankEventsLocal(
  events: EventListItem[],
  interests: string[],
  previousParticipations?: string[]
): Recommendation[] {
  const top = new Set(interests.map((i) => i.toLowerCase()));
  const attended = new Set(previousParticipations ?? []);

  const scored = events
    .map((event) => {
      const title = event.title.toLowerCase();
      const desc = event.description.toLowerCase();
      const category = event.category.name.toLowerCase();
      let score = 0;
      const matched: string[] = [];

      for (const interest of top) {
        const ir = interest.replace(/[^a-z0-9 ]/gi, " ").trim();
        const key = ir.split(" ")[0];
        let delta = 0;
        if (category.includes(ir) || category.includes(key)) delta += 4;
        if (title.includes(ir) || title.includes(key)) delta += 3;
        if (desc.includes(ir) || desc.includes(key)) delta += 1.5;
        if (delta > 0) {
          score += delta;
          matched.push(
            interest
              .split(" ")
              .map((w) => w[0]?.toUpperCase() + w.slice(1))
              .join(" ")
          );
        }
      }

      if (event.status !== "approved") return null;
      if (!isUpcoming(event.eventDate)) return null;

      const skillBonus: Record<string, number> = { beginner: 1, intermediate: 0.5, all: 0.5 };
      score += skillBonus[event.skillLevel] ?? 0;

      // Popularity bonus (normalized).
      score += Math.min(3, event.registrationsCount / 30);

      // Slight penalty for events the student already attended in the past.
      if (attended.has(event.id)) score -= 2;

      if (score <= 0) return null;
      return {
        eventId: event.id,
        score,
        reason: matched.length
          ? `Matches your interest in ${[...new Set(matched)].slice(0, 2).join(" & ")}`
          : "Relevant to your profile",
      };
    })
    .filter((r): r is Recommendation => r !== null)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 6);
}