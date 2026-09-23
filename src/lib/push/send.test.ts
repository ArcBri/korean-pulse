import { describe, expect, it } from "vitest";
import {
  isValidVapidSubject,
  normalizeVapidSubject,
} from "@/lib/push/config";
import { classifyWebPushError } from "@/lib/push/send";

describe("VAPID subject normalization", () => {
  it("keeps mailto and https subjects", () => {
    expect(normalizeVapidSubject("mailto:you@example.com")).toBe(
      "mailto:you@example.com",
    );
    expect(normalizeVapidSubject("https://www.hangul-hour.app")).toBe(
      "https://www.hangul-hour.app",
    );
  });

  it("prefixes bare emails with mailto:", () => {
    expect(normalizeVapidSubject("you@example.com")).toBe(
      "mailto:you@example.com",
    );
  });

  it("defaults to a hangul-hour mailto", () => {
    expect(normalizeVapidSubject(undefined)).toBe(
      "mailto:noreply@hangul-hour.app",
    );
  });

  it("validates Apple-friendly subjects", () => {
    expect(isValidVapidSubject("mailto:a@b.co")).toBe(true);
    expect(isValidVapidSubject("https://www.hangul-hour.app")).toBe(true);
    expect(isValidVapidSubject("mailto:hangul-hour@localhost")).toBe(true);
    expect(isValidVapidSubject("not-an-email")).toBe(false);
  });
});

describe("classifyWebPushError", () => {
  it("detects Apple BadJwtToken / 403 as vapid auth failure", () => {
    const failure = classifyWebPushError({
      statusCode: 403,
      body: '{"reason":"BadJwtToken"}',
      endpoint: "https://web.push.apple.com/abc",
    });
    expect(failure.reason).toBe("vapid_auth_failed");
    expect(failure.endpointHost).toBe("web.push.apple.com");
    expect(failure.statusCode).toBe(403);
  });

  it("marks 410 as expired", () => {
    const failure = classifyWebPushError({
      statusCode: 410,
      body: "Gone",
      endpoint: "https://web.push.apple.com/abc",
    });
    expect(failure.reason).toBe("subscription_expired");
  });
});
