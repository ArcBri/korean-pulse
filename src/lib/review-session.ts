import {
  isDue,
  type WordProgress,
} from "@/lib/review";

function tierRank(progress: WordProgress, now: Date): number {
  if (progress.lastRating === "again") return 0;
  if (progress.lastRating === "hard") return 1;
  if (isDue(progress, now)) return 2;
  return 3;
}

function oldestReviewedMs(progress: WordProgress): number {
  if (!progress.lastReviewedAt) return 0;
  return new Date(progress.lastReviewedAt).getTime();
}

/**
 * Pick up to `limit` known words for a Review session.
 * Priority: Again → Hard → due → oldest lastReviewedAt.
 * Within a tier, sooner nextReviewAt first.
 */
export function selectReviewWordIds(
  progressById: Record<string, WordProgress>,
  limit: number,
  now = new Date(),
): string[] {
  const known = Object.values(progressById).filter(
    (item) => item.seenCount >= 1,
  );

  known.sort((a, b) => {
    const tierDiff = tierRank(a, now) - tierRank(b, now);
    if (tierDiff !== 0) return tierDiff;

    const nextA = new Date(a.nextReviewAt).getTime();
    const nextB = new Date(b.nextReviewAt).getTime();
    if (nextA !== nextB) return nextA - nextB;

    const oldA = oldestReviewedMs(a);
    const oldB = oldestReviewedMs(b);
    if (oldA !== oldB) return oldA - oldB;

    return a.wordId.localeCompare(b.wordId);
  });

  const capped = Math.max(0, Math.floor(limit));
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of known) {
    if (seen.has(item.wordId)) continue;
    seen.add(item.wordId);
    result.push(item.wordId);
    if (result.length >= capped) break;
  }
  return result;
}

export function countEligibleReviewWords(
  progressById: Record<string, WordProgress>,
): number {
  return Object.values(progressById).filter((item) => item.seenCount >= 1)
    .length;
}
