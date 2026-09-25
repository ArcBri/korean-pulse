"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { HangulTypeForm } from "@/components/hangul-type-form";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
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
  if (!word) return null;

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
          <HangulTypeForm
            word={word}
            resetKey={`${word.id}-${open ? "open" : "closed"}`}
            autoAdvanceOnCorrect
            onAdvance={() => onOpenChange(false)}
          />
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
