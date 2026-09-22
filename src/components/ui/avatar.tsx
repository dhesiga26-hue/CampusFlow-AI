import { initials, cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  className?: string;
}

const tones = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

export function Avatar({ name, className }: AvatarProps) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const tone = tones[Math.abs(hash) % tones.length];
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        tone,
        className
      )}
    >
      {initials(name) || "?"}
    </div>
  );
}