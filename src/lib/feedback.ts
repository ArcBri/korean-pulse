/**
 * Shared feedback config and client helpers.
 * Destination override: NEXT_PUBLIC_FEEDBACK_EMAIL (also used by the API).
 */

export const FEEDBACK_DAILY_LIMIT = 2;

export const FEEDBACK_EMAIL =
  process.env.NEXT_PUBLIC_FEEDBACK_EMAIL?.trim() ||
  process.env.FEEDBACK_TO_EMAIL?.trim() ||
  "tarantadonatarantula@gmail.com";

export const FEEDBACK_SUBJECT_PREFIX = "Hangul Hour feedback";

export const FEEDBACK_INSTANCE_STORAGE_KEY = "hangul-hour:feedback-instance-v1";
export const FEEDBACK_USAGE_STORAGE_KEY = "hangul-hour:feedback-usage-v1";

export type FeedbackUsage = {
  dateKey: string;
  count: number;
};

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildFeedbackMailto(input: {
  subject: string;
  message: string;
}): string {
  const subject = input.subject.trim() || FEEDBACK_SUBJECT_PREFIX;
  const body = input.message.trim();
  const params = new URLSearchParams({ subject, body });
  return `mailto:${FEEDBACK_EMAIL}?${params.toString()}`;
}

export function createFeedbackInstanceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `hh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readFeedbackUsage(raw: string | null, today = getLocalDateKey()): FeedbackUsage {
  if (!raw) return { dateKey: today, count: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<FeedbackUsage>;
    if (parsed.dateKey !== today) return { dateKey: today, count: 0 };
    return {
      dateKey: today,
      count: Math.max(0, Number(parsed.count) || 0),
    };
  } catch {
    return { dateKey: today, count: 0 };
  }
}

export function remainingFeedbackToday(usage: FeedbackUsage): number {
  return Math.max(0, FEEDBACK_DAILY_LIMIT - usage.count);
}
