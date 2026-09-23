import { describe, expect, it } from "vitest";
import { FEEDBACK_EMAIL, buildFeedbackMailto } from "@/lib/feedback";

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
