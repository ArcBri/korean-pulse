export type ReviewRating = "again" | "hard" | "good" | "easy";

export type WordProgress = {
  wordId: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  lastRating: ReviewRating | null;
  seenCount: number;
};

export type ReviewOutcome = {
  progress: WordProgress;
  nextIntervalDays: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function createInitialProgress(
  wordId: string,
  now = new Date(),
): WordProgress {
  return {
    wordId,
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewAt: now.toISOString(),
    lastReviewedAt: null,
    lastRating: null,
    seenCount: 0,
  };
}

export function applyReviewRating(
  progress: WordProgress,
  rating: ReviewRating,
  now = new Date(),
): ReviewOutcome {
  let { intervalDays, easeFactor, repetitions } = progress;

  if (rating === "again") {
    repetitions = 0;
    intervalDays = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === "hard") {
    repetitions += 1;
    intervalDays = Math.max(1, Math.round(intervalDays * 1.2) || 1);
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (rating === "good") {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 3;
    else intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
  } else {
    repetitions += 1;
    easeFactor += 0.15;
    if (repetitions === 1) intervalDays = 2;
    else if (repetitions === 2) intervalDays = 5;
    else intervalDays = Math.max(2, Math.round(intervalDays * easeFactor * 1.3));
  }

  const nextReviewAt = new Date(
    now.getTime() + intervalDays * MS_PER_DAY,
  ).toISOString();

  return {
    nextIntervalDays: intervalDays,
    progress: {
      ...progress,
      intervalDays,
      easeFactor: Number(easeFactor.toFixed(2)),
      repetitions,
      nextReviewAt,
      lastReviewedAt: now.toISOString(),
      lastRating: rating,
      seenCount: progress.seenCount + 1,
    },
  };
}

export function isDue(
  progress: WordProgress | undefined,
  now = new Date(),
): boolean {
  if (!progress) return false;
  return new Date(progress.nextReviewAt).getTime() <= now.getTime();
}

export function sortDueFirst(
  progressList: WordProgress[],
  now = new Date(),
): WordProgress[] {
  return [...progressList].sort((a, b) => {
    const aDue = isDue(a, now) ? 0 : 1;
    const bDue = isDue(b, now) ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    return (
      new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime()
    );
  });
}
