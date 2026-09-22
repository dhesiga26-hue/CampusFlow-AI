import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function daysFromNow(days: number, hour = 18, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function hoursFromNow(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours, 0, 0, 0);
  return d.toISOString();
}

export function formatDate(iso: string | Date, includeTime = true): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (!includeTime) return date;
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

export function formatDateShort(iso: string | Date): { day: string; month: string; time: string } {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return {
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
    month: d.toLocaleDateString("en-US", { month: "short" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

export function isUpcoming(iso: string): boolean {
  return new Date(iso).getTime() >= Date.now();
}

export function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Started";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${Math.max(mins, 0)}m`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function truncate(text: string, max = 140): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(3, name.length - 2))}@${domain}`;
}

export function toBase64Url(obj: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

export function fromBase64Url<T>(value: string): T | null {
  try {
    const json = decodeURIComponent(escape(atob(value)));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}