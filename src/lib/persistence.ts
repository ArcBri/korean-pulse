import type { WordProgress } from "@/lib/review";
import {
  DEFAULT_SCHEDULE,
  type DailyPlan,
  type ScheduleSettings,
} from "@/lib/schedule";

export const STORAGE_KEY = "hangul-hour:v1";

export type LearnerState = {
  version: 1;
  settings: ScheduleSettings;
  progressById: Record<string, WordProgress>;
  dailyPlan: DailyPlan | null;
  recentWordIds: string[];
  reviewedToday: string[];
  lastActiveDateKey: string | null;
};

export function createDefaultLearnerState(): LearnerState {
  return {
    version: 1,
    settings: { ...DEFAULT_SCHEDULE },
    progressById: {},
    dailyPlan: null,
    recentWordIds: [],
    reviewedToday: [],
    lastActiveDateKey: null,
  };
}

export function loadLearnerState(): LearnerState {
  if (typeof window === "undefined") return createDefaultLearnerState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultLearnerState();
    const parsed = JSON.parse(raw) as Partial<LearnerState>;
    return {
      ...createDefaultLearnerState(),
      ...parsed,
      version: 1,
      settings: {
        ...DEFAULT_SCHEDULE,
        ...(parsed.settings ?? {}),
      },
      progressById: parsed.progressById ?? {},
      dailyPlan: parsed.dailyPlan ?? null,
      recentWordIds: parsed.recentWordIds ?? [],
      reviewedToday: parsed.reviewedToday ?? [],
      lastActiveDateKey: parsed.lastActiveDateKey ?? null,
    };
  } catch {
    return createDefaultLearnerState();
  }
}

export function saveLearnerState(state: LearnerState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
