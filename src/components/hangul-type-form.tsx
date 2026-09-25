"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { hangulInputsMatch } from "@/lib/hangul-input";
import type { VocabularyEntry } from "@/lib/vocabulary";

type HangulTypeFormProps = {
  word: VocabularyEntry;
  title?: string;
  onCorrect: () => void;
  onMiss: () => void;
  onSkip: () => void;
  /** When the word changes, form resets. */
  resetKey?: string;
};

export function HangulTypeForm({
  word,
  title = "Type it in Hangul",
  onCorrect,
  onMiss,
  onSkip,
  resetKey,
}: HangulTypeFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [typed, setTyped] = useState("");
  const [hintShown, setHintShown] = useState(false);
  const [revealedHangul, setRevealedHangul] = useState(false);
  const [status, setStatus] = useState<"idle" | "wrong" | "correct">("idle");
  const missedRef = useRef(false);

  useEffect(() => {
    setTyped("");
    setHintShown(false);
    setRevealedHangul(false);
    setStatus("idle");
    missedRef.current = false;
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [word.id, resetKey]);

  const check = () => {
    if (!typed.trim()) {
      setStatus("wrong");
      setRevealedHangul(false);
      return;
    }
    if (hangulInputsMatch(typed, word.hangul)) {
      setStatus("correct");
      onCorrect();
      return;
    }
    setStatus("wrong");
    setRevealedHangul(true);
    if (!missedRef.current) {
      missedRef.current = true;
      onMiss();
    }
  };

  if (status === "correct") {
    return (
      <p
        role="status"
        className="rounded-xl border border-[color:var(--accent)]/30 bg-[color:var(--accent-soft)] px-4 py-3 text-[color:var(--accent-deep)]"
      >
        Got it —{" "}
        <span className="font-hangul text-lg text-[color:var(--ink)]">
          {word.hangul}
        </span>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-2xl text-[color:var(--ink)]">
          {title}
        </h2>
        <p className="mt-1 text-base text-[color:var(--muted)]">{word.meaning}</p>
      </div>

      <label htmlFor={inputId} className="sr-only">
        Hangul for {word.meaning}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        lang="ko"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        value={typed}
        onChange={(event) => {
          setTyped(event.target.value);
          if (status === "wrong") setStatus("idle");
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            check();
          }
        }}
        placeholder="한국어로 입력"
        className="h-12 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-hangul text-xl text-[color:var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
      />

      {hintShown ? (
        <p className="text-sm text-[color:var(--muted)]">
          Hint:{" "}
          <span className="font-medium text-[color:var(--accent)]">
            {word.romanization}
          </span>
        </p>
      ) : null}

      {revealedHangul ? (
        <p role="status" className="text-sm text-[color:var(--muted)]">
          Answer:{" "}
          <span className="font-hangul text-lg text-[color:var(--ink)]">
            {word.hangul}
          </span>
          {" — "}
          try again
        </p>
      ) : status === "wrong" && !typed.trim() ? (
        <p role="status" className="text-sm text-[color:var(--muted)]">
          Type the Hangul first.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          onClick={check}
          className="bg-[color:var(--accent)] text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-deep)]"
        >
          Check
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setHintShown(true)}
          disabled={hintShown}
        >
          Hint
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </div>
  );
}
