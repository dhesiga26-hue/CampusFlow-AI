import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
  {
    variants: {
      variant: {
        default: "bg-violet-50 text-violet-700 ring-violet-200",
        primary: "bg-violet-600 text-white ring-violet-600",
        secondary: "bg-slate-100 text-slate-600 ring-slate-200",
        success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        warning: "bg-amber-50 text-amber-700 ring-amber-200",
        destructive: "bg-rose-50 text-rose-700 ring-rose-200",
        info: "bg-sky-50 text-sky-700 ring-sky-200",
        outline: "bg-white text-slate-600 ring-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };