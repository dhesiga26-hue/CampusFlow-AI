import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-1/2 items-center justify-center bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-10 lg:flex">
        <div className="max-w-md text-white">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-white">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-sm font-black backdrop-blur">
              CF
            </div>
            CampusFlow AI
          </Link>
          <h2 className="mt-8 text-3xl font-bold leading-tight">
            Your Gateway to Campus Events
          </h2>
          <p className="mt-4 text-base leading-relaxed text-violet-100">
            Discover workshops, competitions and hackathons. Register with a
            click, get your QR pass, and check in instantly.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "AI-powered event recommendations",
              "Instant QR-based attendance",
              "Real-time registration tracking",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-violet-100">
                <div className="size-1.5 rounded-full bg-violet-300" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        {children}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="underline underline-offset-4 hover:text-violet-600">
            ← Back to CampusFlow AI
          </Link>
        </div>
      </div>
    </div>
  );
}