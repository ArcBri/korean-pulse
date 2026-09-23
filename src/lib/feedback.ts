/**
 * Destination for in-app feedback (mailto).
 * Override without code changes via NEXT_PUBLIC_FEEDBACK_EMAIL.
 */
export const FEEDBACK_EMAIL =
  process.env.NEXT_PUBLIC_FEEDBACK_EMAIL?.trim() ||
  "tarantadonatarantula@gmail.com";

export const FEEDBACK_SUBJECT_PREFIX = "Hangul Hour feedback";

export function buildFeedbackMailto(input: {
  subject: string;
  message: string;
}): string {
  const subject = input.subject.trim() || FEEDBACK_SUBJECT_PREFIX;
  const body = input.message.trim();
  const params = new URLSearchParams({
    subject,
    body,
  });
  return `mailto:${FEEDBACK_EMAIL}?${params.toString()}`;
}
