import type {
  AppNotification,
  AttendanceRecord,
  EventInsight,
  EventRecord,
  Feedback,
  Profile,
  Registration,
  SkillLevel,
} from "@/types";
import { daysFromNow } from "@/lib/utils";
import { computeHealthScore, predictDemand } from "@/lib/analytics";

export interface SeedState {
  profiles: Profile[];
  events: EventRecord[];
  registrations: Registration[];
  attendance: AttendanceRecord[];
  feedback: Feedback[];
  notifications: AppNotification[];
  insights: EventInsight[];
  passwords: Record<string, string>;
}

const PASSWORD = "demo1234";

interface EventSeed {
  title: string;
  description: string;
  categoryId: string;
  organizerId: string;
  daysOffset: number;
  startHour: number;
  endHour: number;
  skillLevel: SkillLevel;
  capacity: number;
  location: string;
  department: string;
  targetAudience: string;
  agenda: string;
  resources: string;
  status: EventRecord["status"];
  aiGenerated?: boolean;
  rejectionReason?: string;
  regCount: number;
  attendanceRate?: number; // for past events
  feedbackRate?: number; // proportion of attendees leaving feedback
}

// Deterministic pseudo-random used ONLY to keep seed data stable between runs.
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STUDENT_IDS = Array.from({ length: 20 }, (_, i) => `p-s${i + 1}`);
const DEMO_STUDENT = "p-s1";

export function buildSeedState(): SeedState {
  const passwords: Record<string, string> = {
    "admin@campusflow.demo": "admin123",
    "dean@campusflow.demo": "admin123",
    "organizer@campusflow.demo": PASSWORD,
    "marcus.lee@campusflow.demo": PASSWORD,
    "sarah.kim@campusflow.demo": PASSWORD,
  };
  STUDENT_IDS.forEach((id, i) => {
    const emails = [
      "student@campusflow.demo", "priya.sharma@campus.edu", "jamal.walker@campus.edu",
      "emma.torres@campus.edu", "david.nguyen@campus.edu", "sofia.garcia@campus.edu",
      "noah.williams@campus.edu", "mia.rodriguez@campus.edu", "liam.brown@campus.edu",
      "olivia.davis@campus.edu", "lucas.miller@campus.edu", "ava.wilson@campus.edu",
      "ethan.moore@campus.edu", "isabella.taylor@campus.edu", "mason.anderson@campus.edu",
      "amelia.thomas@campus.edu", "logan.jackson@campus.edu", "harper.white@campus.edu",
      "elijah.harris@campus.edu", "grace.martin@campus.edu",
    ];
    passwords[emails[i] ?? emails[0]] = PASSWORD;
  });

  const profiles: Profile[] = [
    { id: "p-admin-1", email: "admin@campusflow.demo", fullName: "Caleb Morgan", role: "admin", interests: [], department: "Dean Office", year: "", createdAt: daysFromNow(-70) },
    { id: "p-admin-2", email: "dean@campusflow.demo", fullName: "Dean Priya Nair", role: "admin", interests: [], department: "Dean Office", year: "", createdAt: daysFromNow(-70) },
    { id: "p-org-1", email: "organizer@campusflow.demo", fullName: "Dr. Anita Rao", role: "organizer", interests: [], department: "CSE", year: "", createdAt: daysFromNow(-55) },
    { id: "p-org-2", email: "marcus.lee@campusflow.demo", fullName: "Marcus Lee", role: "organizer", interests: [], department: "IT", year: "", createdAt: daysFromNow(-45) },
    { id: "p-org-3", email: "sarah.kim@campusflow.demo", fullName: "Sarah Kim", role: "organizer", interests: [], department: "MBA", year: "", createdAt: daysFromNow(-40) },
    { id: "p-s1", email: "student@campusflow.demo", fullName: "Alex Chen", role: "student", interests: ["Artificial Intelligence", "Data Science", "Web Development"], department: "CSE", year: "3rd Year", createdAt: daysFromNow(-30) },
    { id: "p-s2", email: "priya.sharma@campus.edu", fullName: "Priya Sharma", role: "student", interests: ["Cybersecurity", "Design"], department: "CSE", year: "2nd Year", createdAt: daysFromNow(-28) },
    { id: "p-s3", email: "jamal.walker@campus.edu", fullName: "Jamal Walker", role: "student", interests: ["Robotics", "Programming", "Artificial Intelligence"], department: "ECE", year: "3rd Year", createdAt: daysFromNow(-27) },
    { id: "p-s4", email: "emma.torres@campus.edu", fullName: "Emma Torres", role: "student", interests: ["Entrepreneurship", "Cloud Computing"], department: "MBA", year: "1st Year", createdAt: daysFromNow(-26) },
    { id: "p-s5", email: "david.nguyen@campus.edu", fullName: "David Nguyen", role: "student", interests: ["Data Science", "Programming", "Cloud Computing"], department: "CSE", year: "2nd Year", createdAt: daysFromNow(-25) },
    { id: "p-s6", email: "sofia.garcia@campus.edu", fullName: "Sofia Garcia", role: "student", interests: ["Web Development", "Design", "Artificial Intelligence"], department: "IT", year: "3rd Year", createdAt: daysFromNow(-24) },
    { id: "p-s7", email: "noah.williams@campus.edu", fullName: "Noah Williams", role: "student", interests: ["Programming", "Artificial Intelligence", "Cloud Computing"], department: "CSE", year: "4th Year", createdAt: daysFromNow(-23) },
    { id: "p-s8", email: "mia.rodriguez@campus.edu", fullName: "Mia Rodriguez", role: "student", interests: ["Data Science", "Artificial Intelligence"], department: "Biotech", year: "2nd Year", createdAt: daysFromNow(-22) },
    { id: "p-s9", email: "liam.brown@campus.edu", fullName: "Liam Brown", role: "student", interests: ["Robotics", "Programming"], department: "ECE", year: "2nd Year", createdAt: daysFromNow(-21) },
    { id: "p-s10", email: "olivia.davis@campus.edu", fullName: "Olivia Davis", role: "student", interests: ["Web Development", "Programming"], department: "CSE", year: "1st Year", createdAt: daysFromNow(-20) },
    { id: "p-s11", email: "lucas.miller@campus.edu", fullName: "Lucas Miller", role: "student", interests: ["Entrepreneurship", "Cloud Computing"], department: "MBA", year: "2nd Year", createdAt: daysFromNow(-19) },
    { id: "p-s12", email: "ava.wilson@campus.edu", fullName: "Ava Wilson", role: "student", interests: ["Cybersecurity", "Cloud Computing", "Design"], department: "IT", year: "4th Year", createdAt: daysFromNow(-18) },
    { id: "p-s13", email: "ethan.moore@campus.edu", fullName: "Ethan Moore", role: "student", interests: ["Robotics", "Artificial Intelligence"], department: "ECE", year: "3rd Year", createdAt: daysFromNow(-17) },
    { id: "p-s14", email: "isabella.taylor@campus.edu", fullName: "Isabella Taylor", role: "student", interests: ["Data Science", "Web Development"], department: "CSE", year: "3rd Year", createdAt: daysFromNow(-16) },
    { id: "p-s15", email: "mason.anderson@campus.edu", fullName: "Mason Anderson", role: "student", interests: ["Entrepreneurship", "Design"], department: "MBA", year: "1st Year", createdAt: daysFromNow(-15) },
    { id: "p-s16", email: "amelia.thomas@campus.edu", fullName: "Amelia Thomas", role: "student", interests: ["Robotics", "Programming"], department: "ECE", year: "1st Year", createdAt: daysFromNow(-14) },
    { id: "p-s17", email: "logan.jackson@campus.edu", fullName: "Logan Jackson", role: "student", interests: ["Cybersecurity", "Artificial Intelligence"], department: "CSE", year: "2nd Year", createdAt: daysFromNow(-13) },
    { id: "p-s18", email: "harper.white@campus.edu", fullName: "Harper White", role: "student", interests: ["Web Development", "Cloud Computing"], department: "IT", year: "3rd Year", createdAt: daysFromNow(-12) },
    { id: "p-s19", email: "elijah.harris@campus.edu", fullName: "Elijah Harris", role: "student", interests: ["Robotics", "Programming", "Artificial Intelligence"], department: "ECE", year: "4th Year", createdAt: daysFromNow(-11) },
    { id: "p-s20", email: "grace.martin@campus.edu", fullName: "Grace Martin", role: "student", interests: ["Data Science", "Artificial Intelligence", "Entrepreneurship"], department: "CSE", year: "4th Year", createdAt: daysFromNow(-10) },
  ];

  const eventSeeds: EventSeed[] = [
    {
      title: "AI & Machine Learning Workshop", description: "Hands-on workshop covering the foundations of machine learning. Build and evaluate your first models on real datasets, explore how LLMs work, and learn the workflow professional ML engineers use every day.\n\nBring your laptop — demo code and notebooks will be shared.",
      categoryId: "cat-ai", organizerId: "p-org-1", daysOffset: 3, startHour: 9, endHour: 13,
      skillLevel: "beginner", capacity: 60, location: "Innovation Hall", department: "CSE", targetAudience: "CSE / IT 2nd & 3rd year",
      agenda: "09:00 – Welcome & intro to ML\n09:30 – Supervised learning crash course\n10:45 – Build & evaluate your first classifier\n12:00 – LLM prompting live lab\n12:45 – Career paths in AI",
      resources: "Laptop, Python 3, Google Colab access", status: "approved", regCount: 34,
    },
    {
      title: "Hackathon 2026", description: "The flagship 24-hour campus hackathon. Team formation, theme reveal, industry mentors on site, and prizes for the top three teams. Open to all departments and skill levels.",
      categoryId: "cat-programming", organizerId: "p-org-2", daysOffset: 3, startHour: 10, endHour: 14,
      skillLevel: "all", capacity: 200, location: "Innovation Hall", department: "All", targetAudience: "All students",
      agenda: "10:00 – Theme reveal & team formation\n11:30 – Hacking begins\nDay 2 10:00 – Final submissions\nDay 2 12:00 – Judging & prize ceremony",
      resources: "Laptop, charger, student ID", status: "approved", regCount: 87,
    },
    {
      title: "Web Development Bootcamp", description: "A full-stack sprint from HTML, CSS and TypeScript to building production Next.js apps. Ship a portfolio-ready project by the end of the session.",
      categoryId: "cat-web", organizerId: "p-org-2", daysOffset: 4, startHour: 9, endHour: 17,
      skillLevel: "beginner", capacity: 80, location: "CS Lab", department: "CSE", targetAudience: "CSE / IT 1st & 2nd year",
      agenda: "09:00 – Frontend fundamentals\n11:00 – TypeScript & React\n13:30 – Backend APIs\n15:30 – Deploy to the cloud",
      resources: "Laptop with Node.js installed", status: "approved", regCount: 41,
    },
    {
      title: "Data Science Bootcamp", description: "An intermediate deep-dive into the data science workflow: cleaning messy data, exploratory analysis, statistical thinking, and storytelling with dashboards.",
      categoryId: "cat-ds", organizerId: "p-org-1", daysOffset: 6, startHour: 10, endHour: 13,
      skillLevel: "intermediate", capacity: 50, location: "Data Lab", department: "CSE", targetAudience: "CSE 2nd Year",
      agenda: "10:00 – Pandas + SQL for analysis\n11:00 – A/B testing essentials\n12:00 – Data storytelling workshop",
      resources: "Laptop, Kaggle account", status: "approved", regCount: 16,
    },
    {
      title: "Coding Contest", description: "A fast-paced competitive programming contest across difficulty tiers. Climb the live leaderboard and win interview referrals from sponsor companies.",
      categoryId: "cat-programming", organizerId: "p-org-3", daysOffset: 6, startHour: 11, endHour: 14,
      skillLevel: "all", capacity: 100, location: "Programming Arena", department: "CSE", targetAudience: "CSE 2nd Year",
      agenda: "11:00 – Contest begins\n13:30 – Scoreboard closes\n13:45 – Solution walkthrough & prizes",
      resources: "Laptop, stable internet", status: "approved", regCount: 40,
    },
    {
      title: "Cybersecurity Awareness Session", description: "An interactive session on security fundamentals: spotting phishing, credential hygiene, ethical hacking basics, and how SOC careers actually work.",
      categoryId: "cat-cyber", organizerId: "p-org-2", daysOffset: 8, startHour: 10, endHour: 12,
      skillLevel: "all", capacity: 120, location: "Main Auditorium", department: "All", targetAudience: "All students",
      agenda: "10:00 – Phishing live demo\n10:40 – Credential hygiene\n11:10 – CTF mini-challenge\n11:40 – Security careers panel",
      resources: "None required", status: "approved", regCount: 52,
    },
    {
      title: "Cloud Computing Workshop", description: "Go hands-on with cloud infrastructure: deploy containers, understand serverless, automate with CI/CD, and ship a cloud-native app.",
      categoryId: "cat-cloud", organizerId: "p-org-2", daysOffset: 8, startHour: 11, endHour: 13,
      skillLevel: "intermediate", capacity: 45, location: "Innovation Hall", department: "IT", targetAudience: "IT 3rd Year",
      agenda: "11:00 – Containerize an app\n11:40 – Deploy on serverless\n12:20 – CI/CD pipeline setup",
      resources: "Laptop, Docker Desktop", status: "approved", regCount: 14,
    },
    {
      title: "UI/UX Design Sprint", description: "Learn human-centered design in a single day. Lightning research, wireframes, a high-fidelity Figma prototype, and a constructive critique session.",
      categoryId: "cat-design", organizerId: "p-org-3", daysOffset: 5, startHour: 10, endHour: 16,
      skillLevel: "beginner", capacity: 30, location: "Design Studio", department: "IT", targetAudience: "IT / Design students",
      agenda: "10:00 – Design thinking crash course\n11:00 – Rapid wireframing\n13:30 – Figma prototyping\n15:00 – Peer critique",
      resources: "Laptop with Figma installed", status: "approved", regCount: 13,
    },
    {
      title: "Robotics Challenge", description: "Design, build and program a line-following robot under time pressure. Teams get chassis kits, microcontrollers and sensors plus lab mentorship.",
      categoryId: "cat-robotics", organizerId: "p-org-2", daysOffset: 12, startHour: 10, endHour: 14,
      skillLevel: "intermediate", capacity: 40, location: "Robotics Lab", department: "ECE", targetAudience: "ECE / Mechanical students",
      agenda: "10:00 – Team build sprint\n11:30 – Arduino + sensor programming\n13:00 – Arena runs & prizes",
      resources: "Lab kits provided", status: "approved", regCount: 12,
    },
    {
      title: "Entrepreneurship Summit", description: "Pitch your startup idea to founders and investors. Receive live feedback, workshop your deck, and compete for mentorship and seed prizes from the university incubator.",
      categoryId: "cat-entrep", organizerId: "p-org-3", daysOffset: 10, startHour: 9, endHour: 17,
      skillLevel: "all", capacity: 120, location: "Convention Center", department: "MBA", targetAudience: "MBA / prospective founders",
      agenda: "09:00 – Keynote by a founder\n10:30 – Deck-building workshop\n13:00 – Live investor panel\n15:00 – 1-min pitch rounds",
      resources: "Laptop or notebook", status: "approved", regCount: 44,
    },
    {
      title: "Tech Symposium", description: "The flagship annual symposium featuring keynotes from industry leaders, research showcases, and networking with recruiters.",
      categoryId: "cat-ai", organizerId: "p-org-1", daysOffset: 14, startHour: 9, endHour: 18,
      skillLevel: "advanced", capacity: 200, location: "Main Auditorium", department: "All", targetAudience: "Final year & researchers",
      agenda: "09:00 – Keynote on applied AI\n11:00 – Research poster showcase\n14:00 – Advanced tech talks\n16:30 – Recruiter networking",
      resources: "None required", status: "approved", regCount: 30,
    },
    {
      title: "Generative AI Bootcamp", description: "A two-day bootcamp on building with LLMs: prompt engineering, RAG pipelines, evaluation and responsible AI. Led by the CSE AI research group.",
      categoryId: "cat-ai", organizerId: "p-org-1", daysOffset: 7, startHour: 9, endHour: 13,
      skillLevel: "intermediate", capacity: 60, location: "Innovation Hall", department: "CSE", targetAudience: "CSE / IT 3rd & 4th year",
      agenda: "Day 1 – Prompt engineering mastery\nDay 1 – Build a RAG pipeline\nDay 2 – Evaluate & ship an AI feature\nDay 2 – Responsible AI review",
      resources: "Laptop, Gemini API key (free tier)", status: "pending", regCount: 0, aiGenerated: true,
    },
    {
      title: "Cyber CTF Challenge", description: "A beginner-friendly capture-the-flag across web, crypto and reverse engineering. Teams of up to three battle for prizes.",
      categoryId: "cat-cyber", organizerId: "p-org-2", daysOffset: 9, startHour: 11, endHour: 17,
      skillLevel: "beginner", capacity: 50, location: "Cyber Lab", department: "IT", targetAudience: "IT / CSE students",
      agenda: "11:00 – Challenge walkthrough\n11:30 – CTF begins\n16:30 – Scoreboard closes\n17:00 – Prizes",
      resources: "Laptop with a browser", status: "pending", regCount: 3,
    },
    {
      title: "Mini Project Expo", description: "Showcase your semester projects to peers and faculty. Winners get featured in the campus engineering magazine and a chance to present at the national expo.",
      categoryId: "cat-programming", organizerId: "p-org-3", daysOffset: 15, startHour: 10, endHour: 16,
      skillLevel: "all", capacity: 100, location: "Main Gallery", department: "All", targetAudience: "All students",
      agenda: "10:00 – Setup & registration of stalls\n11:00 – Faculty judging round 1\n14:00 – Open expo for students\n15:30 – Winners announced",
      resources: "Your project + demo setup", status: "draft", regCount: 0,
    },
    {
      title: "Campus Hackathon 2025", description: "Our flagship 24-hour hackathon. Teams shipped real products across web, AI and hardware with mentorship from industry engineers.",
      categoryId: "cat-programming", organizerId: "p-org-2", daysOffset: -30, startHour: 9, endHour: 23,
      skillLevel: "all", capacity: 120, location: "Innovation Hall", department: "All", targetAudience: "All students",
      agenda: "24-hour build sprint with mentor checkpoints", resources: "Laptop, charger", status: "completed", regCount: 38, attendanceRate: 0.82, feedbackRate: 0.6,
    },
    {
      title: "Intro to Figma & Prototyping", description: "A beginner session teaching Figma fundamentals: frames, components, auto-layout and interactive prototypes.",
      categoryId: "cat-design", organizerId: "p-org-3", daysOffset: -40, startHour: 10, endHour: 16,
      skillLevel: "beginner", capacity: 40, location: "Design Studio", department: "IT", targetAudience: "IT / Design students",
      agenda: "10:00 – Figma fundamentals\n11:30 – Auto-layout mastery\n13:30 – Interactive prototypes\n15:00 – Design cheat-sheet",
      resources: "Figma account (free)", status: "completed", regCount: 18, attendanceRate: 0.78, feedbackRate: 0.65,
    },
    {
      title: "Startup Pitch Night", description: "Students pitched startup ideas in three minutes to a panel of founders. Live feedback, networking, and snacks.",
      categoryId: "cat-entrep", organizerId: "p-org-3", daysOffset: -20, startHour: 18, endHour: 21,
      skillLevel: "all", capacity: 50, location: "Convention Center", department: "MBA", targetAudience: "MBA / prospective founders",
      agenda: "18:00 – Pitches round 1\n19:30 – Pitches round 2\n20:30 – Feedback & networking",
      resources: "3-slide deck", status: "completed", regCount: 24, attendanceRate: 0.75, feedbackRate: 0.55,
    },
    {
      title: "Product Analytics Workshop", description: "A proposal for a workshop on product analytics and experimentation. Resubmitted after scope was clarified.",
      categoryId: "cat-ds", organizerId: "p-org-1", daysOffset: 4, startHour: 10, endHour: 13,
      skillLevel: "advanced", capacity: 40, location: "Data Lab", department: "CSE", targetAudience: "CSE 4th Year",
      agenda: "TBD", resources: "TBD", status: "rejected", rejectionReason: "Depends on a software license the college has not approved. Please plan an open-source toolchain and resubmit.", regCount: 0,
    },
    {
      title: "Cloud Infra Summit", description: "A planned one-day summit on infrastructure engineering — cancelled due to venue renovation.",
      categoryId: "cat-cloud", organizerId: "p-org-2", daysOffset: 10, startHour: 9, endHour: 17,
      skillLevel: "intermediate", capacity: 80, location: "Convention Center", department: "IT", targetAudience: "IT 3rd & 4th year",
      agenda: "TBD", resources: "TBD", status: "cancelled", regCount: 0,
    },
  ];

  const events: EventRecord[] = eventSeeds.map((s, i) => ({
    id: `evt-${i + 1}`,
    organizerId: s.organizerId,
    title: s.title,
    description: s.description,
    categoryId: s.categoryId,
    location: s.location,
    eventDate: daysFromNow(s.daysOffset, s.startHour, 0),
    endTime: daysFromNow(s.daysOffset, s.endHour, 0),
    registrationDeadline: daysFromNow(s.daysOffset - 1, 20, 0),
    capacity: s.capacity,
    skillLevel: s.skillLevel,
    department: s.department,
    targetAudience: s.targetAudience,
    agenda: s.agenda,
    resources: s.resources,
    aiGenerated: s.aiGenerated ?? false,
    rejectionReason: s.rejectionReason,
    status: s.status,
    createdAt: daysFromNow(-14 - i * 3),
  }));

  const registrations: Registration[] = [];
  const attendance: AttendanceRecord[] = [];
  const feedback: Feedback[] = [];
  const insights: EventInsight[] = [];
  const notifications: AppNotification[] = [];

  const alwaysIncludeStudent = new Set([1, 2, 3, 4, 10, 15, 16, 17]); // event indices with the demo student

  eventSeeds.forEach((s, i) => {
    const rng = mulberry((i + 1) * 7919);
    const active = s.status === "approved" || s.status === "pending" || s.status === "completed";
    if (!active || s.regCount <= 0) return;

    const base = STUDENT_IDS.slice();
    if (alwaysIncludeStudent.has(i)) {
      base.splice(base.indexOf(DEMO_STUDENT), 1);
      base.unshift(DEMO_STUDENT);
    }
    for (let k = base.length - 1; k > 0; k--) {
      const j = Math.floor(rng() * (k + 1));
      [base[k], base[j]] = [base[j], base[k]];
    }
    const participants = base.slice(0, Math.min(s.regCount, base.length));

    participants.forEach((studentId, idx) => {
      const regId = `reg-${i + 1}-${idx + 1}`;
      registrations.push({
        id: regId,
        eventId: `evt-${i + 1}`,
        userId: studentId,
        status: "registered",
        qrPayload: "",
        createdAt: daysFromNow(s.daysOffset - 4 - Math.floor(rng() * 5), 12, 0),
      });
    });

    if (s.status === "completed") {
      const attendees = participants.filter(() => rng() < (s.attendanceRate ?? 0.8));
      const checkedInAt = daysFromNow(s.daysOffset, s.startHour + 1, 10);
      attendees.forEach((studentId, idx) => {
        const reg = registrations.find(
          (r) => r.eventId === `evt-${i + 1}` && r.userId === studentId
        );
        if (!reg) return;
        attendance.push({
          id: `att-${i + 1}-${idx + 1}`,
          registrationId: reg.id,
          eventId: reg.eventId,
          userId: studentId,
          markedBy: s.organizerId,
          markedAt: checkedInAt,
        });
      });

      // Feedback from a subset of attendees.
      const reviewers = attendees.filter(() => rng() < (s.feedbackRate ?? 0.5));
      reviewsFor(s.title).forEach(([studentId, rating, comment], j) => {
        if (!studentId) return;
        const reviewer = reviewers[j % Math.max(1, reviewers.length)];
        const targetId = reviewer || studentId;
        if (!targetId) return;
        feedback.push({
          id: `fb-${i + 1}-${j + 1}`,
          eventId: `evt-${i + 1}`,
          studentId: targetId,
          rating,
          comment,
          sentiment: rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative",
          createdAt: daysFromNow(s.daysOffset + 1, 18, 0),
        });
      });

      // AI insight for completed event based on real recorded data.
      const eventListItem = {
        id: `evt-${i + 1}`,
        capacity: s.capacity,
        eventDate: daysFromNow(s.daysOffset, s.startHour, 0),
        createdAt: daysFromNow(-14 - i * 3),
      };
      const eventFeedback = feedback.filter((f) => f.eventId === `evt-${i + 1}`);
      const health = computeHealthScore({
        event: eventListItem,
        registrations: registrations.filter((r) => r.eventId === `evt-${i + 1}`).length,
        attendance: attendance.filter((a) => a.eventId === `evt-${i + 1}`).length,
        feedback: eventFeedback,
        conflicts: [],
      });
      const demand = predictDemand({
        event: { ...eventListItem, category: { name: s.categoryId, id: s.categoryId } as never, status: s.status },
        registrations: registrations.filter((r) => r.eventId === `evt-${i + 1}`).length,
        historicalAttendanceRate: s.attendanceRate ?? 0.65,
        categoryPopularity: 0.5,
      });
      insights.push({
        id: `ins-${i + 1}`,
        eventId: `evt-${i + 1}`,
        eventHealthScore: health.score,
        expectedAttendance: demand.expectedAttendance,
        sentimentSummary: `${eventFeedback.length} responses, average ${eventFeedback.length ? (eventFeedback.reduce((sum, f) => sum + f.rating, 0) / eventFeedback.length).toFixed(1) : "—"} stars.`,
        positivePoints: health.strengths,
        issues: health.concerns,
        recommendations: health.recommendations,
        createdAt: daysFromNow(-1, 9, 0),
      });
    }
  });

  // Notifications for the demo student + one for the demo organizer.
  const nt = (id: string, userId: string, title: string, message: string, type: AppNotification["type"], offset: number, read = false): AppNotification => ({
    id, userId, title, message, type, read,
    createdAt: daysFromNow(offset, 18, 0),
  });
  notifications.push(
    nt("ntf-1", "p-s1", "Registration confirmed", "You're registered for AI & Machine Learning Workshop.", "registration", -2),
    nt("ntf-2", "p-s1", "Event reminder", "Hackathon 2026 starts in 3 days — don't forget your laptop!", "reminder", -1),
    nt("ntf-3", "p-s1", "Feedback reminder", "You attended Campus Hackathon 2025. Tell the organizer what you thought.", "feedback", -5),
    nt("ntf-4", "p-s1", "Attendance confirmed", "Your check-in for Campus Hackathon 2025 was recorded.", "attendance", -12, true),
    nt("ntf-5", "p-s1", "Event update", "Data Science Bootcamp moved to Data Lab (same time).", "update", -3),
    nt("ntf-6", "p-org-1", "Event approved", "AI & Machine Learning Workshop was approved and is now live.", "approval", -2),
    nt("ntf-7", "p-org-1", "Conflict detected", "AI & Machine Learning Workshop overlaps with Hackathon 2026 at Innovation Hall.", "conflict", -2),
    nt("ntf-8", "p-org-1", "Feedback received", "Generative AI Bootcamp received 6 new pieces of feedback.", "feedback", -1)
  );

  return { profiles, events, registrations, attendance, feedback, notifications, insights, passwords };
}

const REVIEW_POOL: Record<number, string[]> = {
  5: ["Excellent session — very practical and well paced.", "Loved the hands-on approach.", "Great mentorship and shared resources.", "One of the best campus events this year.", "Perfect balance of theory and practice."],
  4: ["Really useful and well organised.", "Great content, ran slightly over time.", "Good pacing and real-world examples.", "Would love a follow-up session."],
  3: ["Good overall, but the venue was crowded.", "Interesting topics, breaks were too short.", "Solid content, could use more activities."],
  2: ["Expected more depth on the advanced topics.", "Rushed at the end, hard to keep up."],
};

function reviewsFor(eventTitle: string): [string | null, number, string][] {
  const rng = mulberry(eventTitle.length * 31337);
  const count = 4 + Math.floor(rng() * 4);
  const out: [string | null, number, string][] = [];
  for (let i = 0; i < count; i++) {
    const rating = rng() < 0.55 ? 5 : rng() < 0.75 ? 4 : rng() < 0.9 ? 3 : 2;
    const pool = REVIEW_POOL[rating] ?? REVIEW_POOL[3];
    const comment = pool[Math.floor(rng() * pool.length)] ?? "";
    const student = Math.random() < 0.9 ? `p-s${1 + Math.floor(rng() * 20)}` : null;
    out.push([student, rating, comment]);
  }
  return out;
}