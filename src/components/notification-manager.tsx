"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchPushConfig,
  getNotificationPermission,
  hasActiveWebPushSubscription,
  registerServiceWorker,
  requestNotificationPermission,
  showWordNotification,
  subscribeToWebPush,
  syncWebPushSchedule,
  unsubscribeFromWebPush,
} from "@/lib/notifications";
import {
  getCurrentSlotHour,
  type DailyPlan,
  type ScheduleSettings,
} from "@/lib/schedule";
import { getVocabularyById } from "@/lib/vocabulary";

type NotificationManagerProps = {
  enabled: boolean;
  settings: ScheduleSettings;
  plan: DailyPlan | null;
  onEnabledChange: (enabled: boolean) => void;
};

export function NotificationManager({
  enabled,
  settings,
  plan,
  onEnabledChange,
}: NotificationManagerProps) {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => getNotificationPermission());
  const [status, setStatus] = useState<string>("");
  const [pushConfigured, setPushConfigured] = useState(false);
  const [pushActive, setPushActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const config = await fetchPushConfig();
      const active = await hasActiveWebPushSubscription();
      if (cancelled) return;
      setPushConfigured(config.configured);
      setPushActive(active);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || permission !== "granted" || !pushConfigured) return;
    void syncSchedule();

    async function syncSchedule() {
      const ok = await syncWebPushSchedule({
        startHour: settings.startHour,
        endHour: settings.endHour,
      });
      if (ok) {
        setPushActive(true);
        return;
      }
      // No browser subscription yet — create one with the current VAPID key.
      const result = await subscribeToWebPush({
        startHour: settings.startHour,
        endHour: settings.endHour,
      });
      setPushActive(result.ok);
    }
  }, [enabled, permission, pushConfigured, settings.startHour, settings.endHour]);

  const enable = async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      setStatus("Notifications are not supported in this browser.");
      return;
    }

    await registerServiceWorker();
    const next = await requestNotificationPermission();
    setPermission(next);

    if (next !== "granted") {
      onEnabledChange(false);
      setStatus(
        next === "denied"
          ? "Blocked by the browser. You can still study from the Today tab."
          : "Permission wasn’t granted.",
      );
      return;
    }

    onEnabledChange(true);

    const config = await fetchPushConfig();
    setPushConfigured(config.configured);

    if (config.configured) {
      const push = await subscribeToWebPush({
        startHour: settings.startHour,
        endHour: settings.endHour,
      });
      setPushActive(push.ok);
      setStatus(
        push.ok
          ? "Background push subscribed. Closed-app alerts say “Your Hangul Hour word is ready” (not the Korean word). Keep Focus/DND off for Hangul Hour."
          : `Local reminders only while open — ${push.error}`,
      );
      if (push.ok) {
        await showWordNotification({
          title: "Hangul Hour",
          body: "Test alert — background push is set up. Hourly closed-app alerts will look like this.",
          tag: `test-${Date.now()}`,
          url: "/",
        });
      }
    } else {
      setPushActive(false);
      setStatus(
        "Notifications on while Hangul Hour stays open. Add VAPID + Upstash Redis for background Web Push.",
      );
      const hour = getCurrentSlotHour(new Date(), settings);
      const slot =
        hour === null ? null : plan?.slots.find((item) => item.hour === hour);
      const word = slot ? getVocabularyById(slot.wordId) : undefined;
      if (word && slot) {
        await showWordNotification({
          title: `Hangul Hour · ${slot.label} (while open)`,
          body: `${word.hangul} · ${word.romanization} — ${word.meaning}`,
          tag: `test-${Date.now()}`,
          url: "/",
        });
      }
    }
  };

  const disable = async () => {
    await unsubscribeFromWebPush();
    setPushActive(false);
    onEnabledChange(false);
    setStatus("Notifications off. Today still updates on the hour.");
  };

  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/85 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-[color:var(--accent-soft)] p-2 text-[color:var(--accent)]">
          {enabled && permission === "granted" ? (
            <BellRing className="size-5" />
          ) : permission === "denied" || permission === "unsupported" ? (
            <BellOff className="size-5" />
          ) : (
            <Bell className="size-5" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl text-[color:var(--ink)]">
            Hourly reminders
          </h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {pushConfigured
              ? "Background Web Push sends a generic reminder each study hour, even when the app is closed. On iPhone, add Hangul Hour to your Home Screen first."
              : "Works best while the app is open or added to your home screen. Phones often quiet background alerts — Today is always up to date."}
          </p>
          {pushConfigured ? (
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              Background push: {pushActive ? "subscribed" : "not subscribed yet"}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {!enabled || permission !== "granted" ? (
              <Button
                onClick={() => void enable()}
                className="bg-[color:var(--accent)] text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-deep)]"
              >
                Enable notifications
              </Button>
            ) : (
              <Button variant="outline" onClick={() => void disable()}>
                Turn off notifications
              </Button>
            )}
          </div>
          {status ? (
            <p className="mt-3 text-sm text-[color:var(--accent)]">{status}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
