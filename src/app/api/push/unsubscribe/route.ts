import { NextResponse } from "next/server";
import { isPushConfigured } from "@/lib/push/config";
import { deletePushSubscription } from "@/lib/push/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Background push is not configured." },
      { status: 503 },
    );
  }

  let body: { endpoint?: string };
  try {
    body = (await request.json()) as { endpoint?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  }

  await deletePushSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
