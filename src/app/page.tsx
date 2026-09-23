"use client";

import { AppShell } from "@/components/app-shell";
import { WordCard } from "@/components/word-card";
import { TodayQueue } from "@/components/today-queue";
import { Progress } from "@/components/ui/progress";
import { useLearner } from "@/components/learner-provider";
import { formatHourLabel } from "@/lib/schedule";

function formatCountdown(target: Date | null, now: Date): string {
  if (!target) return "No upcoming slot";
  const ms = Math.max(0, target.getTime() - now.getTime());
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0 && minutes <= 0) return "Due now";
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default function HomePage() {
  const {
    hydrated,
    state,
    now,
    currentHour,
    currentSlot,
    currentWord,
    nextSlotAt,
    dueCount,
    learnedCount,
    reviewedTodayCount,
    totalSlots,
    rateCurrentWord,
  } = useLearner();

  if (!hydrated || !state) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/80 p-8 text-[color:var(--muted)]">
          Loading your local study queue…
        </div>
      </AppShell>
    );
  }

  const progressValue =
    totalSlots === 0
      ? 0
      : Math.min(100, Math.round((reviewedTodayCount / totalSlots) * 100));

  return (
    <AppShell>
      <section className="mb-10 max-w-2xl animate-rise">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--accent)]">
          Local {formatHourLabel(now.getHours())} study window
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
          Hangul Hour
        </h1>
        <p className="mt-3 text-base text-[color:var(--muted)] sm:text-lg">
          One useful Korean word each hour from{" "}
          {formatHourLabel(state.settings.startHour)} to{" "}
          {formatHourLabel(state.settings.endHour)}, with Hangul, pronunciation,
          and spaced repeats so it sticks.
        </p>
      </section>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Learned" value={`${learnedCount}`} />
        <Stat label="Due reviews" value={`${dueCount}`} />
        <Stat
          label="Next slot"
          value={formatCountdown(nextSlotAt, now)}
        />
      </div>

      <div className="mb-8 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/80 p-4">
        <div className="mb-2 flex items-center justify-between text-sm text-[color:var(--muted)]">
          <span>Today&apos;s reviews logged</span>
          <span>
            {reviewedTodayCount}/{totalSlots || "—"}
          </span>
        </div>
        <Progress value={progressValue} />
      </div>

      {currentWord && currentSlot ? (
        <WordCard
          word={currentWord}
          slotLabel={currentSlot.label}
          showActions
          onRate={(rating) => rateCurrentWord(currentWord.id, rating)}
          className="mb-10"
        />
      ) : (
        <div className="mb-10 rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--surface)]/70 p-8">
          <h2 className="font-display text-2xl text-[color:var(--ink)]">
            Outside the study window
          </h2>
          <p className="mt-2 max-w-xl text-[color:var(--muted)]">
            Your next word arrives at{" "}
            {nextSlotAt
              ? nextSlotAt.toLocaleString(undefined, {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "the next configured hour"}
            . Browse the library anytime, or open Settings to change the window.
          </p>
          {currentHour !== null && state.dailyPlan ? (
            <p className="mt-4 text-sm text-[color:var(--accent)]">
              Tip: if you already reviewed today&apos;s slots, new mixes appear
              tomorrow with due repeats prioritized.
            </p>
          ) : null}
        </div>
      )}

      <TodayQueue
        plan={state.dailyPlan}
        currentHour={currentHour}
        reviewedIds={state.reviewedToday}
      />
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/80 px-4 py-5">
      <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-[color:var(--ink)]">
        {value}
      </p>
    </div>
  );
}
