"use client";

import { AppShell } from "@/components/app-shell";
import { SettingsPanel } from "@/components/settings-panel";
import { useLearner } from "@/components/learner-provider";

export default function SettingsPage() {
  const { hydrated, state, updateSettings, resetProgress } = useLearner();

  return (
    <AppShell>
      <section className="mb-8 max-w-2xl animate-rise">
        <h1 className="font-display text-4xl text-[color:var(--ink)]">
          Settings
        </h1>
        <p className="mt-3 text-[color:var(--muted)]">
          Tune your local hourly window and browser reminders. Progress stays on
          this device.
        </p>
      </section>

      {!hydrated || !state ? (
        <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/80 p-8 text-[color:var(--muted)]">
          Loading settings…
        </div>
      ) : (
        <SettingsPanel
          state={state}
          onSettingsChange={updateSettings}
          onReset={resetProgress}
        />
      )}
    </AppShell>
  );
}
