"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { Input, Label, Field } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { DEMO_MODE } from "@/lib/config";

const DEMO_ACCOUNTS = [
  { label: "Demo Student", email: "student@campusflow.demo", password: "demo1234", accent: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100" },
  { label: "Demo Organizer", email: "organizer@campusflow.demo", password: "demo1234", accent: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100" },
  { label: "Demo Admin", email: "admin@campusflow.demo", password: "admin123", accent: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" },
  { label: "Demo Student 2", email: "priya.sharma@campus.edu", password: "demo1234", accent: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
];

function dashboardFor(role: string) {
  if (role === "organizer") return "/organizer";
  if (role === "admin") return "/admin";
  return "/student";
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { push } = useToast();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const profile = await signIn(email, password);
      push(`Welcome back, ${profile.fullName.split(" ")[0]}!`, "success");
      router.replace(dashboardFor(profile.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string, demoPassword: string) => {
    setError(null);
    setLoading(true);
    try {
      const profile = await signIn(demoEmail, demoPassword);
      push(`Signed in as ${profile.fullName}.`, "success");
      router.replace(dashboardFor(profile.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-up">
      <Card>
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25">
            <LogIn className="size-5" />
          </div>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Log in to your CampusFlow AI account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="mt-2">
            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                {error}
              </div>
            )}
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <span className="text-xs text-muted-foreground">Your campus account password</span>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" variant="gradient" size="lg" className="mt-2 w-full" loading={loading}>
              Log In
            </Button>
          </form>

          {DEMO_MODE ? (
            <div className="mt-6">
              <div className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5" />
                Try a demo account
              </div>
              <div className="grid gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    disabled={loading}
                    onClick={() => quickLogin(a.email, a.password)}
                    className={`rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-colors ${a.accent}`}
                  >
                    {a.label}
                    <span className="block text-xs font-normal opacity-70">{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-violet-600 hover:text-violet-700">
              Sign up free
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}