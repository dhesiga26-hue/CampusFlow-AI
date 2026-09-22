"use client";

import * as React from "react";
import type { Profile, SignUpInput } from "@/types";
import { getStore } from "@/lib/db";

interface AuthContextValue {
  user: Profile | null;
  role: Profile["role"] | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<Profile>;
  signUp: (input: SignUpInput) => Promise<Profile>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const profile = await getStore().getSessionProfile();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const id = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      loading,
      refresh,
      signIn: async (email, password) => {
        const profile = await getStore().signIn(email, password);
        setUser(profile);
        return profile;
      },
      signUp: async (input) => {
        const profile = await getStore().signUp(input);
        setUser(profile);
        return profile;
      },
      signOut: async () => {
        await getStore().signOut();
        setUser(null);
      },
    }),
    [user, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function useUser() {
  const { user } = useAuth();
  return user;
}