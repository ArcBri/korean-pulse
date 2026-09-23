"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEntryTags, type VocabularyEntry } from "@/lib/vocabulary";
import type { ReviewRating, WordProgress } from "@/lib/review";
import { cn } from "@/lib/utils";

const RATINGS: { id: ReviewRating; label: string; hint: string }[] = [
  { id: "again", label: "Again", hint: "Forgot" },
  { id: "hard", label: "Hard", hint: "Rough" },
  { id: "good", label: "Good", hint: "Knew it" },
  { id: "easy", label: "Easy", hint: "Solid" },
];

const RATING_LABEL: Record<ReviewRating, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

function formatNextReview(iso: string, now = new Date()): string {
  const target = new Date(iso);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 60_000) return "due now";
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return "later today";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

type WordCardProps = {
  word: VocabularyEntry;
  slotLabel?: string;
  showActions?: boolean;
  progress?: WordProgress | null;
  onRate?: (rating: ReviewRating) => void;
  className?: string;
};

export function WordCard({
  word,
  slotLabel,
  showActions = false,
  progress = null,
  onRate,
  className,
}: WordCardProps) {
  const [justRated, setJustRated] = useState<ReviewRating | null>(null);

  useEffect(() => {
    setJustRated(null);
  }, [word.id]);

  const handleRate = (rating: ReviewRating) => {
    onRate?.(rating);
    setJustRated(rating);
  };

  const selectedRating = justRated ?? progress?.lastRating ?? null;
  const confirmationRating = selectedRating;
  const confirmationNext =
    progress?.nextReviewAt && confirmationRating
      ? formatNextReview(progress.nextReviewAt)
      : null;

  return (
    <article
      className={cn(
        "word-card animate-rise rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)]/90 p-6 shadow-[0_20px_50px_-30px_rgba(20,48,40,0.45)] sm:p-8",
        className,
      )}
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {slotLabel ? (
          <Badge className="bg-[color:var(--accent)] text-[color:var(--accent-ink)]">
            {slotLabel}
          </Badge>
        ) : null}
        {getEntryTags(word).map((tag, index) => (
          <Badge
            key={tag}
            variant={index === 0 ? "secondary" : "outline"}
          >
            {tag}
          </Badge>
        ))}
      </div>

      <p className="font-hangul text-5xl leading-none tracking-tight text-[color:var(--ink)] sm:text-6xl">
        {word.hangul}
      </p>
      <p className="mt-3 font-display text-2xl text-[color:var(--accent)] sm:text-3xl">
        {word.romanization}
      </p>
      <p className="mt-2 text-lg text-[color:var(--muted)]">{word.meaning}</p>

      {word.exampleHangul ? (
        <div className="mt-8 border-t border-[color:var(--line)] pt-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Example
          </p>
          <p className="mt-2 font-hangul text-xl text-[color:var(--ink)]">
            {word.exampleHangul}
          </p>
          {word.exampleRomanization ? (
            <p className="mt-1 text-sm text-[color:var(--accent)]">
              {word.exampleRomanization}
            </p>
          ) : null}
          {word.exampleMeaning ? (
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {word.exampleMeaning}
            </p>
          ) : null}
        </div>
      ) : null}

      {showActions && onRate ? (
        <div className="mt-8 space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map((rating) => {
              const selected = selectedRating === rating.id;
              return (
                <Button
                  key={rating.id}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  aria-pressed={selected}
                  className={cn(
                    "relative z-10 h-auto flex-col gap-0.5 py-3",
                    selected
                      ? "bg-[color:var(--accent)] text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-deep)]"
                      : "bg-[color:var(--surface-strong)] text-[color:var(--ink)] hover:bg-[color:var(--accent-soft)]",
                  )}
                  onClick={() => handleRate(rating.id)}
                >
                  <span>{rating.label}</span>
                  <span
                    className={cn(
                      "text-[10px] font-normal",
                      selected ? "opacity-90" : "opacity-70",
                    )}
                  >
                    {rating.hint}
                  </span>
                </Button>
              );
            })}
          </div>
          {confirmationRating ? (
            <p
              role="status"
              aria-live="polite"
              className="rounded-xl border border-[color:var(--accent)]/30 bg-[color:var(--accent-soft)] px-3 py-2 text-sm text-[color:var(--accent-deep)]"
            >
              Saved <strong>{RATING_LABEL[confirmationRating]}</strong>
              {confirmationNext ? ` · see again ${confirmationNext}` : null}.
            </p>
          ) : (
            <p className="text-xs text-[color:var(--muted)]">
              How well did you know this one?
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}
