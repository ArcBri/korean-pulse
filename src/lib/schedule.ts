import type { WordProgress } from "@/lib/review";
import { isDue } from "@/lib/review";
import {
  getAllVocabulary,
  pickRandomWithoutImmediateRepeat,
  type VocabularyEntry,
} from "@/lib/vocabulary";

export type ScheduleSettings = {
  startHour: number;
  endHour: number;
  notificationsEnabled: boolean;
  /** Review tab session length (persisted). */
  reviewSessionSize: number;
};

export const REVIEW_SESSION_SIZE_OPTIONS = [5, 10, 15] as const;
export type ReviewSessionSize = (typeof REVIEW_SESSION_SIZE_OPTIONS)[number];

export function clampReviewSessionSize(value: number): ReviewSessionSize {
  if (value <= 5) return 5;
  if (value >= 15) return 15;
  return 10;
}

export type HourlySlot = {
  hour: number;
  label: string;
  wordId: string;
};

export type DailyPlan = {
  dateKey: string;
  slots: HourlySlot[];
};

export const DEFAULT_SCHEDULE: ScheduleSettings = {
  startHour: 9,
  endHour: 17,
  notificationsEnabled: false,
  reviewSessionSize: 10,
};

export function formatHourLabel(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:00 ${suffix}`;
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getHourSlots(settings: ScheduleSettings): number[] {
  const start = clampHour(settings.startHour);
  const end = clampHour(settings.endHour);
  if (end < start) return [];
  const hours: number[] = [];
  for (let hour = start; hour <= end; hour += 1) hours.push(hour);
  return hours;
}

function clampHour(hour: number): number {
  return Math.min(23, Math.max(0, Math.floor(hour)));
}

export function getCurrentSlotHour(
  now = new Date(),
  settings: ScheduleSettings = DEFAULT_SCHEDULE,
): number | null {
  const hour = now.getHours();
  const slots = getHourSlots(settings);
  if (slots.length === 0) return null;
  if (hour < slots[0]) return null;
  if (hour > slots[slots.length - 1]) return slots[slots.length - 1];
  return hour;
}

export function getNextSlotDate(
  now = new Date(),
  settings: ScheduleSettings = DEFAULT_SCHEDULE,
): Date | null {
  const slots = getHourSlots(settings);
  if (slots.length === 0) return null;

  const candidate = new Date(now);
  candidate.setMinutes(0, 0, 0);

  for (const hour of slots) {
    candidate.setHours(hour, 0, 0, 0);
    if (candidate.getTime() > now.getTime()) return new Date(candidate);
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(slots[0], 0, 0, 0);
  return tomorrow;
}

export function msUntil(date: Date, now = new Date()): number {
  return Math.max(0, date.getTime() - now.getTime());
}

export function buildDailyPlan(options: {
  settings: ScheduleSettings;
  progressById: Record<string, WordProgress>;
  existingPlan?: DailyPlan | null;
  now?: Date;
  random?: () => number;
}): DailyPlan {
  const now = options.now ?? new Date();
  const dateKey = getLocalDateKey(now);
  const hours = getHourSlots(options.settings);

  if (
    options.existingPlan &&
    options.existingPlan.dateKey === dateKey &&
    options.existingPlan.slots.length === hours.length &&
    options.existingPlan.slots.every((slot, index) => slot.hour === hours[index])
  ) {
    return options.existingPlan;
  }

  const vocabulary = getAllVocabulary();
  const progressList = Object.values(options.progressById);
  const dueIds = progressList
    .filter((item) => isDue(item, now))
    .sort(
      (a, b) =>
        new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime(),
    )
    .map((item) => item.wordId);

  const seenIds = new Set(progressList.map((item) => item.wordId));
  const unseen = vocabulary.filter((entry) => !seenIds.has(entry.id));
  const seen = vocabulary.filter((entry) => seenIds.has(entry.id));

  const recentIds: string[] = [];
  const used = new Set<string>();
  const slots: HourlySlot[] = [];

  for (const hour of hours) {
    let chosen: VocabularyEntry | undefined;

    while (dueIds.length > 0) {
      const candidateId = dueIds.shift()!;
      if (used.has(candidateId) && dueIds.length > 0) continue;
      chosen = vocabulary.find((entry) => entry.id === candidateId);
      if (chosen) break;
    }

    if (!chosen) {
      const newPool = unseen.filter((entry) => !used.has(entry.id));
      chosen = pickRandomWithoutImmediateRepeat(
        newPool.length > 0 ? newPool : unseen,
        recentIds,
        options.random,
      );
    }

    if (!chosen) {
      const reviewPool = seen.filter((entry) => !used.has(entry.id));
      chosen = pickRandomWithoutImmediateRepeat(
        reviewPool.length > 0 ? reviewPool : vocabulary,
        recentIds,
        options.random,
      );
    }

    if (!chosen) {
      chosen = vocabulary[0];
    }

    used.add(chosen.id);
    recentIds.push(chosen.id);
    slots.push({
      hour,
      label: formatHourLabel(hour),
      wordId: chosen.id,
    });
  }

  return { dateKey, slots };
}

export function getSlotForHour(
  plan: DailyPlan,
  hour: number,
): HourlySlot | undefined {
  return plan.slots.find((slot) => slot.hour === hour);
}
