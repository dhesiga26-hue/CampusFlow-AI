import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center",
        className
      )}
    >
      {Icon ? (
        <div className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
          <Icon className="size-6" />
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? (
        action.href ? (
          <Link
            href={action.href}
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "mt-2")}
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "mt-2")}
          >
            {action.label}
          </button>
        )
      ) : null}
    </div>
  );
}