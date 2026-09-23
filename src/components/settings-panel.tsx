"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { NotificationManager } from "@/components/notification-manager";
import type { LearnerState } from "@/lib/persistence";
import type { ScheduleSettings } from "@/lib/schedule";
import { getAllVocabulary } from "@/lib/vocabulary";

type SettingsPanelProps = {
  state: LearnerState;
  onSettingsChange: (settings: Partial<ScheduleSettings>) => void;
  onReset: () => void;
};

export function SettingsPanel({
  state,
  onSettingsChange,
  onReset,
}: SettingsPanelProps) {
  const totalWords = getAllVocabulary().length;
  const learned = Object.keys(state.progressById).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/85 p-5">
        <h2 className="font-display text-xl text-[color:var(--ink)]">
          Local schedule
        </h2>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Words appear once per hour between these local times, inclusive.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-[color:var(--muted)]">Start hour (0–23)</span>
            <Input
              type="number"
              min={0}
              max={23}
              value={state.settings.startHour}
              onChange={(event) =>
                onSettingsChange({
                  startHour: Number(event.target.value),
                })
              }
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-[color:var(--muted)]">End hour (0–23)</span>
            <Input
              type="number"
              min={0}
              max={23}
              value={state.settings.endHour}
              onChange={(event) =>
                onSettingsChange({
                  endHour: Number(event.target.value),
                })
              }
            />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-[color:var(--line)] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[color:var(--ink)]">
              Prefer notifications
            </p>
            <p className="text-xs text-[color:var(--muted)]">
              Requires browser permission below.
            </p>
          </div>
          <Switch
            checked={state.settings.notificationsEnabled}
            onCheckedChange={(checked) =>
              onSettingsChange({ notificationsEnabled: Boolean(checked) })
            }
          />
        </div>
      </section>

      <NotificationManager
        enabled={state.settings.notificationsEnabled}
        settings={state.settings}
        plan={state.dailyPlan}
        onEnabledChange={(notificationsEnabled) =>
          onSettingsChange({ notificationsEnabled })
        }
      />

      <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/85 p-5">
        <h2 className="font-display text-xl text-[color:var(--ink)]">
          Progress
        </h2>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          {learned} of {totalWords} beginner words have spaced-review history.
          Everything is stored on this device.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            if (
              window.confirm(
                "Reset all progress, today’s queue, and settings on this device?",
              )
            ) {
              onReset();
            }
          }}
        >
          Reset local progress
        </Button>
      </section>
    </div>
  );
}
