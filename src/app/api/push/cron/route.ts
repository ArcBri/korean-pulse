import { NextResponse } from "next/server";
import { isAuthorizedCronRequest, isPushConfigured } from "@/lib/push/config";
import { sendDueHourlyPushes } from "@/lib/push/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Background push is not configured." },
      { status: 503 },
    );
  }

  try {
    const now = new Date();
    const result = await sendDueHourlyPushes(now);
    return NextResponse.json({
      ok: true,
      ranAt: now.toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("push cron failed", error);
    return NextResponse.json(
      { error: "Failed to send push notifications." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
