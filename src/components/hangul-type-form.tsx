"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { hangulInputsMatch } from "@/lib/hangul-input";
import type { VocabularyEntry } from "@/lib/vocabulary";

export type HangulTypeResult = "correct" | "incorrect" | "skipped";

type HangulTypeFormProps = {
  word: VocabularyEntry;
  title?: string;
  /** Called when the learner advances (Next / Skip). */
  onAdvance: (result: HangulTypeResult) => void;
  /** First miss only — e.g. Review applies Hard. */
  onMiss?: () => void;
  /**
   * If true, correct answers auto-advance after a short pause (Today modal).
   * Review should leave this false and use the Next button.
   */
  autoAdvanceOnCorrect?: boolean;
  resetKey?: string;
};

export function HangulTypeForm({
  word,
  title = "Type it in Hangul",
  onAdvance,
  onMiss,
  autoAdvanceOnCorrect = false,
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

  useEffect(() => {
    if (!autoAdvanceOnCorrect || status !== "correct") return;
    const t = window.setTimeout(() => onAdvance("correct"), 900);
    return () => window.clearTimeout(t);
  }, [autoAdvanceOnCorrect, status, onAdvance]);

  const registerMiss = () => {
    if (missedRef.current) return;
    missedRef.current = true;
    onMiss?.();
  };

  const check = () => {
    if (!typed.trim()) {
      setStatus("wrong");
      setRevealedHangul(false);
      return;
    }
    if (hangulInputsMatch(typed, word.hangul)) {
      setStatus("correct");
      return;
    }
    setStatus("wrong");
    setRevealedHangul(true);
    registerMiss();
  };

  const resolved = status === "correct" || revealedHangul;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-2xl text-[color:var(--ink)]">
          {title}
        </h2>
        <p className="mt-1 text-base text-[color:var(--muted)]">{word.meaning}</p>
      </div>

      {status === "correct" ? (
        <p
          role="status"
          className="rounded-xl border border-[color:var(--accent)]/30 bg-[color:var(--accent-soft)] px-4 py-3 text-[color:var(--accent-deep)]"
        >
          Got it —{" "}
          <span className="font-hangul text-lg text-[color:var(--ink)]">
            {word.hangul}
          </span>
        </p>
      ) : (
        <>
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
              if (status === "wrong" && !revealedHangul) setStatus("idle");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (resolved) {
                  onAdvance(missedRef.current ? "incorrect" : "correct");
                } else {
                  check();
                }
              }
            }}
            placeholder="한국어로 입력"
            className="h-12 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-hangul text-xl text-[color:var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
          />
        </>
      )}

      {hintShown && status !== "correct" ? (
        <p className="text-sm text-[color:var(--muted)]">
          Hint:{" "}
          <span className="font-medium text-[color:var(--accent)]">
            {word.romanization}
          </span>
        </p>
      ) : null}

      {revealedHangul && status !== "correct" ? (
        <p role="status" className="text-sm text-[color:var(--muted)]">
          Answer:{" "}
          <span className="font-hangul text-lg text-[color:var(--ink)]">
            {word.hangul}
          </span>
          {" — "}
          try again, or tap Next
        </p>
      ) : status === "wrong" && !typed.trim() ? (
        <p role="status" className="text-sm text-[color:var(--muted)]">
          Type the Hangul first.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        {status === "correct" ? (
          !autoAdvanceOnCorrect ? (
            <Button
              type="button"
              onClick={() => onAdvance("correct")}
              className="bg-[color:var(--accent)] text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-deep)]"
            >
              Next
            </Button>
          ) : null
        ) : (
          <>
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
            {revealedHangul ? (
              <Button
                type="button"
                onClick={() => onAdvance("incorrect")}
                className="bg-[color:var(--accent)] text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-deep)]"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onAdvance("skipped")}
              >
                Skip
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
