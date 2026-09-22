import { NextResponse } from "next/server";
import type { Profile } from "@/types";
import { COOKIE_ROLE, COOKIE_SESSION, DEMO_MODE } from "@/lib/config";
import { fromBase64Url } from "@/lib/utils";

const PUBLIC_PATHS = ["/login", "/register", "/events", "/api", "/_next", "/favicon.ico", "/"];

function getRoleFromRequest(request: Request): Profile["role"] | null {
  const cookieHeader = request.headers.get("cookie") ?? "";

  const roleCookie = cookieHeader
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_ROLE}=`))
    ?.split("=")[1];
  if (roleCookie === "student" || roleCookie === "organizer" || roleCookie === "admin") {
    return roleCookie;
  }

  if (DEMO_MODE) {
    const sessionCookie = cookieHeader
      .split("; ")
      .find((c) => c.startsWith(`${COOKIE_SESSION}=`))
      ?.split("=")
      ?.slice(1)
      ?.join("=");
    if (sessionCookie) {
      const profile = fromBase64Url<Profile>(decodeURIComponent(sessionCookie));
      if (profile?.role) return profile.role;
    }
  }

  return null;
}

function redirect(url: string, request: Request) {
  const base = new URL(request.url);
  const target = new URL(url, base);
  return NextResponse.redirect(target);
}

function dashboardForRole(role: Profile["role"]): string {
  if (role === "organizer") return "/organizer";
  if (role === "admin") return "/admin";
  return "/student";
}

export function proxy(request: Request) {
  const { pathname } = new URL(request.url);

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p) && pathname !== p) || pathname === "/") {
    return NextResponse.next();
  }

  const role = getRoleFromRequest(request);

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (role) return redirect(dashboardForRole(role), request);
    return NextResponse.next();
  }

  if (!role) return redirect("/login", request);

  if (pathname === "/student" && role !== "student") {
    return redirect(dashboardForRole(role), request);
  }
  if (pathname.startsWith("/student") && role !== "student") {
    return redirect(dashboardForRole(role), request);
  }
  if (pathname.startsWith("/organizer") && role !== "organizer" && role !== "admin") {
    return redirect(dashboardForRole(role), request);
  }
  if (pathname.startsWith("/admin") && role !== "admin") {
    return redirect(dashboardForRole(role), request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};