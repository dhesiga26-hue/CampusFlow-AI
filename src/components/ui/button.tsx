import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-violet-600 text-white shadow-sm shadow-violet-600/25 hover:bg-violet-700 hover:shadow-md hover:shadow-violet-600/30 active:scale-[0.98]",
        secondary:
          "bg-violet-50 text-violet-700 hover:bg-violet-100 active:scale-[0.98]",
        outline:
          "border border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-700 active:scale-[0.98]",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        destructive:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:scale-[0.98]",
        success:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]",
        gradient:
          "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25 hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-violet-600/30 active:scale-[0.98]",
        link: "text-violet-600 underline-offset-4 hover:underline",
        white: "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 hover:ring-violet-300 hover:text-violet-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };