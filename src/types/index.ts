export type Role = "student" | "organizer" | "admin";
export type EventStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "all";
export type RegistrationStatus = "registered" | "cancelled";
export type Severity = "high" | "medium" | "low";
export type Demand = "high" | "medium" | "low";
export type Sentiment = "positive" | "neutral" | "negative";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  interests: string[];
  department?: string;
  year?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  accent: string;
}

export interface Organizer {
  id: string;
  fullName: string;
  email: string;
}

export interface EventRecord {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  categoryId: string;
  location: string;
  eventDate: string;
  endTime: string;
  registrationDeadline: string;
  capacity: number;
  skillLevel: SkillLevel;
  department: string;
  targetAudience: string;
  agenda: string;
  resources: string;
  aiGenerated: boolean;
  rejectionReason?: string;
  status: EventStatus;
  createdAt: string;
}

export interface EventListItem extends EventRecord {
  organizer: Organizer;
  category: Category;
  registrationsCount: number;
  attendeeCount: number;
  isRegistered?: boolean;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  qrPayload: string;
  createdAt: string;
}

export interface RegistrationWithEvent extends Registration {
  event: EventListItem;
}

export interface AttendanceRecord {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  markedBy: string;
  markedAt: string;
}

export interface Feedback {
  id: string;
  eventId: string;
  studentId: string;
  rating: number;
  comment: string;
  sentiment?: Sentiment;
  createdAt: string;
}

export interface FeedbackWithStudent extends Feedback {
  student: Profile;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | "registration"
    | "reminder"
    | "update"
    | "cancellation"
    | "attendance"
    | "feedback"
    | "approval"
    | "conflict";
  read: boolean;
  createdAt: string;
}

export interface EventInsight {
  id: string;
  eventId: string;
  expectedAttendance?: number;
  eventHealthScore?: number;
  sentimentSummary?: string;
  positivePoints?: string[];
  issues?: string[];
  recommendations?: string[];
  createdAt: string;
}

export interface Conflict {
  id: string;
  eventId: string;
  conflictingEventId: string;
  reason: string;
  severity: Severity;
  suggestedResolution: string;
  createdAt: string;
}

export interface EventInput {
  title: string;
  description: string;
  categoryId: string;
  location: string;
  eventDate: string;
  endTime: string;
  registrationDeadline: string;
  capacity: number;
  skillLevel: SkillLevel;
  department: string;
  targetAudience: string;
  agenda: string;
  resources: string;
  aiGenerated?: boolean;
}

export interface Recommendation {
  eventId: string;
  score: number;
  reason: string;
}

export interface RecommendationResponse {
  source: "gemini" | "fallback";
  recommendations: Recommendation[];
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  interests: string[];
  department?: string;
  year?: string;
}

export interface AttendanceResult {
  ok: boolean;
  message: string;
  studentName?: string;
  eventTitle?: string;
  attended?: boolean;
  alreadyAttended?: boolean;
  invalid?: boolean;
}

export interface AICopilotPlan {
  title: string;
  description: string;
  targetAudience: string;
  category: string;
  categoryId: string;
  capacity: number;
  agenda: string;
  resources: string;
  department: string;
  promotionMessage: string;
  risks: string[];
  preparationSteps: string[];
  source: "gemini" | "fallback";
}

export interface AIFeedbackAnalysis {
  eventId: string;
  averageRating: number;
  count: number;
  sentiment: Sentiment;
  summary: string;
  positivePoints: string[];
  issues: string[];
  themes: string[];
  recommendations: string[];
  source: "gemini" | "fallback";
}

export interface HealthScoreResult {
  score: number;
  status: "healthy" | "attention" | "critical";
  strengths: string[];
  concerns: string[];
  recommendations: string[];
}

export interface DemandPrediction {
  expectedAttendance: number;
  capacity: number;
  expectedUtilization: number;
  demand: Demand;
  explanation: string;
}

export interface AdminAnalytics {
  totals: {
    totalUsers: number;
    totalStudents: number;
    totalOrganizers: number;
    totalAdmins: number;
    totalEvents: number;
    activeEvents: number;
    totalRegistrations: number;
    totalAttendance: number;
    avgAttendanceRate: number;
    avgRating: number;
    pendingApprovals: number;
  };
  eventsByMonth: { month: string; count: number }[];
  registrationsByMonth: { month: string; count: number }[];
  attendanceByMonth: { month: string; count: number }[];
  eventsByCategory: { name: string; count: number }[];
  eventsByDepartment: { name: string; count: number }[];
  topEvents: {
    id: string;
    title: string;
    registrations: number;
    attendance: number;
    rating: number;
    healthScore: number;
  }[];
  needingAttention: {
    id: string;
    title: string;
    healthScore: number;
    reason: string;
  }[];
  conflicts: Conflict[];
}