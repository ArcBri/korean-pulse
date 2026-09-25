"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { hangulInputsMatch } from "@/lib/hangul-input";
import type { VocabularyEntry } from "@/lib/vocabulary";
import { cn } from "@/lib/utils";

type TypeCheckPanelProps = {
  word: VocabularyEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TypeCheckPanel({
  word,
  open,
  onOpenChange,
}: TypeCheckPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [typed, setTyped] = useState("");
  const [hintShown, setHintShown] = useState(false);
  const [revealedHangul, setRevealedHangul] = useState(false);
  const [status, setStatus] = useState<"idle" | "wrong" | "correct">("idle");

  useEffect(() => {
    if (!open || !word) return;
    setTyped("");
    setHintShown(false);
    setRevealedHangul(false);
    setStatus("idle");
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, word?.id]);

  useEffect(() => {
    if (status !== "correct") return;
    const t = window.setTimeout(() => onOpenChange(false), 900);
    return () => window.clearTimeout(t);
  }, [status, onOpenChange]);

  if (!word) return null;

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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/45 supports-backdrop-filter:backdrop-blur-sm" />
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn(
            "fixed left-1/2 z-50 grid w-full max-w-[calc(100%-1.5rem)] -translate-x-1/2 gap-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-[color:var(--ink)] shadow-[0_24px_60px_-28px_rgba(20,48,40,0.55)] outline-none sm:max-w-md sm:p-6",
            "top-[min(40%,calc(100%-14rem))] -translate-y-1/2",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          )}
        >
          <DialogHeader className="gap-1">
            <DialogTitle className="font-display text-2xl font-normal text-[color:var(--ink)]">
              Type it in Hangul
            </DialogTitle>
            <DialogDescription className="text-base text-[color:var(--muted)]">
              {word.meaning}
            </DialogDescription>
          </DialogHeader>

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
            <div className="space-y-3">
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Skip
                </Button>
              </div>
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
