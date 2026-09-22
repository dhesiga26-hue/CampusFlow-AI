import type {
  AppNotification,
  AttendanceRecord,
  EventInsight,
  EventListItem,
  EventRecord,
  Feedback,
  Profile,
  Registration,
} from "@/types";
import { getCategory } from "@/lib/categories";
import { toBase64Url, fromBase64Url } from "@/lib/utils";
import { COOKIE_ROLE, COOKIE_SESSION } from "@/lib/config";
import { buildSeedState, type SeedState } from "@/lib/demo/seed";

export const KEYS = {
  profiles: "cc_profiles",
  events: "cc_events",
  registrations: "cc_registrations",
  attendance: "cc_attendance",
  feedback: "cc_feedback",
  notifications: "cc_notifications",
  insights: "cc_insights",
  seeded: "cc_seeded_v2",
} as const;

export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function ensureSeeded(): SeedState {
  if (readLocal(KEYS.seeded, false)) {
    return {
      profiles: readLocal<Profile[]>(KEYS.profiles, []),
      events: readLocal<EventRecord[]>(KEYS.events, []),
      registrations: readLocal<Registration[]>(KEYS.registrations, []),
      attendance: readLocal<AttendanceRecord[]>(KEYS.attendance, []),
      feedback: readLocal<Feedback[]>(KEYS.feedback, []),
      notifications: readLocal<AppNotification[]>(KEYS.notifications, []),
      insights: readLocal<EventInsight[]>(KEYS.insights, []),
      passwords: readLocal<Record<string, string>>("cc_passwords", {}),
    };
  }
  const state = buildSeedState();
  writeLocal(KEYS.profiles, state.profiles);
  writeLocal(KEYS.events, state.events);
  writeLocal(KEYS.registrations, state.registrations);
  writeLocal(KEYS.attendance, state.attendance);
  writeLocal(KEYS.feedback, state.feedback);
  writeLocal(KEYS.notifications, state.notifications);
  writeLocal(KEYS.insights, state.insights);
  writeLocal("cc_passwords", state.passwords);
  writeLocal(KEYS.seeded, true);
  return state;
}

export function getDemoSessionProfile(): Profile | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_SESSION}=`));
  if (!match) return null;
  return fromBase64Url<Profile>(match.split("=")[1]);
}

export function setDemoSession(profile: Profile) {
  const value = encodeURIComponent(toBase64Url(profile));
  const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toUTCString();
  document.cookie = `${COOKIE_SESSION}=${value}; path=/; expires=${expires}; SameSite=Lax`;
  document.cookie = `${COOKIE_ROLE}=${profile.role}; path=/; expires=${expires}; SameSite=Lax`;
}

export function clearDemoSession() {
  const past = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `${COOKIE_SESSION}=; path=/; expires=${past}`;
  document.cookie = `${COOKIE_ROLE}=; path=/; expires=${past}`;
}

export function makeEventListItem(
  event: EventRecord,
  profiles: Profile[],
  registrations: Registration[],
  attendance: AttendanceRecord[],
  userId?: string
): EventListItem {
  const org = profiles.find((p) => p.id === event.organizerId);
  return {
    ...event,
    organizer: {
      id: org?.id ?? event.organizerId,
      fullName: org?.fullName ?? "Campus Organizer",
      email: org?.email ?? "unknown",
    },
    category: getCategory(event.categoryId),
    registrationsCount: registrations.filter(
      (r) => r.eventId === event.id && r.status === "registered"
    ).length,
    attendeeCount: attendance.filter((a) => a.eventId === event.id).length,
    isRegistered: userId
      ? registrations.some(
          (r) => r.eventId === event.id && r.userId === userId && r.status === "registered"
        )
      : undefined,
  };
}

export function buildQrPayload(registrationId: string, eventId: string, userId: string): string {
  return toBase64Url({ v: 1, r: registrationId, e: eventId, u: userId, ts: Date.now() });
}

export function decodeQrPayload(payload: string): {
  registrationId?: string;
  eventId?: string;
  userId?: string;
} {
  const parsed = fromBase64Url<Record<string, string>>(payload);
  return {
    registrationId: parsed?.r,
    eventId: parsed?.e,
    userId: parsed?.u,
  };
}

export function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 80));
}

export function sortEvents(a: EventListItem, b: EventListItem): number {
  return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
}