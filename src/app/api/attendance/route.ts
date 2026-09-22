import type { AttendanceResult } from "@/types";
import { getStore } from "@/lib/db";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as {
    payload?: string;
    organizerId?: string;
  } | null;

  if (!body?.payload || !body?.organizerId) {
    return Response.json(
      { ok: false, message: "Missing payload or organizerId." } satisfies AttendanceResult,
      { status: 400 }
    );
  }

  const store = getStore();
  const result = await store.markAttendance(body.payload, body.organizerId);
  return Response.json(result, { status: result.ok ? 200 : 403 });
}