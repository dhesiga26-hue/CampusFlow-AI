"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  LogOut,
  Menu,
  Plus,
  QrCode,
  X,
  Home,
  BarChart3,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const roleLinks: Record<string, { label: string; href: string; icon: typeof Home }[]> = {
  student: [
    { label: "Home", href: "/student", icon: Home },
    { label: "Browse Events", href: "/student/events", icon: Calendar },
    { label: "My Events", href: "/student/my-events", icon: ClipboardCheck },
  ],
  organizer: [
    { label: "Home", href: "/organizer", icon: Home },
    { label: "My Events", href: "/organizer/events", icon: Calendar },
    { label: "Scan QR", href: "/organizer/scan", icon: QrCode },
  ],
  admin: [
    { label: "Home", href: "/admin", icon: Home },
    { label: "All Events", href: "/admin/events", icon: Calendar },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Stats", href: "/admin/stats", icon: BarChart3 },
  ],
};

export default function AppHeader() {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { push } = useToast();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const base = role === "organizer" ? "/organizer" : role === "admin" ? "/admin" : "/student";
  const links = (role && roleLinks[role]) ?? roleLinks.student;

  const handleSignOut = async () => {
    await signOut();
    push("Signed out.", "info");
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href={base} className="flex items-center gap-2.5 font-bold text-slate-900">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xs font-black">
            CF
          </div>
          <span className="hidden sm:block text-sm">CampusFlow AI</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== base && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <l.icon className="size-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {role === "student" ? (
            <Link href="/student/events">
              <Button variant="gradient" size="sm" className="hidden sm:inline-flex">
                <Calendar className="size-4" />
                Discover
              </Button>
            </Link>
          ) : null}
          {role === "organizer" ? (
            <Link href="/organizer/events/new">
              <Button variant="gradient" size="sm" className="hidden sm:inline-flex">
                <Plus className="size-4" />
                New Event
              </Button>
            </Link>
          ) : null}
          <div className="hidden sm:flex items-center gap-2.5 rounded-full border border-slate-200 py-1 pl-1 pr-3">
            <Avatar name={user?.fullName ?? "U"} className="size-8" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold leading-none text-slate-900">
                {user?.fullName ?? "Guest"}
              </span>
              <Badge variant={role === "admin" ? "primary" : "secondary"} className="mt-1 w-fit text-[10px]">
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : ""}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={handleSignOut} title="Sign out">
            <LogOut className="size-4 text-slate-500" />
          </Button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setMobileOpen((p) => !p)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white p-4 md:hidden animate-fade-up">
          <div className="mb-3 flex items-center gap-3">
            <Avatar name={user?.fullName ?? "U"} className="size-10" />
            <div>
              <div className="text-sm font-semibold text-slate-900">{user?.fullName}</div>
              <Badge variant="secondary" className="mt-0.5 text-[10px]">
                {role}
              </Badge>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {links.map((l) => {
              const active = pathname === l.href || (l.href !== base && pathname.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-violet-50 text-violet-700" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <l.icon className="size-4.5" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}