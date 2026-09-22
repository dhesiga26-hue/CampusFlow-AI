"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { Input, Label, Field } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { INTEREST_OPTIONS } from "@/lib/config";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const { push } = useToast();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [interests, setInterests] = React.useState<string[]>(["Web Development"]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (interests.length === 0) {
      setError("Pick at least one interest so we can recommend events.");
      return;
    }
    setLoading(true);
    try {
      const profile = await signUp({
        email,
        password,
        fullName,
        interests,
      });
      push(`Welcome to CampusFlow AI, ${profile.fullName.split(" ")[0]}!`, "success");
      router.replace("/student");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-up">
      <Card>
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25">
            <UserPlus className="size-5" />
          </div>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Join CampusFlow AI in under a minute</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Alex Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </Field>
              <Field className="sm:col-span-2">
                <Label htmlFor="email">College Email</Label>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
              <Field>
                <Label htmlFor="confirm">Confirm</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
            </div>

            <div className="mb-2 mt-1">
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-violet-500" />
                  Choose your interests
                </span>
              </Label>
              <p className="mb-2.5 text-xs text-muted-foreground">
                We&apos;ll use these for AI-powered event recommendations.
              </p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleInterest(i)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      interests.includes(i)
                        ? "border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-600/25"
                        : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600"
                    )}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" variant="gradient" size="lg" className="mt-2 w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-violet-600 hover:text-violet-700">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}