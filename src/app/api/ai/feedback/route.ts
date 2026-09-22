import { analyzeFeedback } from "@/lib/ai/ai";

export async function POST(request: Request): Promise<Response> {
  const json = (await request.json().catch(() => null)) as {
    eventId?: string;
    feedback?: { rating: number; comment: string }[];
  } | null;

  if (!json || typeof json.eventId !== "string" || !Array.isArray(json.feedback)) {
    return Response.json({ error: "Missing required fields: eventId and feedback." }, { status: 400 });
  }

  const analysis = await analyzeFeedback({
    eventId: json.eventId,
    feedback: json.feedback
      .filter((f) => f && typeof f.rating === "number")
      .map((f) => ({ rating: f.rating, comment: String(f.comment ?? "") })),
  });

  return Response.json(analysis);
}