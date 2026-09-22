import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "violet" | "sky" | "emerald" | "amber" | "rose" | "indigo";
  hint?: string;
}

const accents = {
  violet: "bg-violet-100 text-violet-700",
  sky: "bg-sky-100 text-sky-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

export function StatCard({ label, value, icon: Icon, accent = "violet", hint }: StatCardProps) {
  return (
    <div className="card-hover rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className={cn("flex size-10 items-center justify-center rounded-xl", accents[accent])}>
          <Icon className="size-5" />
        </div>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}