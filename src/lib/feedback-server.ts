import { createHash } from "crypto";
import {
  FEEDBACK_DAILY_LIMIT,
  FEEDBACK_EMAIL,
  getLocalDateKey,
} from "@/lib/feedback";

type Bucket = {
  count: number;
  dateKey: string;
};

/** Process-local counters (best-effort on serverless; client also enforces). */
const buckets = new Map<string, Bucket>();

export function getFeedbackToAddress(): string {
  return (
    process.env.FEEDBACK_TO_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_FEEDBACK_EMAIL?.trim() ||
    FEEDBACK_EMAIL
  );
}

export function getFeedbackFromAddress(): string {
  return (
    process.env.FEEDBACK_FROM_EMAIL?.trim() ||
    "Hangul Hour <onboarding@resend.dev>"
  );
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

function touchBucket(key: string, today: string): Bucket {
  const existing = buckets.get(key);
  if (!existing || existing.dateKey !== today) {
    const fresh = { dateKey: today, count: 0 };
    buckets.set(key, fresh);
    return fresh;
  }
  return existing;
}

export function getServerFeedbackCount(keys: string[], today = getLocalDateKey()): number {
  let max = 0;
  for (const key of keys) {
    max = Math.max(max, touchBucket(key, today).count);
  }
  return max;
}

export function assertUnderFeedbackLimit(keys: string[], today = getLocalDateKey()): {
  ok: true;
  count: number;
  remaining: number;
} | {
  ok: false;
  count: number;
  remaining: 0;
  message: string;
} {
  const count = getServerFeedbackCount(keys, today);
  if (count >= FEEDBACK_DAILY_LIMIT) {
    return {
      ok: false,
      count,
      remaining: 0,
      message: `You've reached today's limit of ${FEEDBACK_DAILY_LIMIT} feedback messages. Try again tomorrow.`,
    };
  }
  return {
    ok: true,
    count,
    remaining: FEEDBACK_DAILY_LIMIT - count,
  };
}

export function recordFeedbackSend(keys: string[], today = getLocalDateKey()): number {
  let max = 0;
  for (const key of keys) {
    const bucket = touchBucket(key, today);
    bucket.count += 1;
    max = Math.max(max, bucket.count);
  }
  return max;
}

export function feedbackBucketKeys(input: {
  instanceId: string;
  ipHash?: string | null;
  today?: string;
}): string[] {
  const today = input.today ?? getLocalDateKey();
  const keys = [`instance:${today}:${input.instanceId.trim()}`];
  if (input.ipHash) keys.push(`ip:${today}:${input.ipHash}`);
  return keys;
}
