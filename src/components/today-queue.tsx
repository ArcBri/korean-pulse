"use client";

import { getVocabularyById } from "@/lib/vocabulary";
import type { DailyPlan } from "@/lib/schedule";
import { cn } from "@/lib/utils";

type TodayQueueProps = {
  plan: DailyPlan | null;
  currentHour: number | null;
  reviewedIds: string[];
};

export function TodayQueue({
  plan,
  currentHour,
  reviewedIds,
}: TodayQueueProps) {
  if (!plan || plan.slots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--line)] p-6 text-sm text-[color:var(--muted)]">
        No hours set for today. Pick a start and end in Settings.
      </div>
    );
  }

  const reviewed = new Set(reviewedIds);

  return (
    <section className="animate-rise-delay">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[color:var(--ink)]">
            Today&apos;s queue
          </h2>
          <p className="text-sm text-[color:var(--muted)]">
            This hour’s word plus anything due for a quick review.
          </p>
        </div>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {plan.slots.map((slot) => {
          const word = getVocabularyById(slot.wordId);
          const isCurrent = currentHour === slot.hour;
          const isDone = reviewed.has(slot.wordId) && !isCurrent;
          return (
            <li
              key={`${slot.hour}-${slot.wordId}`}
              className={cn(
                "rounded-xl border px-4 py-3 transition",
                isCurrent
                  ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                  : "border-[color:var(--line)] bg-[color:var(--surface)]/80",
                isDone && "opacity-70",
              )}
            >
              <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
                <span>{slot.label}</span>
                <span>{isCurrent ? "Now" : isDone ? "Seen" : "Queued"}</span>
              </div>
              <p className="mt-2 font-hangul text-xl text-[color:var(--ink)]">
                {word?.hangul ?? "—"}
              </p>
              <p className="text-sm text-[color:var(--muted)]">
                {word?.meaning ?? "Missing word"}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
