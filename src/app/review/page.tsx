"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { HangulTypeForm } from "@/components/hangul-type-form";
import { Button } from "@/components/ui/button";
import { useLearner } from "@/components/learner-provider";
import {
  countEligibleReviewWords,
  selectReviewWordIds,
} from "@/lib/review-session";
import {
  REVIEW_SESSION_SIZE_OPTIONS,
  clampReviewSessionSize,
  type ReviewSessionSize,
} from "@/lib/schedule";
import { getVocabularyById } from "@/lib/vocabulary";
import { cn } from "@/lib/utils";

type Phase = "landing" | "session" | "done";

export default function ReviewPage() {
  const { hydrated, state, updateSettings, markWordHard } = useLearner();
  const [phase, setPhase] = useState<Phase>("landing");
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [advanceToken, setAdvanceToken] = useState(0);

  const eligible = useMemo(
    () => (state ? countEligibleReviewWords(state.progressById) : 0),
    [state],
  );

  const sessionSize = clampReviewSessionSize(
    state?.settings.reviewSessionSize ?? 10,
  );

  const currentWord =
    phase === "session" && queue[index]
      ? getVocabularyById(queue[index])
      : null;

  const startSession = () => {
    if (!state) return;
    const ids = selectReviewWordIds(
      state.progressById,
      sessionSize,
      new Date(),
    );
    setQueue(ids);
    setIndex(0);
    setCorrectCount(0);
    setAdvanceToken(0);
    setPhase(ids.length === 0 ? "landing" : "session");
  };

  const goNext = (wasCorrect: boolean) => {
    setCorrectCount((n) => (wasCorrect ? n + 1 : n));
    const next = index + 1;
    if (next >= queue.length) {
      setPhase("done");
      return;
    }
    setIndex(next);
    setAdvanceToken((t) => t + 1);
  };

  if (!hydrated || !state) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-dashed border-[color:var(--line)] p-8 text-[color:var(--muted)]">
          Loading review…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mb-8 max-w-2xl animate-rise">
        <h1 className="font-display text-4xl text-[color:var(--ink)]">
          Review
        </h1>
        <p className="mt-3 text-[color:var(--muted)]">
          Practice words you&apos;ve already seen. Misses tighten the schedule;
          getting it right here doesn&apos;t push the next review out.
        </p>
      </section>

      {phase === "landing" ? (
        <div className="max-w-lg space-y-6">
          {eligible === 0 ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--surface)]/80 p-8">
              <p className="text-[color:var(--muted)]">
                No known words yet. Rate a few on Today first, then come back.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex h-9 items-center rounded-lg bg-[color:var(--accent)] px-3 text-sm font-medium text-[color:var(--accent-ink)]"
              >
                Go to Today
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/85 p-6 space-y-5">
              <p className="text-sm text-[color:var(--muted)]">
                <span className="font-display text-3xl text-[color:var(--ink)]">
                  {eligible}
                </span>{" "}
                word{eligible === 1 ? "" : "s"} ready. Sessions pull Again and
                Hard first.
              </p>

              <div>
                <p className="mb-2 text-sm text-[color:var(--muted)]">
                  Session size
                </p>
                <div className="flex flex-wrap gap-2">
                  {REVIEW_SESSION_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        updateSettings({
                          reviewSessionSize: size as ReviewSessionSize,
                        })
                      }
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm transition",
                        sessionSize === size
                          ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
                          : "border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--muted)] hover:text-[color:var(--ink)]",
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={startSession}
                className="bg-[color:var(--accent)] text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-deep)]"
              >
                Start session ({Math.min(sessionSize, eligible)})
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {phase === "session" && currentWord ? (
        <div className="max-w-lg space-y-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
            {index + 1} / {queue.length}
          </p>
          <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)]/90 p-6 sm:p-8">
            <HangulTypeForm
              word={currentWord}
              resetKey={`${currentWord.id}-${advanceToken}`}
              onCorrect={() => {
                window.setTimeout(() => goNext(true), 700);
              }}
              onMiss={() => markWordHard(currentWord.id)}
              onSkip={() => goNext(false)}
            />
          </div>
        </div>
      ) : null}

      {phase === "session" && !currentWord ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--line)] p-8 text-[color:var(--muted)]">
          That word is missing from the library.{" "}
          <button
            type="button"
            className="text-[color:var(--accent)] underline"
            onClick={() => goNext(false)}
          >
            Skip
          </button>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="max-w-lg rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/85 p-8 space-y-4">
          <h2 className="font-display text-2xl text-[color:var(--ink)]">
            Session done
          </h2>
          <p className="text-[color:var(--muted)]">
            You typed{" "}
            <span className="font-medium text-[color:var(--ink)]">
              {correctCount}
            </span>{" "}
            of {queue.length} correctly.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                setPhase("landing");
              }}
              className="bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
            >
              Back to Review
            </Button>
            {eligible > 0 ? (
              <Button type="button" variant="outline" onClick={startSession}>
                Start another
              </Button>
            ) : null}
            <Link
              href="/"
              className="inline-flex h-8 items-center rounded-lg px-2.5 text-sm text-[color:var(--muted)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--ink)]"
            >
              Today
            </Link>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
