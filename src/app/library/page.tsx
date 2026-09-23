"use client";

import { AppShell } from "@/components/app-shell";
import { VocabularyBrowser } from "@/components/vocabulary-browser";
import { PronunciationGuide } from "@/components/pronunciation-guide";
import { getAllVocabulary } from "@/lib/vocabulary";

export default function LibraryPage() {
  const total = getAllVocabulary().length;

  return (
    <AppShell>
      <section className="mb-8 max-w-2xl animate-rise">
        <h1 className="font-display text-4xl text-[color:var(--ink)]">
          Library
        </h1>
        <p className="mt-3 text-[color:var(--muted)]">
          {total} everyday words and phrases — greetings, food, places, verbs,
          and more. Filter by topic or search.
        </p>
      </section>
      <div className="space-y-8">
        <VocabularyBrowser />
        <PronunciationGuide />
      </div>
    </AppShell>
  );
}
