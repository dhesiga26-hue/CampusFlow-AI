# CampusFlow AI

Intelligent college event management for students, organizers and admins — discovery, registration, QR check-in and a full suite of AI tools built on Gemini.

Built in 24 hours for a hackathon. **Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase · Recharts** — with a zero-config demo mode.

## Features

- **Three roles** — Students discover & register · Organizers create & manage events and scan QR passes · Admins moderate approvals, monitor analytics and manage users.
- **AI Event Copilot** — Organizers describe an event idea; Gemini returns a complete plan (agenda, capacity, audience, resources, risks, promotion message) that fills the create form in one click.
- **Conflict detection** — Flags venue, audience and time clashes across the platform with severity and suggested resolutions.
- **Event health & demand prediction** — Every organizer event shows a transparent 0–100 health score, expected attendance and demand forecast built from real registration data.
- **Feedback intelligence** — Students rate & comment on attended events; organizers get AI sentiment analysis with themes, issues and recommended actions.
- **QR pass & attendance** — Registering generates a scannable QR pass; organizers check students in by camera or manual code; duplicate scans are flagged.
- **AI recommendations** — Personalized event suggestions via Google Gemini (`gemini-2.0-flash`), with a local relevance scorer fallback.
- **Admin analytics dashboard** — Recharts visualizations for events, registrations, attendance, category/department breakdown, top events, needs-attention list and active conflicts.
- **Event moderation** — Submissions go through `pending → approved / rejected (with reason)`, plus cancel/re-publish.
- **Public event browsing** — Any visitor can browse live events at `/events` without an account.
- **Secure by default** — Route-level RBAC in `src/proxy.ts`, per-row ownership checks in both stores, RLS policies in `supabase/schema.sql`.

## Quick start (demo mode — zero config)

```bash
npm install
npm run dev
```

> Demo mode is automatic when no Supabase keys are set. All data lives in your browser's localStorage — the login page has one-click fill for every demo account.

Open http://localhost:3000 and sign in with one of the demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@campusflow.demo` | `demo1234` |
| Student 2 | `priya.sharma@campus.edu` | `demo1234` |
| Organizer | `organizer@campusflow.demo` | `demo1234` |
| Admin | `admin@campusflow.demo` | `admin123` |

## Enabling the Supabase backend (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DEMO_MODE=false`
   - (optional) `GEMINI_API_KEY` for real AI generation, recommendations and feedback analysis
4. `npm run dev`

The seed creates the demo accounts inside Supabase Auth (same credentials as above).

## Scripts

```bash
npm run dev       # start dev server (Turbopack)
npm run build     # production build
npm run lint      # eslint
npx tsc --noEmit  # typecheck
```

## Architecture

```
src/
├── app/                    # App Router pages (landing, auth, role dashboards, public /events, api routes)
│   ├── proxy.ts            # Next 16 routing proxy → RBAC redirects
│   └── api/                # /api/ai/copilot · /api/ai/feedback · /api/attendance · /api/recommendations
├── components/
│   ├── ui/                 # Button, Card, Badge, Input, Toast, Skeleton, StatCard, ...
│   ├── event/              # EventCard, EventForm, CopilotPanel, EventInsights, FeedbackPanel, badges
│   └── app-shell/          # Role-aware header + auth guard layout
└── lib/
    ├── db/                 # Store interface (interface.ts) + facade (index.ts)
    ├── demo/               # localStorage store, seed, QR helpers
    ├── supabase/           # Supabase store + @supabase/ssr clients
    ├── ai/                 # Gemini copilot + feedback analysis (deterministic fallbacks)
    ├── analytics.ts        # computeHealthScore + predictDemand (pure, data-driven)
    ├── conflicts.ts        # venue / audience / time conflict detection
    └── auth.ts, catalog.ts, utils.ts, config.ts
```

**Dual-mode data layer.** Every page talks to a single `Store` interface. In demo mode it reads/writes localStorage (fast, offline-safe). With Supabase configured it queries the real backend using the same interface — pages never change.

**Next.js 16 notes.** This project uses the Next 16 conventions enforced in `AGENTS.md`: `src/proxy.ts` instead of `middleware.ts`, async `cookies()`/`params`/`searchParams`, and `eslint` directly instead of `next lint`.