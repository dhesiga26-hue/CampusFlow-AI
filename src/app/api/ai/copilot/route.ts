import { generateCopilotPlan } from "@/lib/ai/ai";

export async function POST(request: Request): Promise<Response> {
  const json = (await request.json().catch(() => null)) as {
    topic?: string;
    categoryId?: string;
    department?: string;
  } | null;

  if (!json || typeof json.topic !== "string" || typeof json.categoryId !== "string") {
    return Response.json({ error: "Missing required fields: topic and categoryId." }, { status: 400 });
  }

  const topic = json.topic.trim();
  if (topic.length < 3) {
    return Response.json({ error: "Topic must be at least 3 characters." }, { status: 400 });
  }

  const plan = await generateCopilotPlan({
    topic,
    categoryId: json.categoryId,
    department: typeof json.department === "string" ? json.department : undefined,
  });

  return Response.json(plan);
}