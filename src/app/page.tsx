import { cookies } from "next/headers";
import { fromBase64Url } from "@/lib/utils";
import { COOKIE_SESSION, COOKIE_ROLE, DEMO_MODE } from "@/lib/config";
import type { Profile } from "@/types";
import LandingPage from "@/components/landing-page";

export default async function Home() {
  let role: Profile["role"] | null = null;

  try {
    const cookieStore = await cookies();
    const roleCookie = cookieStore.get(COOKIE_ROLE)?.value;
    if (roleCookie === "student" || roleCookie === "organizer" || roleCookie === "admin") {
      role = roleCookie;
    } else if (DEMO_MODE) {
      const sessionVal = cookieStore.get(COOKIE_SESSION)?.value;
      if (sessionVal) {
        const profile = fromBase64Url<Profile>(decodeURIComponent(sessionVal));
        if (profile?.role) role = profile.role;
      }
    }
  } catch {}

  const dashboardHref = role === "organizer"
    ? "/organizer"
    : role === "admin"
    ? "/admin"
    : "/student";

  return <LandingPage isLoggedIn={!!role} dashboardHref={dashboardHref} />;
}