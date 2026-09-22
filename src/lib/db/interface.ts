import type {
  AdminAnalytics,
  AppNotification,
  AttendanceRecord,
  AttendanceResult,
  Category,
  Conflict,
  EventInput,
  EventInsight,
  EventListItem,
  EventRecord,
  EventStatus,
  Feedback,
  FeedbackWithStudent,
  Profile,
  Recommendation,
  Registration,
  RegistrationWithEvent,
  SignUpInput,
} from "@/types";

export interface EventFilters {
  categoryId?: string;
  search?: string;
  status?: EventStatus;
  upcoming?: boolean;
  past?: boolean;
  mine?: boolean;
  organizerId?: string;
  department?: string;
  venue?: string;
  skillLevel?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "popularity" | "registrations";
}

export interface Stats {
  totalStudents: number;
  totalOrganizers: number;
  totalEvents: number;
  totalRegistrations: number;
  totalAttendance: number;
  pendingEvents: number;
  categories: { name: string; events: number; registrations: number }[];
}

export interface Store {
  demoMode: boolean;

  // auth
  signIn(email: string, password: string): Promise<Profile>;
  signUp(input: SignUpInput): Promise<Profile>;
  signOut(): Promise<void>;
  getSessionProfile(): Promise<Profile | null>;
  updateProfile(id: string, patch: Partial<Profile>): Promise<Profile>;

  // reads
  getCategories(): Promise<Category[]>;
  getEvents(filters?: EventFilters): Promise<EventListItem[]>;
  getEvent(id: string, userId?: string): Promise<EventListItem | null>;
  getMyRegistrations(userId: string): Promise<RegistrationWithEvent[]>;
  getRegistrations(eventId: string): Promise<
    (Registration & { profile: Profile; attended: boolean })[]
  >;
  listUsers(): Promise<Profile[]>;
  getStats(): Promise<Stats>;
  getAdminAnalytics(): Promise<AdminAnalytics>;

  // writes
  createEvent(organizerId: string, input: EventInput): Promise<EventRecord>;
  updateEvent(
    eventId: string,
    organizerId: string,
    input: Partial<EventInput>
  ): Promise<EventRecord>;
  deleteEvent(eventId: string, organizerId: string): Promise<void>;
  setEventStatus(
    eventId: string,
    status: EventStatus,
    rejectionReason?: string
  ): Promise<void>;
  register(eventId: string, userId: string): Promise<Registration>;
  cancelRegistration(registrationId: string, userId: string): Promise<void>;

  // feedback
  getFeedback(eventId: string): Promise<FeedbackWithStudent[]>;
  getMyFeedback(studentId: string): Promise<Feedback[]>;
  submitFeedback(input: {
    eventId: string;
    studentId: string;
    rating: number;
    comment: string;
  }): Promise<Feedback>;
  hasFeedback(eventId: string, studentId: string): Promise<boolean>;
  saveInsight(eventId: string, insight: Omit<EventInsight, "id" | "eventId" | "createdAt">): Promise<EventInsight>;
  getInsight(eventId: string): Promise<EventInsight | null>;

  // notifications
  getNotifications(userId: string): Promise<AppNotification[]>;
  markNotificationsRead(userId: string, ids?: string[]): Promise<void>;

  // attendance
  markAttendance(
    payload: string,
    organizerId: string,
    expectedEventId?: string
  ): Promise<AttendanceResult>;
  getAttendance(eventId: string): Promise<AttendanceRecord[]>;
  getMyAttendance(userId: string): Promise<{ eventId: string; markedAt: string }[]>;

  // conflicts
  detectConflicts(candidate: Partial<EventRecord>): Promise<Conflict[]>;
  listConflicts(): Promise<Conflict[]>;

  // recommendations (client-side candidate ranking helper)
  rankEvents(
    events: EventListItem[],
    interests: string[],
    previousParticipations?: string[]
  ): Promise<Recommendation[]>;
}

declare global {
  interface Window {
    __ccStore?: Store;
  }
}

export function isStore(x: unknown): x is Store {
  return !!x && typeof (x as Store).getEvents === "function";
}