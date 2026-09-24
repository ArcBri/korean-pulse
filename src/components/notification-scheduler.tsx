"use client";

import { useEffect, useRef, useState } from "react";
import { useLearner } from "@/components/learner-provider";
import {
  computeDelayToNextHourBoundary,
  fetchPushConfig,
  getNotificationPermission,
  hasActiveWebPushSubscription,
  registerServiceWorker,
  showWordNotification,
  subscribeToWebPush,
} from "@/lib/notifications";
import { getCurrentSlotHour, getHourSlots } from "@/lib/schedule";
import { getVocabularyById } from "@/lib/vocabulary";

/**
 * Local fallback notifications only run while the page is open and only when
 * there is no active Web Push subscription. Background delivery must come from
 * /api/push/cron → service worker `push` (generic "word is ready" copy).
 */
export function NotificationScheduler() {
  const { hydrated, state } = useLearner();
  const notifiedRef = useRef(new Set<string>());
  // Start false so we never flash a local alert before knowing push status.
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    void registerServiceWorker();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !state?.settings.notificationsEnabled) {
      setUseLocalFallback(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const permission = getNotificationPermission();
      if (permission !== "granted") {
        if (!cancelled) setUseLocalFallback(false);
        return;
      }

      const config = await fetchPushConfig();
      let activePush = await hasActiveWebPushSubscription();

      // Repair: permission granted + server push configured, but browser lost
      // its PushSubscription (common after SW updates). Re-subscribe silently.
      if (config.configured && !activePush) {
        const repaired = await subscribeToWebPush({
          startHour: state.settings.startHour,
          endHour: state.settings.endHour,
        });
        activePush = repaired.ok;
      }

      if (!cancelled) {
        // Local fallback only when background push is unavailable.
        setUseLocalFallback(!config.configured || !activePush);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    state?.settings.notificationsEnabled,
    state?.settings.startHour,
    state?.settings.endHour,
  ]);

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
        const tag = `local-${state.dailyPlan.dateKey}-${hour}`;
        if (word && slot && !notifiedRef.current.has(tag)) {
          notifiedRef.current.add(tag);
          await showWordNotification({
            title: `Hangul Hour · ${slot.label} (while open)`,
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
