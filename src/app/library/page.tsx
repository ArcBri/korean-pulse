"use client";

import { AppShell } from "@/components/app-shell";
import { VocabularyBrowser } from "@/components/vocabulary-browser";
import { getAllVocabulary } from "@/lib/vocabulary";

export default function LibraryPage() {
  const total = getAllVocabulary().length;

  return (
    <AppShell>
      <section className="mb-8 max-w-2xl animate-rise">
        <h1 className="font-display text-4xl text-[color:var(--ink)]">
          Vocabulary library
        </h1>
        <p className="mt-3 text-[color:var(--muted)]">
          {total} beginner-core words and phrases for daily life — greetings,
          people, time, food, places, transport, verbs, adjectives, numbers, and
          survival phrases.
        </p>
      </section>
      <VocabularyBrowser />
    </AppShell>
  );
}
