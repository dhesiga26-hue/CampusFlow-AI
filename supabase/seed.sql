-- ============================================================
-- CampusFlow AI — demo seed data
-- Run AFTER supabase/schema.sql.
--
-- Creates demo accounts directly in Supabase Auth so you can
-- sign in with:
--   student@campusflow.demo  / demo1234
--   organizer@campusflow.demo / demo1234
--   admin@campusflow.demo    / admin123
--   priya.sharma@campus.edu  / demo1234
-- ============================================================

-- ---------- Demo auth users (skip if they already exist) ----------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated',
    'organizer@campusflow.demo',
    crypt('demo1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated',
    'student@campusflow.demo',
    crypt('demo1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated',
    'priya.sharma@campus.edu',
    crypt('demo1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000004',
    'authenticated', 'authenticated',
    'admin@campusflow.demo',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}', now(), now()
  )
on conflict (id) do nothing;

-- ---------- Profiles ----------
insert into public.profiles (id, email, full_name, role, interests, department, year)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'organizer@campusflow.demo', 'Dr. Sarah Chen', 'organizer',
    '{"Artificial Intelligence","Data Science"}', 'Computer Science', null
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'student@campusflow.demo', 'Alex Rivera', 'student',
    '{"Artificial Intelligence","Web Development","Entrepreneurship"}', 'Computer Science', '3rd Year'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'priya.sharma@campus.edu', 'Priya Sharma', 'student',
    '{"Data Science","Design","Cybersecurity"}', 'Information Technology', '2nd Year'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'admin@campusflow.demo', 'Marcus Lee', 'admin',
    '{}', null, null
  )
on conflict (id) do nothing;

-- ---------- Categories ----------
insert into public.event_categories (id, name, slug, description, accent)
values
  ('8a000000-0000-0000-0000-000000000001', 'Artificial Intelligence', 'ai', 'Machine learning, LLMs, computer vision and intelligent systems.', 'from-violet-500 to-purple-600'),
  ('8a000000-0000-0000-0000-000000000002', 'Data Science', 'data-science', 'Analytics, statistics, visualization and data-driven insights.', 'from-sky-500 to-blue-600'),
  ('8a000000-0000-0000-0000-000000000003', 'Web Development', 'web-development', 'Frontend, backend, full-stack and everything on the web.', 'from-emerald-500 to-teal-600'),
  ('8a000000-0000-0000-0000-000000000004', 'Cybersecurity', 'cybersecurity', 'Ethical hacking, security operations and digital defense.', 'from-rose-500 to-red-600'),
  ('8a000000-0000-0000-0000-000000000005', 'Robotics', 'robotics', 'Hardware, automation, embedded systems and robot design.', 'from-amber-500 to-orange-600'),
  ('8a000000-0000-0000-0000-000000000006', 'Entrepreneurship', 'entrepreneurship', 'Startups, product thinking, funding and go-to-market.', 'from-fuchsia-500 to-pink-600'),
  ('8a000000-0000-0000-0000-000000000007', 'Design', 'design', 'UI/UX, product design, prototyping and design systems.', 'from-cyan-500 to-sky-600'),
  ('8a000000-0000-0000-0000-000000000008', 'Cloud Computing', 'cloud', 'Infrastructure, DevOps, containers and serverless.', 'from-indigo-500 to-blue-700'),
  ('8a000000-0000-0000-0000-000000000009', 'Programming', 'programming', 'Coding, algorithms, competitive programming and best practice.', 'from-lime-500 to-green-600')
on conflict (id) do nothing;

-- ---------- Events (relative dates keep the seed evergreen) ----------
insert into public.events (
  id, organizer_id, title, description, category_id, location,
  event_date, end_time, registration_deadline, capacity, skill_level,
  department, target_audience, agenda, resources, ai_generated,
  rejection_reason, status, created_at
)
values
  (
    '9d000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Build Your First ML Model',
    'A hands-on workshop where beginners train and evaluate their first machine learning model with scikit-learn. Bring a laptop!',
    '8a000000-0000-0000-0000-000000000001',
    'Engineering Building, Room 301',
    now() + interval '3 days', now() + interval '3 days' + interval '2 hours', now() + interval '2 days',
    50, 'beginner', 'Computer Science', 'CSE / IT 2nd & 3rd year',
    E'09:00 – Welcome & setup\n09:30 – Regression basics\n11:00 – Hands-on lab', 'Laptop with Python installed', false,
    null, 'approved', now() - interval '5 days'
  ),
  (
    '9d000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'AI & ML Workshop',
    'A full-day deep dive into modern AI: LLMs, agents and applied machine learning with live demos.',
    '8a000000-0000-0000-0000-000000000001',
    'Innovation Hall',
    now() + interval '3 days' + interval '12 hours', now() + interval '3 days' + interval '20 hours', now() + interval '2 days' + interval '6 hours',
    120, 'intermediate', 'Computer Science', 'All departments',
    E'09:00 – LLM foundations\n10:30 – Prompt patterns\n14:00 – Build an AI agent', 'Laptop, OpenAI-ready account (optional)', false,
    null, 'approved', now() - interval '8 days'
  ),
  (
    '9d000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Hackathon 2026',
    'The official 24-hour campus hackathon. Team formation, theme reveal, and mentors on site all weekend.',
    '8a000000-0000-0000-0000-000000000006',
    'Innovation Hall',
    now() + interval '3 days' + interval '12 hours', now() + interval '4 days' + interval '12 hours', now() + interval '2 days',
    200, 'all', 'All Departments', 'All students',
    E'09:00 – Theme reveal\n10:00 – Hacking begins straight through\n17:00 – Pitches + judging', 'Laptop, charger', true,
    null, 'approved', now() - interval '7 days'
  ),
  (
    '9d000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Web Performance Masterclass',
    'Learn how modern frameworks ship fast: bundlers, caching, Core Web Vitals and image optimization with real examples.',
    '8a000000-0000-0000-0000-000000000003',
    'Library, Room 412',
    now() + interval '10 days', now() + interval '10 days' + interval '3 hours', now() + interval '8 days',
    60, 'intermediate', 'Computer Science', 'CSE students',
    'Frontend fundamentals + metrics lab', 'None', false,
    null, 'approved', now() - interval '3 days'
  ),
  (
    '9d000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Data Science Bootcamp',
    'A weekend intensive covering pandas, visualization and applied statistics with real datasets.',
    '8a000000-0000-0000-0000-000000000002',
    'Student Center, Room 102',
    now() + interval '6 days' + interval '4 hours', now() + interval '6 days' + interval '12 hours', now() + interval '4 days' + interval '5 hours',
    90, 'beginner', 'Information Technology', 'IT / CSE students',
    'Intro, EDA, Viz, Mini-project', 'Jupyter installed', false,
    null, 'approved', now() - interval '6 days'
  ),
  (
    '9d000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'Coding Contest',
    'A timed competitive programming round for IT/CSE students with prizes for top finishers.',
    '8a000000-0000-0000-0000-000000000009',
    'CS Building, Room 204',
    now() + interval '6 days' + interval '4 hours', now() + interval '6 days' + interval '7 hours', now() + interval '5 days' + interval '3 hours',
    100, 'intermediate', 'Computer Science', 'IT / CSE students',
    '2 hours, 6 problems', 'Laptop with compiler', false,
    null, 'approved', now() - interval '5 days'
  ),
  (
    '9d000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'Capture The Flag: Cyber Edition',
    'A beginner-friendly CTF across web, crypto and reverse engineering. Teams of up to 3 battle for prizes.',
    '8a000000-0000-0000-0000-000000000004',
    'CS Building, Cyber Lab',
    now() + interval '14 days', now() + interval '14 days' + interval '5 hours', now() + interval '12 days',
    80, 'beginner', 'Information Technology', 'Students interested in security',
    'Web, Crypto, Reversing tracks', 'Laptop', false,
    null, 'pending', now() - interval '1 day'
  ),
  (
    '9d000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    'Cloud & DevOps Lab',
    'Deploy a containerized app with Docker and CI/CD on a cloud platform. Walk away with your own live URL.',
    '8a000000-0000-0000-0000-000000000008',
    'Engineering Building, Room 305',
    now() + interval '25 days', now() + interval '25 days' + interval '4 hours', now() + interval '23 days',
    40, 'intermediate', 'Computer Science', 'CSE / IT students',
    'Docker → CI/CD → Deploy', 'Laptop', false,
    null, 'pending', now() - interval '12 hours'
  ),
  (
    '9d000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000001',
    'Job Fair for Grads 2026',
    'Recruiters from 20+ companies meet graduating students for internships and full-time roles.',
    '8a000000-0000-0000-0000-000000000006',
    'Business School, Auditorium',
    now() + interval '35 days', now() + interval '35 days' + interval '6 hours', now() + interval '30 days',
    300, 'all', 'All Departments', 'Final year students',
    'Registration, booths, interviews', 'Resumes in hand', false,
    null, 'draft', now() - interval '2 days'
  ),
  (
    '9d000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Cyber Awareness Week',
    'A low-key talk on phishing, password hygiene and campus network safety. Ideal for all students.',
    '8a000000-0000-0000-0000-000000000004',
    'Library, Main Hall',
    now() + interval '18 days', now() + interval '18 days' + interval '2 hours', now() + interval '15 days',
    60, 'beginner', 'All Departments', 'All students',
    'Talk + live demo', 'None', false,
    'Venue requested by another department.', 'rejected', now() - interval '4 days'
  ),
  (
    '9d000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'Alumni Tech Talk',
    'A casual evening with alumni building at big tech — what they work on and how they got there.',
    '8a000000-0000-0000-0000-000000000003',
    'Student Center, Main Hall',
    now() - interval '2 days', now() - interval '2 days' + interval '3 hours', now() - interval '4 days',
    100, 'all', 'All Departments', 'All students',
    'Talks + Q&A', 'None', false,
    null, 'completed', now() - interval '10 days'
  ) on conflict (id) do nothing;

-- ---------- Registrations ----------
insert into public.registrations (id, event_id, user_id, status, qr_code, created_at)
values
  (
    'ae000000-0000-0000-0000-000000000001',
    '9d000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'registered', '', now() - interval '4 days'
  ),
  (
    'ae000000-0000-0000-0000-000000000002',
    '9d000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'registered', '', now() - interval '6 days'
  ),
  (
    'ae000000-0000-0000-0000-000000000003',
    '9d000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'registered', '', now() - interval '2 days'
  ),
  (
    'ae000000-0000-0000-0000-000000000004',
    '9d000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000002',
    'registered', '', now() - interval '9 days'
  ),
  (
    'ae000000-0000-0000-0000-000000000005',
    '9d000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000003',
    'registered', '', now() - interval '9 days'
  )
on conflict (event_id, user_id) do nothing;

-- ---------- Attendance (sampled check-ins) ----------
insert into public.attendance (id, registration_id, event_id, user_id, marked_by, marked_at)
values (
  'bc000000-0000-0000-0000-000000000001',
  'ae000000-0000-0000-0000-000000000004',
  '9d000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  now() - interval '1 day'
) on conflict (event_id, user_id) do nothing;

-- ---------- Feedback (for the completed event) ----------
insert into public.feedback (id, event_id, student_id, rating, comment, sentiment, created_at)
values
  (
    'ca000000-0000-0000-0000-000000000001',
    '9d000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000002',
    5, 'Incredible lineup of speakers. Wish it was longer!',
    'positive', now() - interval '1 day' - interval '2 hours'
  ),
  (
    'ca000000-0000-0000-0000-000000000002',
    '9d000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000003',
    4, 'Great insights, but the Q&A felt rushed.',
    'positive', now() - interval '20 hours'
  )
on conflict (event_id, student_id) do nothing;

-- ---------- Notifications (sample) ----------
insert into public.notifications (id, user_id, title, message, type, read, created_at)
values
  (
    'db000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Registration confirmed',
    'You are registered for Build Your First ML Model.',
    'registration', false, now() - interval '4 days'
  ),
  (
    'db000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Event reminder',
    'AI & ML Workshop starts in 3 days. Get your QR pass ready.',
    'reminder', false, now() - interval '1 day'
  ),
  (
    'db000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'New event submitted',
    'Cloud & DevOps Lab is awaiting your review.',
    'approval', false, now() - interval '12 hours'
  )
on conflict (id) do nothing;

-- ---------- AI insights (for the completed event) ----------
insert into public.event_ai_insights (
  id, event_id, expected_attendance, event_health_score, sentiment_summary,
  positive_points, issues, recommendations, created_at
)
values (
  'eb000000-0000-0000-0000-000000000001',
  '9d000000-0000-0000-0000-000000000011',
  78, 84,
  'Attendees were enthusiastic about the speakers and content; Q&A time was flagged as rushed.',
  ARRAY['Great speakers', 'Clear career insights', 'Well organized'],
  ARRAY['Q&A section felt rushed', 'Room reached capacity quickly'],
  ARRAY['Extend Q&A time next edition', 'Reserve a larger hall'],
  now() - interval '1 day'
) on conflict (event_id) do nothing;