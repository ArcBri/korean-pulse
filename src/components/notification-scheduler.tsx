"use client";

import { useEffect, useRef, useState } from "react";
import { useLearner } from "@/components/learner-provider";
import {
  computeDelayToNextHourBoundary,
  hasActiveWebPushSubscription,
  registerServiceWorker,
  showWordNotification,
} from "@/lib/notifications";
import { getCurrentSlotHour, getHourSlots } from "@/lib/schedule";
import { getVocabularyById } from "@/lib/vocabulary";

export function NotificationScheduler() {
  const { hydrated, state } = useLearner();
  const notifiedRef = useRef(new Set<string>());
  const [useLocalFallback, setUseLocalFallback] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    void registerServiceWorker();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !state?.settings.notificationsEnabled) return;
    let cancelled = false;
    void (async () => {
      const activePush = await hasActiveWebPushSubscription();
      if (!cancelled) setUseLocalFallback(!activePush);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, state?.settings.notificationsEnabled, state?.settings.startHour, state?.settings.endHour]);

  useEffect(() => {
    if (
      !hydrated ||
      !state?.settings.notificationsEnabled ||
      !state.dailyPlan ||
      !useLocalFallback
    ) {
      return;
    }

    let timeoutId = 0;
    let cancelled = false;

    const tick = async () => {
      if (cancelled || !state.dailyPlan) return;
      const now = new Date();
      const hour = getCurrentSlotHour(now, state.settings);
      const slots = getHourSlots(state.settings);

      if (
        hour !== null &&
        slots.includes(hour) &&
        now.getMinutes() < 2 &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        const slot = state.dailyPlan.slots.find((item) => item.hour === hour);
        const word = slot ? getVocabularyById(slot.wordId) : undefined;
        const tag = `${state.dailyPlan.dateKey}-${hour}`;
        if (word && slot && !notifiedRef.current.has(tag)) {
          notifiedRef.current.add(tag);
          await showWordNotification({
            title: `Hangul Hour · ${slot.label}`,
            body: `${word.hangul} · ${word.romanization} — ${word.meaning}`,
            tag,
            url: "/",
          });
        }
      }

      timeoutId = window.setTimeout(
        tick,
        computeDelayToNextHourBoundary(new Date()),
      );
    };

    timeoutId = window.setTimeout(tick, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [hydrated, state, useLocalFallback]);

  return null;
}
