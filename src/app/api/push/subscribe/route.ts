import { NextResponse } from "next/server";
import { isPushConfigured } from "@/lib/push/config";
import { savePushSubscription } from "@/lib/push/store";
import type { PushSubscribeBody } from "@/lib/push/types";

export const runtime = "nodejs";

function clampHour(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(23, Math.max(0, Math.floor(n)));
}

export async function POST(request: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json(
      {
        error:
          "Background push is not configured. Set VAPID and Upstash Redis env vars.",
      },
      { status: 503 },
    );
  }

  let body: PushSubscribeBody;
  try {
    body = (await request.json()) as PushSubscribeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const endpoint = body.subscription?.endpoint?.trim();
  const p256dh = body.subscription?.keys?.p256dh?.trim();
  const auth = body.subscription?.keys?.auth?.trim();
  const timeZone = body.timeZone?.trim() || "UTC";
  const startHour = clampHour(body.startHour);
  const endHour = clampHour(body.endHour);
  const deviceId = body.deviceId?.trim() || null;

  if (!endpoint || !p256dh || !auth || startHour === null || endHour === null) {
    return NextResponse.json(
      { error: "Missing subscription endpoint, keys, or hours." },
      { status: 400 },
    );
  }

  if (endHour < startHour) {
    return NextResponse.json(
      { error: "endHour must be greater than or equal to startHour." },
      { status: 400 },
    );
  }

  await savePushSubscription({
    endpoint,
    keys: { p256dh, auth },
    timeZone,
    startHour,
    endHour,
    deviceId,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
