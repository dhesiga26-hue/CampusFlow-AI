"use client";

import Link from "next/link";
import React from "react";
import {
  Calendar,
  QrCode,
  Sparkles,
  Users,
  Shield,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Zap,
  Bot,
  Clock,
  Star,
  ChevronRight,
  Target,
  Globe,
  Rocket,
  AlertTriangle,
  FileSpreadsheet,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  isLoggedIn: boolean;
  dashboardHref: string;
}

const FEATURES = [
  { icon: Calendar, title: "Discover Events", desc: "Browse all campus events with smart filters by department, venue, date and audience." },
  { icon: QrCode, title: "QR Check-In", desc: "Get a unique digital QR pass on registration. Scan to verify attendance instantly." },
  { icon: Bot, title: "AI Recommendations", desc: "Personalized event picks powered by Gemini AI, based on your interests and history." },
  { icon: Target, title: "AI Event Copilot", desc: "Organizers describe a topic and get a complete event plan — agenda, capacity, risks and prep steps." },
  { icon: AlertTriangle, title: "Conflict Detection", desc: "The system flags venue, audience and time clashes before they happen." },
  { icon: BarChart3, title: "Admin Analytics", desc: "Live charts on registrations, attendance, category performance and event health scores." },
  { icon: MessageCircle, title: "Feedback Intelligence", desc: "AI-powered sentiment analysis of participant feedback — themes, issues and actionable recommendations." },
  { icon: Users, title: "Organizer Dashboard", desc: "Create events, manage registrations, scan passes and monitor health in real time." },
];

const STEPS = [
  { num: "1", title: "Sign Up", desc: "Create your student account and pick your interests.", icon: Target },
  { num: "2", title: "Register", desc: "Find an event you like and register with one click.", icon: Calendar },
  { num: "3", title: "Attend", desc: "Show your QR pass at the door. Attendance recorded instantly.", icon: QrCode },
];

const STATS = [
  { value: "500+", label: "Students", icon: Users },
  { value: "50+", label: "Events", icon: Calendar },
  { value: "95%", label: "Check-In Rate", icon: CheckCircle2 },
  { value: "4.8", label: "Avg Rating", icon: Star },
];

const PROBLEMS = [
  { icon: MessageCircle, text: "Events shared in scattered WhatsApp groups" },
  { icon: FileSpreadsheet, text: "Manual Google Forms with no tracking" },
  { icon: AlertTriangle, text: "Students miss deadlines and forget events" },
  { icon: Clock, text: "Paper sign-ins and broken attendance sheets" },
];

export default function LandingPage({ isLoggedIn, dashboardHref }: Props) {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xs font-black">
              CF
            </div>
            CampusFlow AI
          </Link>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link href={dashboardHref}>
                <Button variant="gradient" size="sm">
                  Dashboard
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="gradient" size="sm">
                    Get Started
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-violet-200/60 via-indigo-200/40 to-sky-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-fuchsia-200/50 via-purple-200/30 to-violet-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="default" className="mb-6 inline-flex items-center gap-1.5 text-xs">
              <Sparkles className="size-3.5" />
              AI-Powered Campus Event Hub
            </Badge>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Never Miss a{" "}
              <span className="text-gradient">Campus Event</span>{" "}
              Again
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Discover, register and attend college events — all from one platform.
              AI Copilot helps organizers plan, while admins get real-time analytics and conflict alerts.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={isLoggedIn ? dashboardHref : "/register"}>
                <Button variant="gradient" size="lg" className="min-w-[200px]">
                  {isLoggedIn ? "Go to Dashboard" : "Start Free"}
                  <ArrowRight className="size-4.5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>

          {/* Hero cards */}
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="card-hover flex flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm">
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <s.icon className="size-4.5" />
                </div>
                <div className="text-xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="border-t border-slate-100 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-lg text-center">
            <Badge variant="destructive" className="mb-4">The Problem</Badge>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Managing College Events is a Mess
            </h2>
            <p className="mt-3 text-slate-600">
              Students miss opportunities. Organizers waste hours on manual work. Attendance tracking is broken.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
            {PROBLEMS.map((p) => (
              <div key={p.text} className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                  <p.icon className="size-4.5" />
                </div>
                <span className="pt-1.5 text-sm font-medium text-rose-800">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="border-t border-slate-100 bg-background py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-lg text-center">
            <Badge variant="secondary" className="mb-4">Simple Workflow</Badge>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Three Steps to Attend
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative flex flex-col items-center text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-violet-600/25">
                  {s.num}
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 max-w-[240px] text-sm text-muted-foreground">{s.desc}</p>
                {i < 2 && (
                  <ChevronRight className="absolute right-0 top-6 hidden size-5 text-violet-300 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-slate-100 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-lg text-center">
            <Badge variant="default" className="mb-4">Features</Badge>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Everything You Need in One Place
            </h2>
          </div>
          <div className="mx-auto mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card-hover rounded-2xl border border-slate-200/80 bg-white p-6"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Feature ── */}
      <section className="border-t border-slate-100 bg-background py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto grid max-w-4xl items-center gap-10 md:grid-cols-2">
            <div>
              <Badge variant="default" className="mb-4">
                <Sparkles className="size-3.5" />
                AI Feature
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Events Recommended For You
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Select your interests — Artificial Intelligence, Web Development,
                Data Science, and more. Our Gemini-powered AI engine matches
                events to your profile so you never miss what matters to you.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["AI", "Web Dev", "Cybersecurity", "Design", "Robotics", "Cloud"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                  <Sparkles className="size-4" />
                </div>
                AI Recommended For You
              </div>
              <div className="space-y-3">
                {[
                  { title: "AI & Machine Learning Workshop", cat: "Artificial Intelligence", score: "95%", color: "from-violet-500 to-purple-600" },
                  { title: "Web Development Bootcamp", cat: "Web Development", score: "92%", color: "from-emerald-500 to-teal-600" },
                  { title: "Data Science Masterclass", cat: "Data Science", score: "88%", color: "from-sky-500 to-blue-600" },
                ].map((r) => (
                  <div key={r.title} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white text-xs font-bold", r.color)}>
                      {r.score}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{r.cat}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QR Feature ── */}
      <section className="border-t border-slate-100 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto grid max-w-4xl items-center gap-10 md:grid-cols-2">
            <div className="order-2 md:order-1 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mx-auto flex w-48 flex-col items-center">
                <div className="mb-4 flex size-40 items-center justify-center rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50">
                  <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "size-3.5 rounded-sm",
                          Math.sin(i * 127.1) * 43758.5453 % 1 > 0.45 ? "bg-slate-800" : "bg-white"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <Badge variant="default">Scanned ✓ Attendance Marked</Badge>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Show this pass at the event entrance
                </p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <Badge variant="secondary" className="mb-4">
                <QrCode className="size-3.5" />
                QR Check-In
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Instant QR Attendance
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                After registering you receive a unique QR pass. Organizers scan
                it with their camera to verify attendance — no paper, no lines,
                no friction. Attendance is recorded in real time.
              </p>
              <ul className="mt-5 space-y-2.5">
                {["Unique QR code per registration", "Camera-based instant scan", "Real-time attendance tracking"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="border-t border-slate-100 bg-background py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <Badge variant="secondary" className="mb-4">Built With</Badge>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Modern Tech Stack</h2>
          <div className="mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-6">
            {[
              { name: "Next.js", icon: Zap },
              { name: "TypeScript", icon: Globe },
              { name: "Tailwind CSS", icon: Rocket },
              { name: "Supabase", icon: Shield },
              { name: "Gemini AI", icon: Bot },
              { name: "QR Codes", icon: QrCode },
            ].map((t) => (
              <div key={t.name} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
                <t.icon className="size-4 text-violet-600" />
                {t.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden border-t border-slate-100 bg-background py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 opacity-[0.05]" />
        <div className="relative mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Ready to Transform Your Campus Experience?
          </h2>
          <p className="mt-4 text-slate-600">
            Join hundreds of students already using CampusFlow AI to never miss an event.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={isLoggedIn ? dashboardHref : "/register"}>
              <Button variant="gradient" size="lg" className="min-w-[200px]">
                {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="size-4.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 text-[10px] font-black text-white">
              CF
            </div>
            © {new Date().getFullYear()} CampusFlow AI. Built for college campuses.
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Made with Next.js + Supabase + Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}