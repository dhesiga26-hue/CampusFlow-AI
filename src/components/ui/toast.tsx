"use client";

import * as React from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = React.createContext<{
  push: (message: string, kind?: ToastKind) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const push = React.useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev.slice(-3), { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const value = React.useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-fade-up pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur",
              t.kind === "success" && "border-emerald-200 bg-emerald-50/95 text-emerald-800",
              t.kind === "error" && "border-rose-200 bg-rose-50/95 text-rose-800",
              t.kind === "info" && "border-violet-200 bg-violet-50/95 text-violet-900"
            )}
          >
            {t.kind === "success" ? (
              <CheckCircle2 className="size-4.5 shrink-0" />
            ) : t.kind === "error" ? (
              <XCircle className="size-4.5 shrink-0" />
            ) : (
              <Info className="size-4.5 shrink-0" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}