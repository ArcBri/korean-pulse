import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  getLocalClock,
  isHourInSchedule,
  shouldSendHourlyReminder,
} from "@/lib/push/timezone";

describe("push timezone helpers", () => {
  it("detects hours inside the study window", () => {
    expect(isHourInSchedule(9, 9, 17)).toBe(true);
    expect(isHourInSchedule(17, 9, 17)).toBe(true);
    expect(isHourInSchedule(8, 9, 17)).toBe(false);
    expect(isHourInSchedule(18, 9, 17)).toBe(false);
  });

  it("builds a stable local slot key", () => {
    const now = new Date("2026-09-23T16:05:00.000Z");
    const clock = getLocalClock(now, "UTC");
    expect(clock.dateKey).toBe("2026-09-23");
    expect(clock.hour).toBe(16);
    expect(clock.slotKey).toBe("2026-09-23T16");
  });

  it("sends once per local hour slot", () => {
    const now = new Date("2026-09-23T14:00:30.000Z");
    const first = shouldSendHourlyReminder({
      now,
      timeZone: "UTC",
      startHour: 9,
      endHour: 17,
    });
    expect(first.send).toBe(true);
    expect(first.slotKey).toBe("2026-09-23T14");

    const second = shouldSendHourlyReminder({
      now,
      timeZone: "UTC",
      startHour: 9,
      endHour: 17,
      lastNotifiedSlot: first.slotKey,
    });
    expect(second.send).toBe(false);
  });

  it("skips outside the configured window", () => {
    const now = new Date("2026-09-23T03:00:00.000Z");
    const result = shouldSendHourlyReminder({
      now,
      timeZone: "UTC",
      startHour: 9,
      endHour: 17,
    });
    expect(result.send).toBe(false);
  });
});

describe("subscription id stability", () => {
  it("hashes endpoints consistently", () => {
    const endpoint = "https://example.com/push/abc";
    const a = createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
    const b = createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
  });
});
