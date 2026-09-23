import { NextResponse } from "next/server";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push/config";

export const runtime = "nodejs";

export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey,
  });
}
