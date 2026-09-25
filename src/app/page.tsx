"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { WordCard } from "@/components/word-card";
import { TodayQueue } from "@/components/today-queue";
import { TypeCheckPanel } from "@/components/type-check-panel";
import { Progress } from "@/components/ui/progress";
import { useLearner } from "@/components/learner-provider";
import { formatHourLabel } from "@/lib/schedule";
import {
  getVocabularyById,
  type VocabularyEntry,
} from "@/lib/vocabulary";
import type { ReviewRating } from "@/lib/review";

function formatCountdown(target: Date | null, now: Date): string {
  if (!target) return "—";
  const ms = Math.max(0, target.getTime() - now.getTime());
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0 && minutes <= 0) return "Now";
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

  const [typeCheckWord, setTypeCheckWord] = useState<VocabularyEntry | null>(
    null,
  );
  const [typeCheckOpen, setTypeCheckOpen] = useState(false);

  const handleRate = (word: VocabularyEntry, rating: ReviewRating) => {
    rateCurrentWord(word.id, rating);
    setTypeCheckWord(word);
    setTypeCheckOpen(true);
  };

  if (!hydrated || !state) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-dashed border-[color:var(--line)] p-8 text-[color:var(--muted)]">
          Loading today’s words…
        </div>
      </AppShell>
    );
  }

  const progressValue =
    totalSlots === 0
      ? 0
      : Math.min(100, Math.round((reviewedTodayCount / totalSlots) * 100));

  const previewSlot =
    !currentSlot && state.dailyPlan
      ? state.dailyPlan.slots.find((slot) =>
          nextSlotAt ? slot.hour === nextSlotAt.getHours() : true,
        ) ?? state.dailyPlan.slots[0]
      : null;
  const previewWord = previewSlot
    ? getVocabularyById(previewSlot.wordId)
    : null;

  return (
    <AppShell>
      <section className="mb-10 max-w-2xl animate-rise">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--accent)]">
          {formatHourLabel(now.getHours())} · local time
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
          Hangul Hour
        </h1>
        <p className="mt-3 text-base text-[color:var(--muted)] sm:text-lg">
          One Korean word each hour from{" "}
          {formatHourLabel(state.settings.startHour)} to{" "}
          {formatHourLabel(state.settings.endHour)}. Hangul, how to say it, and
          a quick check so it comes back later.
        </p>
      </section>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Seen" value={`${learnedCount}`} />
        <Stat label="Due" value={`${dueCount}`} />
        <Stat label="Next" value={formatCountdown(nextSlotAt, now)} />
      </div>

      <div className="mb-8 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/80 p-4">
        <div className="mb-2 flex items-center justify-between text-sm text-[color:var(--muted)]">
          <span>Checked off today</span>
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
          progress={state.progressById[currentWord.id] ?? null}
          onRate={(rating) => handleRate(currentWord, rating)}
          className="mb-10"
        />
      ) : (
        <div className="mb-10 space-y-4">
          <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--surface)]/70 p-8">
            <h2 className="font-display text-2xl text-[color:var(--ink)]">
              Not study time yet
            </h2>
            <p className="mt-2 max-w-xl text-[color:var(--muted)]">
              Next word{" "}
              {nextSlotAt
                ? nextSlotAt.toLocaleString(undefined, {
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "when your window opens"}
              . Peek below, browse the library, or change hours in Settings.
            </p>
          </div>
          {previewWord && previewSlot ? (
            <WordCard
              word={previewWord}
              slotLabel={`Up next · ${previewSlot.label}`}
              showActions
              progress={state.progressById[previewWord.id] ?? null}
              onRate={(rating) => handleRate(previewWord, rating)}
            />
          ) : null}
        </div>
      )}

      <TodayQueue
        plan={state.dailyPlan}
        currentHour={currentHour}
        reviewedIds={state.reviewedToday}
      />

      <TypeCheckPanel
        word={typeCheckWord}
        open={typeCheckOpen}
        onOpenChange={(open) => {
          setTypeCheckOpen(open);
          if (!open) setTypeCheckWord(null);
        }}
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
