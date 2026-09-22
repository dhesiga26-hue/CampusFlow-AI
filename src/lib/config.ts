export const COOKIE_SESSION = "cc_session";
export const COOKIE_ROLE = "cc_role";

export const INTEREST_OPTIONS = [
  "Artificial Intelligence",
  "Data Science",
  "Web Development",
  "Cybersecurity",
  "Robotics",
  "Entrepreneurship",
  "Design",
  "Cloud Computing",
  "Programming",
] as const;

export type Interest = (typeof INTEREST_OPTIONS)[number];

export const DEPARTMENTS = [
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "Mechanical",
  "Civil",
  "MBA",
  "Biotech",
] as const;

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;

export const SEED_STUDENT_EMAIL = "student@campusflow.demo";
export const SEED_ORGANIZER_EMAIL = "organizer@campusflow.demo";
export const SEED_ADMIN_EMAIL = "admin@campusflow.demo";

export const DEMO_STUDENT_PASSWORD = "demo1234";
export const DEMO_ORGANIZER_PASSWORD = "demo1234";
export const DEMO_ADMIN_PASSWORD = "admin123";

export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;