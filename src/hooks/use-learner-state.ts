"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  applyReviewRating,
  createInitialProgress,
  isDue,
  type ReviewRating,
} from "@/lib/review";
import {
  createDefaultLearnerState,
  loadLearnerState,
  saveLearnerState,
  type LearnerState,
} from "@/lib/persistence";
import {
  buildDailyPlan,
  getCurrentSlotHour,
  getLocalDateKey,
  getNextSlotDate,
  type ScheduleSettings,
} from "@/lib/schedule";
import { getVocabularyById } from "@/lib/vocabulary";

const listeners = new Set<() => void>();

const serverSnapshot: LearnerState = {
  ...createDefaultLearnerState(),
  dailyPlan: buildDailyPlan({
    settings: createDefaultLearnerState().settings,
    progressById: {},
    existingPlan: null,
    now: new Date(0),
    random: () => 0.42,
  }),
};

/** Must match serverSnapshot until the post-mount effect loads localStorage. */
let memoryState: LearnerState = serverSnapshot;
let initialized = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function loadClientState(): LearnerState {
  const loaded = loadLearnerState();
  const dateKey = getLocalDateKey();
  return {
    ...loaded,
    lastActiveDateKey: dateKey,
    reviewedToday:
      loaded.lastActiveDateKey === dateKey ? loaded.reviewedToday : [],
    dailyPlan: buildDailyPlan({
      settings: loaded.settings,
      progressById: loaded.progressById,
      existingPlan: loaded.dailyPlan,
    }),
  };
}

function getSnapshot(): LearnerState {
  return memoryState;
}

function getServerSnapshot(): LearnerState {
  return serverSnapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function updateLearnerState(updater: (prev: LearnerState) => LearnerState) {
  if (typeof window !== "undefined" && !initialized) {
    memoryState = loadClientState();
    initialized = true;
  }
  memoryState = updater(memoryState);
  saveLearnerState(memoryState);
  emit();
}

export function useLearnerState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [now, setNow] = useState(() => new Date(0));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!initialized) {
      memoryState = loadClientState();
      initialized = true;
      saveLearnerState(memoryState);
    }
    setNow(new Date());
    setHydrated(true);
    emit();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, [hydrated]);

  const updateSettings = useCallback((settings: Partial<ScheduleSettings>) => {
    updateLearnerState((prev) => {
      const nextSettings = { ...prev.settings, ...settings };
      return {
        ...prev,
        settings: nextSettings,
        dailyPlan: buildDailyPlan({
          settings: nextSettings,
          progressById: prev.progressById,
          existingPlan: null,
        }),
      };
    });
  }, []);

  const rateCurrentWord = useCallback((wordId: string, rating: ReviewRating) => {
    const currentNow = new Date();
    updateLearnerState((prev) => {
      const existing =
        prev.progressById[wordId] ?? createInitialProgress(wordId, currentNow);
      const { progress } = applyReviewRating(existing, rating, currentNow);
      const dateKey = getLocalDateKey(currentNow);
      const reviewedToday =
        prev.lastActiveDateKey === dateKey
          ? Array.from(new Set([...prev.reviewedToday, wordId]))
          : [wordId];

      return {
        ...prev,
        progressById: {
          ...prev.progressById,
          [wordId]: progress,
        },
        recentWordIds: [...prev.recentWordIds, wordId].slice(-20),
        reviewedToday,
        lastActiveDateKey: dateKey,
      };
    });
    // Keep due-count / countdown in sync with the rating timestamp.
    setNow(currentNow);
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = createDefaultLearnerState();
    fresh.dailyPlan = buildDailyPlan({
      settings: fresh.settings,
      progressById: {},
      existingPlan: null,
    });
    memoryState = fresh;
    initialized = true;
    saveLearnerState(fresh);
    setNow(new Date());
    emit();
  }, []);

  const derived = useMemo(() => {
    const currentHour = getCurrentSlotHour(now, state.settings);
    const currentSlot =
      currentHour === null
        ? null
        : (state.dailyPlan?.slots.find((slot) => slot.hour === currentHour) ??
          null);
    const currentWord = currentSlot
      ? getVocabularyById(currentSlot.wordId)
      : null;
    const nextSlotAt = getNextSlotDate(now, state.settings);
    const dueCount = Object.values(state.progressById).filter((item) =>
      isDue(item, now),
    ).length;

    return {
      currentHour,
      currentSlot,
      currentWord,
      nextSlotAt,
      dueCount,
      learnedCount: Object.keys(state.progressById).length,
      reviewedTodayCount: state.reviewedToday.length,
      totalSlots: state.dailyPlan?.slots.length ?? 0,
    };
  }, [state, now]);

  return {
    hydrated,
    state,
    now,
    updateSettings,
    rateCurrentWord,
    resetProgress,
    ...derived,
  };
}
