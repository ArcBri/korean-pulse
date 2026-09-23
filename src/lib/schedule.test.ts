import { describe, expect, it } from "vitest";
import {
  applyReviewRating,
  createInitialProgress,
  isDue,
} from "@/lib/review";
import {
  buildDailyPlan,
  DEFAULT_SCHEDULE,
  formatHourLabel,
  getHourSlots,
  getNextSlotDate,
} from "@/lib/schedule";

describe("review intervals", () => {
  it("resets interval on Again", () => {
    const base = createInitialProgress("gada", new Date("2026-09-23T10:00:00"));
    base.intervalDays = 4;
    base.repetitions = 3;
    const result = applyReviewRating(base, "again", new Date("2026-09-23T10:00:00"));
    expect(result.progress.intervalDays).toBe(0);
    expect(result.progress.repetitions).toBe(0);
  });

  it("expands interval on Good after first reviews", () => {
    let progress = createInitialProgress("boda", new Date("2026-09-23T09:00:00"));
    progress = applyReviewRating(progress, "good", new Date("2026-09-23T09:00:00")).progress;
    expect(progress.intervalDays).toBe(1);
    progress = applyReviewRating(progress, "good", new Date("2026-09-24T09:00:00")).progress;
    expect(progress.intervalDays).toBe(3);
    expect(isDue(progress, new Date("2026-09-25T09:00:00"))).toBe(false);
    expect(isDue(progress, new Date("2026-09-27T10:00:00"))).toBe(true);
  });
});

describe("hourly schedule", () => {
  it("builds inclusive 9–5 slots", () => {
    expect(getHourSlots(DEFAULT_SCHEDULE)).toEqual([
      9, 10, 11, 12, 13, 14, 15, 16, 17,
    ]);
    expect(formatHourLabel(9)).toBe("9:00 AM");
    expect(formatHourLabel(17)).toBe("5:00 PM");
  });

  it("finds the next local slot after the current hour", () => {
    const now = new Date("2026-09-23T10:15:00");
    const next = getNextSlotDate(now, DEFAULT_SCHEDULE);
    expect(next?.getHours()).toBe(11);
  });

  it("builds a randomized daily plan without immediate consecutive repeats when possible", () => {
    const plan = buildDailyPlan({
      settings: DEFAULT_SCHEDULE,
      progressById: {},
      existingPlan: null,
      now: new Date("2026-09-23T08:00:00"),
      random: (() => {
        let i = 0;
        const values = [0.1, 0.7, 0.3, 0.9, 0.2, 0.55, 0.4, 0.8, 0.15];
        return () => {
          const value = values[i % values.length];
          i += 1;
          return value;
        };
      })(),
    });

    expect(plan.dateKey).toBe("2026-09-23");
    expect(plan.slots).toHaveLength(9);
    expect(new Set(plan.slots.map((slot) => slot.wordId)).size).toBe(9);
  });

  it("reuses an existing plan for the same day and schedule", () => {
    const first = buildDailyPlan({
      settings: DEFAULT_SCHEDULE,
      progressById: {},
      now: new Date("2026-09-23T08:00:00"),
      random: () => 0.42,
    });
    const second = buildDailyPlan({
      settings: DEFAULT_SCHEDULE,
      progressById: {},
      existingPlan: first,
      now: new Date("2026-09-23T12:00:00"),
      random: () => 0.99,
    });
    expect(second).toEqual(first);
  });
});
