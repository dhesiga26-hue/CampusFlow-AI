import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-slate-200/70", className)} />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white p-5", className)}>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-4 h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}