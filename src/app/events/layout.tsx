"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicEventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xs font-black">
              CF
            </div>
            CampusFlow AI
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-600">
                Home
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="ghost" size="sm" className="text-slate-600">
                Events
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="gradient" size="sm">
                <Sparkles className="size-3.5" />
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 pb-20">{children}</main>
    </div>
  );
}