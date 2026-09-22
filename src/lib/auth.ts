import type { Profile } from "@/types";
import { COOKIE_ROLE, COOKIE_SESSION, DEMO_MODE } from "@/lib/config";
import { fromBase64Url } from "@/lib/utils";
import { createServerSupabase } from "@/lib/supabase/server";

/** Server-side session lookup. Works in both demo and Supabase modes. */
export async function getServerSession(): Promise<{
  profile: Profile | null;
  role: Profile["role"] | null;
}> {
  const role = await getCookieRole();

  if (DEMO_MODE) {
    const sessionCookie = await getCookie(COOKIE_SESSION);
    const profile = sessionCookie
      ? fromBase64Url<Profile>(decodeURIComponent(sessionCookie))
      : null;
    return { profile, role };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { profile: null, role: null };

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, interests, created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return { profile: null, role: null };

  return {
    profile: {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      interests: data.interests ?? [],
      createdAt: data.created_at,
    },
    role: data.role as Profile["role"],
  };
}

async function getCookie(name: string): Promise<string | null> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    return store.get(name)?.value ?? null;
  } catch {
    return null;
  }
}

export async function getCookieRole(): Promise<Profile["role"] | null> {
  const value = await getCookie(COOKIE_ROLE);
  if (value === "student" || value === "organizer" || value === "admin") return value;
  return null;
}

/** Read role directly from a raw Request (used in proxy.ts). */
export function roleFromRequest(request: Request): Profile["role"] | null {
  if (DEMO_MODE) {
    const cc = request.headers
      .get("cookie")
      ?.split("; ")
      ?.find((c) => c.startsWith(`${COOKIE_SESSION}=`));
    if (cc) {
      const profile = fromBase64Url<Profile>(decodeURIComponent(cc.split("=")[1]));
      if (profile?.role) return profile.role;
    }
  }
  const roleCookie = request.headers
    .get("cookie")
    ?.split("; ")
    ?.find((c) => c.startsWith(`${COOKIE_ROLE}=`));
  if (!roleCookie) return null;
  const role = roleCookie.split("=")[1];
  return role === "student" || role === "organizer" || role === "admin" ? role : null;
}