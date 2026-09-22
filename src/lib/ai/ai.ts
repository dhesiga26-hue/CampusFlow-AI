import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIFeedbackAnalysis, AICopilotPlan, Sentiment } from "@/types";
import { GEMINI_API_KEY, DEPARTMENTS } from "@/lib/config";
import { CATEGORIES, getCategory } from "@/lib/categories";

const MODEL = "gemini-2.0-flash";

function cleanJson(text: string): string {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```|(\{[\s\S]*\})|(\[[\s\S]*\])/);
  if (jsonMatch) return (jsonMatch[1] ?? jsonMatch[2] ?? jsonMatch[3] ?? trimmed).trim();
  return trimmed;
}

// ---------------------------------------------------------------------------
// AI Event Copilot
// ---------------------------------------------------------------------------

export interface CopilotRequest {
  topic: string;
  categoryId: string;
  department?: string;
}

function buildCopilotPrompt(req: CopilotRequest): string {
  const cat = getCategory(req.categoryId);
  return [
    "You are the AI Event Copilot on CampusFlow, a college event platform.",
    "Design a complete, ready-to-submit campus event plan for the topic below.",
    `Topic: "${req.topic}"`,
    `Category: ${cat.name} (${cat.description})`,
    req.department ? `Organizer department: ${req.department}` : "",
    `Return ONLY valid JSON with EXACTLY these keys: title (string), description (2-3 sentences), targetAudience (string), categoryId ("${req.categoryId}"), capacity (number 20-200), agenda (string with newlines, time-stamped sessions), resources (string what attendees should bring), department (string campus department, one of ${DEPARTMENTS.join(", ")}), promotionMessage (short social-media-format blurb), risks (array of 2-3 strings of realistic scheduling/logistics risks), preparationSteps (array of 4-5 strings of concrete organizer steps).`,
    "Be practical and specific to a college setting. No markdown, no extra text.",
  ].filter(Boolean).join("\n");
}

function fallbackCopilotPlan(req: CopilotRequest): AICopilotPlan {
  const cat = getCategory(req.categoryId);
  const title = `${req.topic.replace(/[.!?]+$/g, "")} Workshop`;
  return {
    title,
    description: `A hands-on ${cat.name.toLowerCase()} session covering fundamentals, tools and a real mini-project so students leave with something they built.`,
    targetAudience: req.department ? `${req.department} students, all years` : "Students from all departments",
    category: cat.name,
    categoryId: req.categoryId,
    capacity: 40,
    agenda: [
      "10:00 – Welcome & topic intro",
      "10:15 – Fundamentals crash course",
      "11:00 – Guided hands-on lab",
      "11:45 – Group mini-project sprint",
      "12:30 – Showcase, Q&A & wrap-up",
    ].join("\n"),
    resources: "Laptop and curiosity. All other materials provided.",
    department: req.department || "CSE",
    promotionMessage: `🎉 Join our ${title}! Hands-on session, zero experience needed. Seats limited — register now on CampusFlow!`,
    risks: [
      "Venue capacity may be tight for a popular topic — book a second overflow room.",
      "Attendees may have mixed skill levels; plan a beginner understudy track.",
      "Wifi congestion during the hands-on lab; prepare offline copies of resources.",
    ],
    preparationSteps: [
      "Reserve the venue and confirm AV support at least one week ahead.",
      "Publish the event on CampusFlow and set the registration deadline.",
      "Prepare a starter repo / handout with the lab materials.",
      "Recruit 2-3 volunteer mentors from your department.",
      "Send a reminder to registered students a day before.",
    ],
    source: "fallback",
  };
}

export async function generateCopilotPlan(req: CopilotRequest): Promise<AICopilotPlan> {
  if (!GEMINI_API_KEY) return fallbackCopilotPlan(req);

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { temperature: 0.6, responseMimeType: "application/json" },
    });
    const result = await model.generateContent(buildCopilotPrompt(req));
    const text = result.response.text();
    const parsed = JSON.parse(cleanJson(text)) as Partial<AICopilotPlan>;

    if (!parsed.title || !parsed.description) return fallbackCopilotPlan(req);

    return {
      title: String(parsed.title).slice(0, 120),
      description: String(parsed.description).slice(0, 600),
      targetAudience: String(parsed.targetAudience ?? "").slice(0, 160),
      category: getCategory(req.categoryId).name,
      categoryId: req.categoryId,
      capacity: Math.max(10, Math.min(500, Number(parsed.capacity) || 40)),
      agenda: String(parsed.agenda ?? "").slice(0, 1200),
      resources: String(parsed.resources ?? "").slice(0, 500),
      department: String(parsed.department ?? req.department ?? "CSE"),
      promotionMessage: String(parsed.promotionMessage ?? "").slice(0, 400),
      risks: (Array.isArray(parsed.risks) ? parsed.risks : []).map(String).slice(0, 4),
      preparationSteps: (Array.isArray(parsed.preparationSteps) ? parsed.preparationSteps : []).map(String).slice(0, 6),
      source: "gemini",
    };
  } catch (err) {
    console.error("Gemini copilot failed, using fallback:", err);
    return fallbackCopilotPlan(req);
  }
}

export { CATEGORIES };

// ---------------------------------------------------------------------------
// AI Feedback Intelligence
// ---------------------------------------------------------------------------

export interface FeedbackAnalysisRequest {
  eventId: string;
  feedback: { rating: number; comment: string; sentiment?: Sentiment }[];
}

function sentimentOf(rating: number): Sentiment {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

const THEME_KEYWORDS: { theme: string; words: string[] }[] = [
  { theme: "Content & curriculum", words: ["content", "syllabus", "workshop", "session", "topics", "curriculum", "practical", "hands-on"] },
  { theme: "Pacing & timing", words: ["time", "pace", "rushed", "slow", "long", "short", "over ran", "breaks"] },
  { theme: "Venue & logistics", words: ["venue", "crowded", "room", "auditorium", "lab", "logistics", "wifi", "internet"] },
  { theme: "Speakers & mentorship", words: ["mentor", "speaker", "facilitator", "instructor", "panel", "guidance"] },
  { theme: "Depth & difficulty", words: ["deep", "advanced", "depth", "difficult", "easy", "basic", "beginner"] },
  { theme: "Engagement & activities", words: ["activity", "interactive", "demo", "exercise", "competition", "prize"] },
];

function fallbackFeedbackAnalysis(req: FeedbackAnalysisRequest): AIFeedbackAnalysis {
  const { eventId, feedback } = req;
  const count = feedback.length;
  const avg = count ? feedback.reduce((sum, f) => sum + f.rating, 0) / count : 0;
  const sentiments = feedback.map((f) => f.sentiment ?? sentimentOf(f.rating));
  const positiveCount = sentiments.filter((s) => s === "positive").length;
  const negativeCount = sentiments.filter((s) => s === "negative").length;
  const sentiment: Sentiment =
    positiveCount > negativeCount ? "positive" : negativeCount > positiveCount ? "negative" : "neutral";

  const positivePoints = feedback
    .filter((f) => (f.sentiment ?? sentimentOf(f.rating)) !== "negative")
    .map((f) => f.comment.trim())
    .filter(Boolean)
    .slice(0, 4);

  const issues = feedback
    .filter((f) => (f.sentiment ?? sentimentOf(f.rating)) !== "positive")
    .map((f) => f.comment.trim())
    .filter(Boolean)
    .slice(0, 4);

  const themes: string[] = [];
  const themeCount = new Map<string, number>();
  for (const item of THEME_KEYWORDS) {
    const hits = feedback.filter((f) =>
      item.words.some((w) => f.comment.toLowerCase().includes(w))
    ).length;
    if (hits >= Math.max(1, Math.floor(count / 4))) themeCount.set(item.theme, hits);
  }
  [...themeCount.entries()].sort((a, b) => b[1] - a[1]).forEach(([theme]) => themes.push(theme));
  if (themes.length === 0) themes.push("General experience");

  const recommendations: string[] = [];
  if (avg < 3.5) recommendations.push("Look at the negative feedback patterns and adjust content depth.");
  if (themes.some((t) => t.includes("Pacing"))) recommendations.push("Re-balance session timings — give the activities more breathing room.");
  if (themes.some((t) => t.includes("Venue"))) recommendations.push("Book a larger room or add overflow seating for the next edition.");
  if (negativeCount > 0 && positiveCount > negativeCount * 2) recommendations.push("Double down on the parts students praised most.");
  if (recommendations.length === 0) recommendations.push("Maintain the current format — participants were satisfied.");

  return {
    eventId,
    averageRating: Math.round(avg * 10) / 10,
    count,
    sentiment,
    summary: `${count} ${count === 1 ? "response" : "responses"} with an average rating of ${(Math.round(avg * 10) / 10).toFixed(1)}/5 (${sentiment}).`,
    positivePoints,
    issues,
    themes: themes.slice(0, 5),
    recommendations: recommendations.slice(0, 4),
    source: "fallback",
  };
}

export async function analyzeFeedback(req: FeedbackAnalysisRequest): Promise<AIFeedbackAnalysis> {
  if (!GEMINI_API_KEY || req.feedback.length === 0) return fallbackFeedbackAnalysis(req);

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
    });
    const prompt = [
      "You are the AI feedback analyst on CampusFlow, a college event platform.",
      "Summarize the participant feedback below for one event.",
      "Return ONLY valid JSON with EXACTLY these keys: summary (string), positivePoints (array of strings), issues (array of strings), themes (array of strings of recurring topics), recommendations (array of strings on how to improve the next edition).",
      "Be concise and specific to the comments.",
      "",
      "Feedback (rating, comment):",
      JSON.stringify(req.feedback.map((f) => ({ rating: f.rating, comment: f.comment }))),
    ].join("\n");

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(cleanJson(result.response.text())) as Partial<AIFeedbackAnalysis>;

    const fallback = fallbackFeedbackAnalysis(req);

    return {
      eventId: req.eventId,
      averageRating: fallback.averageRating,
      count: fallback.count,
      sentiment: fallback.sentiment,
      summary: String(parsed.summary ?? fallback.summary).slice(0, 500),
      positivePoints: (Array.isArray(parsed.positivePoints) ? parsed.positivePoints : fallback.positivePoints).map(String).slice(0, 5),
      issues: (Array.isArray(parsed.issues) ? parsed.issues : fallback.issues).map(String).slice(0, 5),
      themes: (Array.isArray(parsed.themes) ? parsed.themes : fallback.themes).map(String).slice(0, 5),
      recommendations: (Array.isArray(parsed.recommendations) ? parsed.recommendations : fallback.recommendations).map(String).slice(0, 4),
      source: "gemini",
    };
  } catch (err) {
    console.error("Gemini feedback analysis failed, using fallback:", err);
    return fallbackFeedbackAnalysis(req);
  }
}