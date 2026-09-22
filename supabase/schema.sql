-- ============================================================
-- CampusFlow AI — Supabase schema
-- Run this in the Supabase SQL Editor before enabling the backend.
-- ============================================================

-- ---------- Helper functions (RLS-safe role checks) ----------

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_organizer()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'organizer'
  );
$$;

create or replace function public.is_student()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'student'
  );
$$;

create or replace function public.is_event_owner(event_row public.events)
returns boolean
language sql stable security definer set search_path = public as $$
  select event_row.organizer_id = auth.uid();
$$;

-- ---------- Profiles (mirrors auth.users) ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('student', 'organizer', 'admin')) default 'student',
  interests text[] not null default '{}',
  department text,
  year text,
  created_at timestamptz not null default now()
);

-- ---------- Event categories ----------

create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text not null default '',
  accent text not null default 'bg-violet-500 bg-gradient-to-r from-violet-500 to-indigo-600'
);

-- ---------- Events ----------

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  category_id uuid not null references public.event_categories(id),
  location text not null,
  event_date timestamptz not null,
  end_time timestamptz,
  registration_deadline timestamptz not null,
  capacity integer not null default 50 check (capacity > 0),
  skill_level text not null default 'all' check (skill_level in ('beginner', 'intermediate', 'advanced', 'all')),
  department text not null default '',
  target_audience text not null default '',
  agenda text not null default '',
  resources text not null default '',
  ai_generated boolean not null default false,
  rejection_reason text,
  status text not null default 'pending' check (status in ('draft', 'pending', 'approved', 'rejected', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

create index if not exists events_organizer_idx on public.events (organizer_id);
create index if not exists events_category_idx on public.events (category_id);
create index if not exists events_status_idx on public.events (status);
create index if not exists events_date_idx on public.events (event_date);
create index if not exists events_department_idx on public.events (department);

-- ---------- Registrations ----------

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'cancelled')),
  qr_code text not null default '',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists registrations_event_idx on public.registrations (event_id, status);
create index if not exists registrations_user_idx on public.registrations (user_id, status);

-- ---------- Attendance ----------

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  marked_by uuid not null references public.profiles(id),
  marked_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists attendance_event_idx on public.attendance (event_id);
create index if not exists attendance_user_idx on public.attendance (user_id);

-- ---------- Feedback ----------

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  created_at timestamptz not null default now(),
  unique (event_id, student_id)
);

create index if not exists feedback_event_idx on public.feedback (event_id);
create index if not exists feedback_student_idx on public.feedback (student_id);

-- ---------- Notifications ----------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null default '',
  type text not null default 'update' check (type in ('registration', 'reminder', 'update', 'cancellation', 'attendance', 'feedback', 'approval', 'conflict')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, read);

-- ---------- AI event insights ----------

create table if not exists public.event_ai_insights (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  expected_attendance integer,
  event_health_score integer check (event_health_score between 0 and 100),
  sentiment_summary text,
  positive_points text[] not null default '{}',
  issues text[] not null default '{}',
  recommendations text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------

alter table public.profiles enable row level security;
alter table public.event_categories enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.attendance enable row level security;
alter table public.feedback enable row level security;
alter table public.notifications enable row level security;
alter table public.event_ai_insights enable row level security;

-- profiles: everyone may read; a user may update their own row; profile created alongside auth signup
create policy "profiles_select" on public.profiles
  for select using (true);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- event_categories: readable by everyone
create policy "categories_select" on public.event_categories
  for select using (true);

-- events: organizers create; owner edits/deletes; admins moderate
create policy "events_select" on public.events
  for select using (true);
create policy "events_insert" on public.events
  for insert with check (auth.uid() = organizer_id and public.is_organizer());
create policy "events_update_owner" on public.events
  for update using (public.is_event_owner(events) or public.is_admin());
create policy "events_delete_owner" on public.events
  for delete using (public.is_event_owner(events) or public.is_admin());

-- registrations: students register; users read their own; organizers read their event's
create policy "registrations_select" on public.registrations
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = registrations.event_id and e.organizer_id = auth.uid()
    )
  );
create policy "registrations_insert" on public.registrations
  for insert with check (user_id = auth.uid());
create policy "registrations_update" on public.registrations
  for update using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = registrations.event_id and e.organizer_id = auth.uid()
    )
  );

-- attendance: organizers/admins mark; students & organizers read
create policy "attendance_select" on public.attendance
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = attendance.event_id and e.organizer_id = auth.uid()
    )
  );
create policy "attendance_insert" on public.attendance
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = attendance.event_id and e.organizer_id = auth.uid()
    )
  );

-- feedback: students submit their own; organizers/admins read; students read only their own
create policy "feedback_select" on public.feedback
  for select using (
    student_id = auth.uid()
    or public.is_admin()
    or public.is_organizer()
  );
create policy "feedback_insert" on public.feedback
  for insert with check (student_id = auth.uid());

-- notifications: read your own
create policy "notifications_select" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_update" on public.notifications
  for update using (user_id = auth.uid());

-- event_ai_insights: organizers of the event, admins
create policy "insights_select" on public.event_ai_insights
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = event_ai_insights.event_id and e.organizer_id = auth.uid()
    )
  );
create policy "insights_insert" on public.event_ai_insights
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = event_ai_insights.event_id and e.organizer_id = auth.uid()
    )
  );
create policy "insights_update" on public.event_ai_insights
  for update using (
    public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = event_ai_insights.event_id and e.organizer_id = auth.uid()
    )
  );