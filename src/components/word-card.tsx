"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TOPIC_LABELS, type VocabularyEntry } from "@/lib/vocabulary";
import type { ReviewRating } from "@/lib/review";
import { cn } from "@/lib/utils";

const RATINGS: { id: ReviewRating; label: string; hint: string }[] = [
  { id: "again", label: "Again", hint: "Soon" },
  { id: "hard", label: "Hard", hint: "Sooner" },
  { id: "good", label: "Good", hint: "On track" },
  { id: "easy", label: "Easy", hint: "Later" },
];

type WordCardProps = {
  word: VocabularyEntry;
  slotLabel?: string;
  showActions?: boolean;
  onRate?: (rating: ReviewRating) => void;
  className?: string;
};

export function WordCard({
  word,
  slotLabel,
  showActions = false,
  onRate,
  className,
}: WordCardProps) {
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
        <Badge variant="secondary">{TOPIC_LABELS[word.topic]}</Badge>
        <Badge variant="outline" className="capitalize">
          {word.partOfSpeech}
        </Badge>
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
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RATINGS.map((rating) => (
            <Button
              key={rating.id}
              variant={rating.id === "good" ? "default" : "outline"}
              className={cn(
                "h-auto flex-col gap-0.5 py-3",
                rating.id === "good" &&
                  "bg-[color:var(--accent)] text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-deep)]",
              )}
              onClick={() => onRate(rating.id)}
            >
              <span>{rating.label}</span>
              <span className="text-[10px] font-normal opacity-70">
                {rating.hint}
              </span>
            </Button>
          ))}
        </div>
      ) : null}
    </article>
  );
}
