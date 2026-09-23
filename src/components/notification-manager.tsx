"use client";

import { useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotificationPermission,
  registerServiceWorker,
  requestNotificationPermission,
  showWordNotification,
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

  const enable = async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      setStatus("Notifications are not supported in this browser.");
      return;
    }

    await registerServiceWorker();
    const next = await requestNotificationPermission();
    setPermission(next);

    if (next === "granted") {
      onEnabledChange(true);
      setStatus(
        "Hourly notifications enabled while this app stays open or installed.",
      );
      const hour = getCurrentSlotHour(new Date(), settings);
      const slot =
        hour === null ? null : plan?.slots.find((item) => item.hour === hour);
      const word = slot ? getVocabularyById(slot.wordId) : undefined;
      if (word && slot) {
        await showWordNotification({
          title: `Hangul Hour · ${slot.label}`,
          body: `${word.hangul} · ${word.romanization} — ${word.meaning}`,
          tag: `test-${Date.now()}`,
          url: "/",
        });
      }
      return;
    }

    onEnabledChange(false);
    setStatus(
      next === "denied"
        ? "Permission denied. You can still use the in-app hourly dashboard."
        : "Permission was not granted.",
    );
  };

  const disable = () => {
    onEnabledChange(false);
    setStatus("Notifications turned off. The in-app queue still updates hourly.");
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
            Browser notifications fire best while Hangul Hour is open or
            installed as an app. The dashboard remains the source of truth if the
            OS pauses background alerts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!enabled || permission !== "granted" ? (
              <Button
                onClick={() => void enable()}
                className="bg-[color:var(--accent)] text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-deep)]"
              >
                Enable notifications
              </Button>
            ) : (
              <Button variant="outline" onClick={disable}>
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
