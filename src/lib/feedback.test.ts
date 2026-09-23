import { describe, expect, it } from "vitest";
import {
  FEEDBACK_DAILY_LIMIT,
  FEEDBACK_EMAIL,
  buildFeedbackMailto,
  readFeedbackUsage,
  remainingFeedbackToday,
} from "@/lib/feedback";
import {
  assertUnderFeedbackLimit,
  feedbackBucketKeys,
  recordFeedbackSend,
} from "@/lib/feedback-server";

describe("feedback mailto", () => {
  it("defaults to the project feedback inbox", () => {
    expect(FEEDBACK_EMAIL).toContain("@");
  });

  it("builds a mailto URL with subject and body", () => {
    const href = buildFeedbackMailto({
      subject: "Hangul Hour feedback",
      message: "Love the hourly queue.",
    });
    expect(href.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    expect(href).toContain("subject=Hangul");
    expect(href).toContain("Love");
  });
});

describe("feedback rate limit", () => {
  it("resets client usage on a new local day", () => {
    const usage = readFeedbackUsage(
      JSON.stringify({ dateKey: "2099-01-01", count: 2 }),
      "2026-09-23",
    );
    expect(usage).toEqual({ dateKey: "2026-09-23", count: 0 });
    expect(remainingFeedbackToday(usage)).toBe(FEEDBACK_DAILY_LIMIT);
  });

  it("blocks a third server send for the same instance/day", () => {
    const today = "2026-09-23";
    const keys = feedbackBucketKeys({
      instanceId: "test-instance-a",
      ipHash: "abcd",
      today,
    });
    expect(assertUnderFeedbackLimit(keys, today).ok).toBe(true);
    recordFeedbackSend(keys, today);
    recordFeedbackSend(keys, today);
    const blocked = assertUnderFeedbackLimit(keys, today);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.message).toMatch(/limit/i);
    }
  });
});
