"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
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

let memoryState: LearnerState | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): LearnerState {
  if (!memoryState) {
    memoryState = loadLearnerState();
    const dateKey = getLocalDateKey();
    memoryState = {
      ...memoryState,
      lastActiveDateKey: dateKey,
      reviewedToday:
        memoryState.lastActiveDateKey === dateKey
          ? memoryState.reviewedToday
          : [],
      dailyPlan: buildDailyPlan({
        settings: memoryState.settings,
        progressById: memoryState.progressById,
        existingPlan: memoryState.dailyPlan,
      }),
    };
    saveLearnerState(memoryState);
  }
  return memoryState;
}

function getServerSnapshot(): LearnerState {
  return createDefaultLearnerState();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function updateLearnerState(
  updater: (prev: LearnerState) => LearnerState,
): void {
  const prev = getSnapshot();
  const next = updater(prev);
  memoryState = next;
  saveLearnerState(next);
  emit();
}

export function useLearnerState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [now, setNow] = useState(() => new Date());
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

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

  const rateCurrentWord = useCallback(
    (wordId: string, rating: ReviewRating) => {
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
    },
    [],
  );

  const resetProgress = useCallback(() => {
    const fresh = createDefaultLearnerState();
    fresh.dailyPlan = buildDailyPlan({
      settings: fresh.settings,
      progressById: {},
      existingPlan: null,
    });
    memoryState = fresh;
    saveLearnerState(fresh);
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
