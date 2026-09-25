import { describe, expect, it } from "vitest";
import {
  applyReviewRating,
  createInitialProgress,
  type WordProgress,
} from "@/lib/review";
import {
  countEligibleReviewWords,
  selectReviewWordIds,
} from "@/lib/review-session";

function progress(
  partial: Partial<WordProgress> & { wordId: string },
): WordProgress {
  const base = createInitialProgress(partial.wordId, new Date("2026-01-01T12:00:00Z"));
  return {
    ...base,
    seenCount: 1,
    ...partial,
  };
}

describe("selectReviewWordIds", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("returns empty when nothing is known", () => {
    expect(selectReviewWordIds({}, 10, now)).toEqual([]);
  });

  it("excludes seenCount < 1", () => {
    const map = {
      a: progress({ wordId: "a", seenCount: 0, lastRating: "again" }),
      b: progress({ wordId: "b", seenCount: 1, lastRating: "good" }),
    };
    expect(selectReviewWordIds(map, 10, now)).toEqual(["b"]);
  });

  it("prioritizes Again then Hard then due then older", () => {
    const map = {
      easy: progress({
        wordId: "easy",
        lastRating: "easy",
        nextReviewAt: "2026-07-01T00:00:00Z",
        lastReviewedAt: "2026-06-01T00:00:00Z",
      }),
      due: progress({
        wordId: "due",
        lastRating: "good",
        nextReviewAt: "2026-06-01T00:00:00Z",
        lastReviewedAt: "2026-06-10T00:00:00Z",
      }),
      hard: progress({
        wordId: "hard",
        lastRating: "hard",
        nextReviewAt: "2026-06-20T00:00:00Z",
      }),
      again: progress({
        wordId: "again",
        lastRating: "again",
        nextReviewAt: "2026-06-20T00:00:00Z",
      }),
    };
    expect(selectReviewWordIds(map, 10, now)).toEqual([
      "again",
      "hard",
      "due",
      "easy",
    ]);
  });

  it("respects session size cap", () => {
    const map: Record<string, WordProgress> = {};
    for (let i = 0; i < 20; i += 1) {
      map[`w${i}`] = progress({
        wordId: `w${i}`,
        lastRating: "good",
        nextReviewAt: `2026-07-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
      });
    }
    expect(selectReviewWordIds(map, 5, now)).toHaveLength(5);
    expect(selectReviewWordIds(map, 10, now)).toHaveLength(10);
  });

  it("counts eligible known words", () => {
    const map = {
      a: progress({ wordId: "a", seenCount: 1 }),
      b: progress({ wordId: "b", seenCount: 0 }),
      c: progress({ wordId: "c", seenCount: 3 }),
    };
    expect(countEligibleReviewWords(map)).toBe(2);
  });
});

describe("Review miss applies hard", () => {
  it("tightens schedule via applyReviewRating hard", () => {
    const before = createInitialProgress("x", new Date("2026-06-01T12:00:00Z"));
    const afterGood = applyReviewRating(before, "good", new Date("2026-06-01T12:00:00Z"))
      .progress;
    const afterMiss = applyReviewRating(
      afterGood,
      "hard",
      new Date("2026-06-02T12:00:00Z"),
    ).progress;
    expect(afterMiss.lastRating).toBe("hard");
    expect(afterMiss.easeFactor).toBeLessThan(afterGood.easeFactor);
  });
});
