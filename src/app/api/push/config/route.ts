import { NextResponse } from "next/server";
import {
  getVapidPublicKey,
  getVapidSubject,
  isPushConfigured,
  isValidVapidSubject,
} from "@/lib/push/config";

export const runtime = "nodejs";

export async function GET() {
  const publicKey = getVapidPublicKey();
  const vapidSubject = getVapidSubject();
  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey,
    vapidSubject,
    vapidSubjectValid: isValidVapidSubject(vapidSubject),
  });
}
