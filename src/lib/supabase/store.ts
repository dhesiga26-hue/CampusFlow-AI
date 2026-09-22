import type {
  AdminAnalytics,
  AppNotification,
  AttendanceResult,
  Category,
  EventInput,
  EventListItem,
  EventRecord,
  EventStatus,
  Feedback,
  FeedbackWithStudent,
  Profile,
  Registration,
  SignUpInput,
} from "@/types";
import { isUpcoming, uid } from "@/lib/utils";
import type { EventFilters, Stats, Store } from "@/lib/db/interface";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { detectConflicts } from "@/lib/conflicts";
import { rankEventsLocal } from "@/lib/demo/store";

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: Profile["role"];
  interests: string[];
  department?: string;
  year?: string;
  created_at: string;
}

interface EventRow {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  category_id: string;
  location: string;
  event_date: string;
  end_time: string;
  registration_deadline: string;
  capacity: number;
  skill_level: EventRecord["skillLevel"];
  department: string;
  target_audience: string;
  agenda: string;
  resources: string;
  ai_generated: boolean;
  rejection_reason?: string;
  status: EventStatus;
  created_at: string;
  organizer?: Pick<ProfileRow, "id" | "full_name" | "email"> | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    accent: string;
  } | null;
  registrations?: { id: string }[];
  attendance?: { id: string }[];
}

interface RegistrationRow {
  id: string;
  event_id: string;
  user_id: string;
  status: Registration["status"];
  qr_code: string;
  created_at: string;
}

interface AttendanceRow {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  marked_by: string;
  marked_at: string;
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    interests: row.interests ?? [],
    department: row.department,
    year: row.year,
    createdAt: row.created_at,
  };
}

function toEvent(row: EventRow): EventRecord {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    location: row.location,
    eventDate: row.event_date,
    endTime: row.end_time,
    registrationDeadline: row.registration_deadline,
    capacity: row.capacity,
    skillLevel: row.skill_level,
    department: row.department ?? "",
    targetAudience: row.target_audience ?? "",
    agenda: row.agenda ?? "",
    resources: row.resources ?? "",
    aiGenerated: row.ai_generated ?? false,
    rejectionReason: row.rejection_reason,
    status: row.status,
    createdAt: row.created_at,
  };
}

function toEventItem(row: EventRow, isRegistered?: boolean): EventListItem {
  return {
    ...toEvent(row),
    organizer: {
      id: row.organizer?.id ?? row.organizer_id,
      fullName: row.organizer?.full_name ?? "Campus Organizer",
      email: row.organizer?.email ?? "unknown",
    },
    category:
      row.category ??
      ({
        id: row.category_id,
        name: row.category_id,
        slug: row.category_id,
        description: "",
        accent: "from-violet-500 to-purple-600",
      } as Category),
    registrationsCount: row.registrations?.length ?? 0,
    attendeeCount: row.attendance?.length ?? 0,
    isRegistered,
  };
}

const EVENT_SELECT = `*, organizer:profiles!events_organizer_id_fkey(id, full_name, email), category:event_categories(*), registrations:registrations!registrations_event_id_fkey(id), attendance:attendance!attendance_event_id_fkey(id)`;

export const supabaseStore: Store = {
  demoMode: false,

  // ---- auth ----
  async signIn(email, password) {
    const client = createBrowserSupabase();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error(error?.message ?? "Sign in failed.");
    const { data: profileRow } = await client
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();
    return toProfile((profileRow as ProfileRow) ?? { ...emptyProfile(data.user) });
  },

  async signUp(input: SignUpInput) {
    const client = createBrowserSupabase();
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.fullName, interests: input.interests, department: input.department, year: input.year },
      },
    });
    if (error || !data.user) throw new Error(error?.message ?? "Sign up failed.");
    const profile: Profile = {
      id: data.user.id,
      email: input.email.toLowerCase().trim(),
      fullName: input.fullName.trim(),
      role: "student",
      interests: input.interests,
      department: input.department,
      year: input.year,
      createdAt: new Date().toISOString(),
    };
    await client.from("profiles").upsert(rowFromProfile(profile), { onConflict: "id" });
    await client.auth.updateUser({
      data: { full_name: input.fullName, interests: input.interests, department: input.department, year: input.year },
    });
    return profile;
  },

  async signOut() {
    const client = createBrowserSupabase();
    await client.auth.signOut();
  },

  async getSessionProfile() {
    const client = createBrowserSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return null;
    const { data: profileRow } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
    return profileRow ? toProfile(profileRow as ProfileRow) : toProfile({ ...emptyProfile(user), email: user.email ?? "" });
  },

  async updateProfile(id, patch) {
    const client = createBrowserSupabase();
    const { data, error } = await client
      .from("profiles")
      .update({ full_name: patch.fullName, interests: patch.interests, department: patch.department, year: patch.year })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Update failed.");
    return toProfile(data as ProfileRow);
  },

  // ---- reads ----
  async getCategories() {
    const client = createBrowserSupabase();
    const { data, error } = await client.from("event_categories").select("*").order("name");
    if (error) throw new Error(error.message);
    return (data as unknown as Category[]).map((c) => ({
      ...c,
      accent: c.accent || "from-violet-500 to-purple-600",
    }));
  },

  async getEvents(filters: EventFilters = {}) {
    const client = createBrowserSupabase();
    let query = client.from("events").select(EVENT_SELECT);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.mine && filters.organizerId) query = query.eq("organizer_id", filters.organizerId);
    if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters.department) query = query.eq("department", filters.department);
    if (filters.skillLevel) query = query.eq("skill_level", filters.skillLevel);
    query = query.order("event_date", { ascending: true });
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    let rows = (data ?? []) as EventRow[];
    if (filters.upcoming) rows = rows.filter((r) => isUpcoming(r.event_date));
    if (filters.past) rows = rows.filter((r) => !isUpcoming(r.event_date));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.category?.name ?? "").toLowerCase().includes(q) ||
          (r.location ?? "").toLowerCase().includes(q)
      );
    }
    if (filters.venue) {
      const v = filters.venue.toLowerCase();
      rows = rows.filter((r) => (r.location ?? "").toLowerCase().includes(v));
    }
    if (filters.dateFrom) rows = rows.filter((r) => new Date(r.event_date).getTime() >= new Date(filters.dateFrom!).getTime());
    if (filters.dateTo) rows = rows.filter((r) => new Date(r.event_date).getTime() <= new Date(filters.dateTo!).getTime());
    let items = rows.map((r) => toEventItem(r));
    if (filters.sortBy === "popularity") items = items.sort((a, b) => b.registrationsCount - a.registrationsCount);
    return items;
  },

  async getEvent(id, userId) {
    const client = createBrowserSupabase();
    const { data, error } = await client.from("events").select(EVENT_SELECT).eq("id", id).maybeSingle();
    if (error || !data) return null;
    let isRegistered: boolean | undefined;
    if (userId) {
      const { count } = await client
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", id)
        .eq("user_id", userId)
        .eq("status", "registered");
      isRegistered = (count ?? 0) > 0;
    }
    return toEventItem(data as EventRow, isRegistered);
  },

  async getMyRegistrations(userId) {
    const client = createBrowserSupabase();
    const { data, error } = await client
      .from("registrations")
      .select(`*, event:events(${EVENT_SELECT})`)
      .eq("user_id", userId)
      .eq("status", "registered")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as (RegistrationRow & { event?: EventRow })[])
      .filter((r) => r.event)
      .map((r) => ({
        id: r.id,
        eventId: r.event_id,
        userId: r.user_id,
        status: r.status,
        qrPayload: r.qr_code,
        createdAt: r.created_at,
        event: toEventItem(r.event as EventRow),
      }))
      .sort((a, b) => new Date(a.event.eventDate).getTime() - new Date(b.event.eventDate).getTime());
  },

  async getRegistrations(eventId) {
    const client = createBrowserSupabase();
    const { data, error } = await client
      .from("registrations")
      .select(`*, profile:profiles(id, full_name, email, role, interests, created_at), attendance:attendance!attendance_registration_id_fkey(id)`)
      .eq("event_id", eventId)
      .eq("status", "registered")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as (RegistrationRow & { profile?: ProfileRow | null; attendance?: { id: string }[] | null })[]).map((r) => ({
      id: r.id,
      eventId: r.event_id,
      userId: r.user_id,
      status: r.status,
      qrPayload: r.qr_code,
      createdAt: r.created_at,
      profile: r.profile ? toProfile(r.profile) : ({} as Profile),
      attended: (r.attendance?.length ?? 0) > 0,
    }));
  },

  async listUsers() {
    const client = createBrowserSupabase();
    const { data, error } = await client.from("profiles").select("*").order("full_name");
    if (error) throw new Error(error.message);
    return ((data ?? []) as ProfileRow[]).map(toProfile).sort((a, b) => a.fullName.localeCompare(b.fullName));
  },

  async getStats(): Promise<Stats> {
    const client = createBrowserSupabase();
    const [students, organizers, events, registrations, attendance, pending, cats] = await Promise.all([
      client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
      client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "organizer"),
      client.from("events").select("id", { count: "exact", head: true }),
      client.from("registrations").select("id", { count: "exact", head: true }).eq("status", "registered"),
      client.from("attendance").select("id", { count: "exact", head: true }),
      client.from("events").select("id", { count: "exact", head: true }).eq("status", "pending"),
      client.from("events").select("category_id, category:event_categories(name), registrations:registrations(id)"),
    ]);
    const catMap = new Map<string, { name: string; events: number; registrations: number }>();
    const catRows = (cats.data ?? []) as unknown as {
      category_id: string;
      category?: { name: string }[] | { name: string } | null;
      registrations?: { id: string }[];
    }[];
    catRows.forEach((row) => {
      const cat = Array.isArray(row.category) ? row.category[0] : row.category;
      const name = cat?.name ?? row.category_id;
      const entry = catMap.get(name) ?? { name, events: 0, registrations: 0 };
      entry.events += 1;
      entry.registrations += row.registrations?.length ?? 0;
      catMap.set(name, entry);
    });
    return {
      totalStudents: students.count ?? 0,
      totalOrganizers: organizers.count ?? 0,
      totalEvents: events.count ?? 0,
      totalRegistrations: registrations.count ?? 0,
      totalAttendance: attendance.count ?? 0,
      pendingEvents: pending.count ?? 0,
      categories: [...catMap.values()].sort((a, b) => b.events - a.events),
    };
  },

  async getAdminAnalytics(): Promise<AdminAnalytics> {
    // For Supabase mode, fetch everything and compute client-side.
    // In a production app this would be a SQL function or view.
    const client = createBrowserSupabase();
    const [eventsRes, regsRes, attRes, fbsRes, profilesRes] = await Promise.all([
      client.from("events").select("*, category:event_categories(name)"),
      client.from("registrations").select("event_id, created_at").eq("status", "registered"),
      client.from("attendance").select("event_id"),
      client.from("feedback").select("event_id, rating"),
      client.from("profiles").select("role"),
    ]);
    const events = (eventsRes.data ?? []) as EventRow[];
    const regs = (regsRes.data ?? []) as { event_id: string; created_at: string }[];
    const atts = (attRes.data ?? []) as { event_id: string }[];
    const fbs = (fbsRes.data ?? []) as { event_id: string; rating: number }[];
    const profiles = (profilesRes.data ?? []) as { role: string }[];

    const totalUsers = profiles.length;
    const totalStudents = profiles.filter((p) => p.role === "student").length;
    const totalOrganizers = profiles.filter((p) => p.role === "organizer").length;
    const totalAdmins = profiles.filter((p) => p.role === "admin").length;
    const activeEvents = events.filter((e) => e.status === "approved").length;
    const totalRegistrations = regs.length;
    const totalAttendance = atts.length;
    const pendingApprovals = events.filter((e) => e.status === "pending").length;
    const avgAttendanceRate = totalRegistrations > 0 ? totalAttendance / totalRegistrations : 0;
    const avgRating = fbs.length ? fbs.reduce((sum, f) => sum + f.rating, 0) / fbs.length : 0;

    const monthOf = (date: string) => new Date(date).toLocaleString("en", { month: "short", year: "numeric" });

    const eventsByMonth = new Map<string, number>();
    events.forEach((e) => { eventsByMonth.set(monthOf(e.event_date), (eventsByMonth.get(monthOf(e.event_date)) ?? 0) + 1); });

    const registrationsByMonth = new Map<string, number>();
    regs.forEach((r) => { registrationsByMonth.set(monthOf(r.created_at), (registrationsByMonth.get(monthOf(r.created_at)) ?? 0) + 1); });

    const attendanceByMonth = new Map<string, number>();
    atts.forEach((a) => {
      const ev = events.find((e) => e.id === a.event_id);
      if (ev) attendanceByMonth.set(monthOf(ev.event_date), (attendanceByMonth.get(monthOf(ev.event_date)) ?? 0) + 1);
    });

    const eventsByCategory = new Map<string, number>();
    events.forEach((e) => {
      const name = Array.isArray(e.category) ? (e.category[0] as { name: string })?.name : (e.category as { name: string })?.name ?? e.category_id;
      eventsByCategory.set(name, (eventsByCategory.get(name) ?? 0) + 1);
    });

    const eventsByDepartment = new Map<string, number>();
    events.forEach((e) => { eventsByDepartment.set(e.department || "All", (eventsByDepartment.get(e.department || "All") ?? 0) + 1); });

    const topEvents = events
      .filter((e) => e.status === "approved" || e.status === "completed")
      .map((e) => {
        const evRegCount = regs.filter((r) => r.event_id === e.id).length;
        const evAttCount = atts.filter((a) => a.event_id === e.id).length;
        const evFbs = fbs.filter((f) => f.event_id === e.id);
        const evRating = evFbs.length ? evFbs.reduce((sum, f) => sum + f.rating, 0) / evFbs.length : 0;
        return { id: e.id, title: e.title, registrations: evRegCount, attendance: evAttCount, rating: Math.round(evRating * 10) / 10, healthScore: 70 };
      })
      .sort((a, b) => b.registrations - a.registrations);

    const needingAttention = topEvents
      .filter((e) => e.healthScore < 60)
      .map((e) => ({ id: e.id, title: e.title, healthScore: e.healthScore, reason: "Below target health score" }));

    return {
      totals: { totalUsers, totalStudents, totalOrganizers, totalAdmins, totalEvents: events.length, activeEvents, totalRegistrations, totalAttendance, avgAttendanceRate: Math.round(avgAttendanceRate * 100) / 100, avgRating: Math.round(avgRating * 10) / 10, pendingApprovals },
      eventsByMonth: [...eventsByMonth.entries()].map(([month, count]) => ({ month, count })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()),
      registrationsByMonth: [...registrationsByMonth.entries()].map(([month, count]) => ({ month, count })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()),
      attendanceByMonth: [...attendanceByMonth.entries()].map(([month, count]) => ({ month, count })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()),
      eventsByCategory: [...eventsByCategory.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      eventsByDepartment: [...eventsByDepartment.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      topEvents: topEvents.slice(0, 10),
      needingAttention,
      conflicts: [],
    };
  },

  // ---- feedback ----
  async getFeedback(eventId) {
    const client = createBrowserSupabase();
    const { data, error } = await client
      .from("feedback")
      .select("*, student:profiles(id, email, full_name, role, interests, created_at)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as (Feedback & { student?: ProfileRow })[]).map((f) => ({
      ...f,
      student: f.student ? toProfile(f.student) : ({ id: f.studentId, email: "", fullName: "Student", role: "student" as const, interests: [], createdAt: "" } as Profile),
    })) as FeedbackWithStudent[];
  },

  async getMyFeedback(studentId) {
    const client = createBrowserSupabase();
    const { data, error } = await client.from("feedback").select("*").eq("student_id", studentId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Feedback[];
  },

  async hasFeedback(eventId, studentId) {
    const client = createBrowserSupabase();
    const { count } = await client
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("student_id", studentId);
    return (count ?? 0) > 0;
  },

  async submitFeedback({ eventId, studentId, rating, comment }) {
    const client = createBrowserSupabase();
    const fb = {
      id: uid(),
      event_id: eventId,
      student_id: studentId,
      rating,
      comment: comment.trim(),
      sentiment: rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative",
      created_at: new Date().toISOString(),
    };
    const { data, error } = await client.from("feedback").insert(fb).select("*").single();
    if (error) throw new Error(error.message);
    const row = data as Feedback & { event_id?: string; student_id?: string; created_at?: string };
    return {
      id: row.id,
      eventId: row.event_id ?? eventId,
      studentId: row.student_id ?? studentId,
      rating: row.rating,
      comment: row.comment,
      sentiment: row.sentiment,
      createdAt: row.created_at ?? fb.created_at,
    };
  },

  async saveInsight(eventId, partial) {
    const client = createBrowserSupabase();
    const row = {
      id: uid(),
      event_id: eventId,
      expected_attendance: partial.expectedAttendance,
      event_health_score: partial.eventHealthScore,
      sentiment_summary: partial.sentimentSummary,
      positive_points: partial.positivePoints,
      issues: partial.issues,
      recommendations: partial.recommendations,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await client.from("event_ai_insights").upsert(row, { onConflict: "event_id" }).select("*").single();
    if (error) throw new Error(error.message);
    const r = data as Record<string, unknown>;
    return {
      id: r.id as string,
      eventId: (r.event_id as string) ?? eventId,
      expectedAttendance: r.expected_attendance as number | undefined,
      eventHealthScore: r.event_health_score as number | undefined,
      sentimentSummary: r.sentiment_summary as string | undefined,
      positivePoints: r.positive_points as string[] | undefined,
      issues: r.issues as string[] | undefined,
      recommendations: r.recommendations as string[] | undefined,
      createdAt: (r.created_at as string) ?? row.created_at,
    };
  },

  async getInsight(eventId) {
    const client = createBrowserSupabase();
    const { data } = await client.from("event_ai_insights").select("*").eq("event_id", eventId).maybeSingle();
    if (!data) return null;
    const r = data as Record<string, unknown>;
    return {
      id: r.id as string,
      eventId: (r.event_id as string) ?? eventId,
      expectedAttendance: r.expected_attendance as number | undefined,
      eventHealthScore: r.event_health_score as number | undefined,
      sentimentSummary: r.sentiment_summary as string | undefined,
      positivePoints: r.positive_points as string[] | undefined,
      issues: r.issues as string[] | undefined,
      recommendations: r.recommendations as string[] | undefined,
      createdAt: (r.created_at as string) ?? "",
    };
  },

  // ---- notifications ----
  async getNotifications(userId) {
    const client = createBrowserSupabase();
    const { data, error } = await client
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      userId: (r.user_id as string) ?? userId,
      title: r.title as string,
      message: r.message as string,
      type: r.type as AppNotification["type"],
      read: r.read as boolean,
      createdAt: (r.created_at as string) ?? "",
    }));
  },

  async markNotificationsRead(userId, ids) {
    const client = createBrowserSupabase();
    let query = client.from("notifications").update({ read: true }).eq("user_id", userId);
    if (ids && ids.length) query = query.in("id", ids);
    await query;
  },

  // ---- writes ----
  async createEvent(organizerId, input: EventInput) {
    const client = createBrowserSupabase();
    const { data: profile } = await client.from("profiles").select("role").eq("id", organizerId).maybeSingle();
    if (!profile || profile.role === "student") throw new Error("Only organizers can create events.");
    const { data, error } = await client
      .from("events")
      .insert({
        organizer_id: organizerId,
        title: input.title,
        description: input.description,
        category_id: input.categoryId,
        location: input.location,
        event_date: input.eventDate,
        end_time: input.endTime,
        registration_deadline: input.registrationDeadline,
        capacity: input.capacity,
        skill_level: input.skillLevel,
        department: input.department,
        target_audience: input.targetAudience,
        agenda: input.agenda,
        resources: input.resources,
        ai_generated: input.aiGenerated ?? false,
        status: profile.role === "admin" ? "approved" : "pending",
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Create failed.");
    return toEvent(data as EventRow);
  },

  async updateEvent(eventId, organizerId, input: Partial<EventInput>) {
    const client = createBrowserSupabase();
    const { data: existing } = await client.from("events").select("organizer_id").eq("id", eventId).maybeSingle();
    if (!existing) throw new Error("Event not found.");
    const { data: profile } = await client.from("profiles").select("role").eq("id", organizerId).maybeSingle();
    if (existing.organizer_id !== organizerId && profile?.role !== "admin") throw new Error("You can only edit your own events.");
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.categoryId !== undefined) patch.category_id = input.categoryId;
    if (input.location !== undefined) patch.location = input.location;
    if (input.eventDate !== undefined) patch.event_date = input.eventDate;
    if (input.endTime !== undefined) patch.end_time = input.endTime;
    if (input.registrationDeadline !== undefined) patch.registration_deadline = input.registrationDeadline;
    if (input.capacity !== undefined) patch.capacity = input.capacity;
    if (input.skillLevel !== undefined) patch.skill_level = input.skillLevel;
    if (input.department !== undefined) patch.department = input.department;
    if (input.targetAudience !== undefined) patch.target_audience = input.targetAudience;
    if (input.agenda !== undefined) patch.agenda = input.agenda;
    if (input.resources !== undefined) patch.resources = input.resources;
    if (input.aiGenerated !== undefined) patch.ai_generated = input.aiGenerated;
    const { data, error } = await client.from("events").update(patch).eq("id", eventId).select("*").single();
    if (error || !data) throw new Error(error?.message ?? "Update failed.");
    return toEvent(data as EventRow);
  },

  async deleteEvent(eventId, organizerId) {
    const client = createBrowserSupabase();
    const { data: target } = await client.from("events").select("organizer_id").eq("id", eventId).maybeSingle();
    if (!target) throw new Error("Event not found.");
    const { data: profile } = await client.from("profiles").select("role").eq("id", organizerId).maybeSingle();
    if (target.organizer_id !== organizerId && profile?.role !== "admin") throw new Error("You can only delete your own events.");
    const { error } = await client.from("events").delete().eq("id", eventId);
    if (error) throw new Error(error.message);
  },

  async setEventStatus(eventId, status: EventStatus, rejectionReason?: string) {
    const client = createBrowserSupabase();
    const patch: Record<string, unknown> = { status };
    if (status === "rejected" && rejectionReason) patch.rejection_reason = rejectionReason;
    const { error } = await client.from("events").update(patch).eq("id", eventId);
    if (error) throw new Error(error.message);
  },

  async register(eventId, userId) {
    const client = createBrowserSupabase();
    const { data: event, error: eventError } = await client
      .from("events")
      .select("status, event_date, registration_deadline, capacity")
      .eq("id", eventId)
      .maybeSingle();
    if (eventError || !event) throw new Error("Event not found.");
    if (event.status !== "approved") throw new Error("This event is not open for registration.");
    if (!isUpcoming(event.event_date)) throw new Error("This event has already ended.");
    if (new Date(event.registration_deadline).getTime() < Date.now()) throw new Error("Registration for this event has closed.");
    const { count } = await client
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "registered");
    if ((count ?? 0) >= event.capacity) throw new Error("This event is full.");
    const id = uid();
    const { data, error } = await client
      .from("registrations")
      .insert({ id, event_id: eventId, user_id: userId, status: "registered", qr_code: "" })
      .select("*")
      .single();
    if (error) {
      if (/duplicate|unique/i.test(error.message)) throw new Error("You are already registered for this event.");
      throw new Error(error.message);
    }
    const row = data as RegistrationRow;
    const payload = encodeURIComponent(
      btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, r: row.id, e: eventId, u: userId, ts: Date.now() }))))
    );
    const { data: final, error: updateError } = await client
      .from("registrations")
      .update({ qr_code: payload })
      .eq("id", row.id)
      .select("*")
      .single();
    if (updateError || !final) throw new Error(updateError?.message ?? "Register failed.");
    return {
      id: (final as RegistrationRow).id,
      eventId: (final as RegistrationRow).event_id,
      userId: (final as RegistrationRow).user_id,
      status: (final as RegistrationRow).status,
      qrPayload: (final as RegistrationRow).qr_code,
      createdAt: (final as RegistrationRow).created_at,
    };
  },

  async cancelRegistration(registrationId, userId) {
    const client = createBrowserSupabase();
    const { data: target } = await client.from("registrations").select("user_id").eq("id", registrationId).maybeSingle();
    if (!target) throw new Error("Registration not found.");
    if (target.user_id !== userId) throw new Error("Not your registration.");
    const { error } = await client.from("registrations").update({ status: "cancelled" }).eq("id", registrationId);
    if (error) throw new Error(error.message);
  },

  // ---- attendance ----
  async markAttendance(payload: string, organizerId: string, expectedEventId?: string): Promise<AttendanceResult> {
    const client = createBrowserSupabase();
    const { data: actor } = await client.from("profiles").select("role").eq("id", organizerId).maybeSingle();
    if (!actor || actor.role === "student") return { ok: false, message: "Only organizers or admins can scan passes." };
    let decoded: Record<string, string>;
    try {
      decoded = JSON.parse(decodeURIComponent(escape(atob(payload)))) as Record<string, string>;
    } catch {
      return { ok: false, invalid: true, message: "This QR pass is not recognized." };
    }
    const registrationId = decoded.r;
    const { data: registration } = await client
      .from("registrations")
      .select("id, event_id, user_id, profile:profiles(id, full_name)")
      .eq("id", registrationId)
      .maybeSingle();
    if (!registration) return { ok: false, invalid: true, message: "This QR pass is not recognized." };
    if (expectedEventId && registration.event_id !== expectedEventId) {
      return { ok: false, invalid: true, message: "This pass belongs to a different event." };
    }
    const { data: event } = await client.from("events").select("title, organizer_id").eq("id", registration.event_id).maybeSingle();
    if (!event) return { ok: false, invalid: true, message: "The event for this pass no longer exists." };
    if (event.organizer_id !== organizerId && actor.role !== "admin") return { ok: false, message: "You can only scan passes for your own events." };
    const { data: existing } = await client.from("attendance").select("id").eq("registration_id", registration.id).maybeSingle();
    const studentName = (registration.profile as { full_name?: string } | null)?.full_name ?? "Student";
    if (existing) return { ok: true, alreadyAttended: true, attended: true, studentName, eventTitle: event.title, message: "Attendance already recorded earlier." };
    const { error } = await client.from("attendance").insert({
      registration_id: registration.id,
      event_id: registration.event_id,
      user_id: registration.user_id,
      marked_by: organizerId,
      marked_at: new Date().toISOString(),
    });
    if (error && /duplicate|unique/i.test(error.message)) return { ok: true, alreadyAttended: true, attended: true, studentName, eventTitle: event.title, message: "Attendance already recorded earlier." };
    if (error) return { ok: false, message: error.message };
    return { ok: true, attended: true, studentName, eventTitle: event.title, message: "Attendance recorded successfully!" };
  },

  async getAttendance(eventId) {
    const client = createBrowserSupabase();
    const { data, error } = await client.from("attendance").select("*").eq("event_id", eventId);
    if (error) throw new Error(error.message);
    return ((data ?? []) as AttendanceRow[]).map((r) => ({
      id: r.id,
      registrationId: r.registration_id,
      eventId: r.event_id,
      userId: r.user_id,
      markedBy: r.marked_by,
      markedAt: r.marked_at,
    }));
  },

  async getMyAttendance(userId) {
    const client = createBrowserSupabase();
    const { data, error } = await client.from("attendance").select("event_id, marked_at").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return ((data ?? []) as { event_id: string; marked_at: string }[]).map((r) => ({
      eventId: r.event_id,
      markedAt: r.marked_at,
    }));
  },

  // ---- conflicts ----
  async detectConflicts(candidate) {
    const client = createBrowserSupabase();
    const { data } = await client.from("events").select("id, title, location, event_date, end_time, target_audience, department, skill_level, status").eq("status", "approved");
    const rows = (data ?? []) as EventRow[];
    const candidateEvent = { ...candidate, status: "approved" as const } as EventRecord;
    return detectConflicts(candidateEvent, rows.map((r) => ({
      id: r.id,
      title: r.title,
      location: r.location,
      eventDate: r.event_date,
      endTime: r.end_time,
      targetAudience: r.target_audience,
      department: r.department,
      skillLevel: r.skill_level,
      status: r.status,
    })));
  },

  async listConflicts() {
    const client = createBrowserSupabase();
    const { data } = await client.from("events").select("id, title, location, event_date, end_time, target_audience, department, skill_level, status").in("status", ["approved", "pending"]);
    const rows = (data ?? []) as EventRow[];
    return rows.flatMap((row) => detectConflicts(
      { id: row.id, location: row.location, eventDate: row.event_date, endTime: row.end_time, targetAudience: row.target_audience, department: row.department, skillLevel: row.skill_level, status: row.status },
      rows.map((r) => ({ id: r.id, title: r.title, location: r.location, eventDate: r.event_date, endTime: r.end_time, targetAudience: r.target_audience, department: r.department, skillLevel: r.skill_level, status: r.status }))
    ));
  },

  // ---- recommendations ----
  async rankEvents(events: EventListItem[], interests: string[], previousParticipations?: string[]) {
    return rankEventsLocal(events, interests, previousParticipations);
  },
};

function rowFromProfile(profile: Profile) {
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.fullName,
    role: profile.role,
    interests: profile.interests,
    department: profile.department,
    year: profile.year,
    created_at: profile.createdAt,
  };
}

function emptyProfile(user: { id: string; email?: string }) {
  return {
    id: user.id,
    email: user.email ?? "",
    full_name: "",
    role: "student" as const,
    interests: [] as string[],
    created_at: new Date().toISOString(),
  };
}