import type { EventListItem, RecommendationResponse } from "@/types";
import { recommendEvents } from "@/lib/recommend";

export async function POST(request: Request): Promise<Response> {
  const json = (await request.json().catch(() => null)) as {
    interests?: string[];
    events?: EventListItem[];
  } | null;

  if (!json || !Array.isArray(json.events) || !Array.isArray(json.interests)) {
    return Response.json(
      { error: "Missing required fields: interests and events." },
      { status: 400 }
    );
  }

  const result: RecommendationResponse = await recommendEvents(
    json.interests,
    json.events
  );

  return Response.json(result);
}