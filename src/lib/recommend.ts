import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EventListItem, Recommendation, RecommendationResponse } from "@/types";
import { GEMINI_API_KEY } from "@/lib/config";
import { rankEventsLocal } from "@/lib/demo/store";

const MODEL = "gemini-2.0-flash";

function buildCandidateList(events: EventListItem[]) {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category.name,
    skillLevel: e.skillLevel,
    date: new Date(e.eventDate).toISOString().slice(0, 10),
    description: e.description.slice(0, 240),
  }));
}

function buildPrompt(interests: string[], events: EventListItem[]) {
  return [
    "You are the event-recommendation engine for CampusFlow AI, a college event platform.",
    `The student is interested in: ${interests.join(", ")}.`,
    "Rank the following upcoming events from most to least relevant to those interests.",
    "Consider the event category, description, skill level and title.",
    "Return ONLY valid JSON: an array of objects {\"eventId\": string, \"score\": number 0-100, \"reason\": string}.",
    "Include at least 3 and at most 6 events. Prefer events most aligned with the stated interests.",
    "",
    "Events:",
    JSON.stringify(buildCandidateList(events)),
  ].join("\n");
}

export async function recommendEvents(
  interests: string[],
  events: EventListItem[]
): Promise<RecommendationResponse> {
  const fallback: RecommendationResponse = {
    source: "fallback",
    recommendations: rankEventsLocal(events, interests),
  };

  if (!GEMINI_API_KEY || interests.length === 0 || events.length === 0) {
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });
    const result = await model.generateContent(buildPrompt(interests, events));
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text) as Array<{
      eventId: string;
      score: number;
      reason: string;
    }>;

    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;

    const known = new Set(events.map((e) => e.id));
    const recommendations: Recommendation[] = parsed
      .filter((r) => r && known.has(r.eventId))
      .map((r) => ({
        eventId: r.eventId,
        score: Math.max(0, Math.min(100, Number(r.score) || 0)),
        reason: String(r.reason ?? "Matches your interests").slice(0, 160),
      }))
      .slice(0, 6);

    if (recommendations.length === 0) return fallback;
    return { source: "gemini", recommendations };
  } catch (err) {
    console.error("Gemini recommendation failed, using fallback:", err);
    return fallback;
  }
}