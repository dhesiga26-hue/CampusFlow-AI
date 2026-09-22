"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import AppHeader from "@/components/app-shell/header";
import { PageLoader } from "@/components/ui/spinner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const guarded = React.useRef(false);

  React.useEffect(() => {
    if (!loading && !user && !guarded.current) {
      guarded.current = true;
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageLoader label="Checking your session…" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-20">{children}</main>
    </div>
  );
}