"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  getEntryTags,
  searchVocabulary,
  TOPIC_LABELS,
  type Topic,
} from "@/lib/vocabulary";
import { hangulPronunciationGuide } from "@/lib/pronunciation";
import { cn } from "@/lib/utils";

const TOPICS: Array<Topic | "all"> = [
  "all",
  "greetings",
  "people",
  "time",
  "food",
  "places",
  "transport",
  "verbs",
  "adjectives",
  "numbers",
  "phrases",
];

export function VocabularyBrowser() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic | "all">("all");

  const results = useMemo(
    () => searchVocabulary(query, topic),
    [query, topic],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Hangul, English, or pronunciation"
          className="h-12 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
        />
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTopic(item)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition",
                topic === item
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
                  : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--muted)] hover:text-[color:var(--ink)]",
              )}
            >
              {item === "all" ? "All" : TOPIC_LABELS[item]}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--line)] p-8 text-center text-[color:var(--muted)]">
          Nothing matched. Try another topic, or shorten the search.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {results.map((word) => (
            <li
              key={word.id}
              className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-4"
            >
              <div className="mb-2 flex flex-wrap gap-2">
                {getEntryTags(word).map((tag, index) => (
                  <Badge
                    key={tag}
                    variant={index === 0 ? "secondary" : "outline"}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="font-hangul text-3xl text-[color:var(--ink)]">
                {word.hangul}
              </p>
              <p className="mt-1 text-[color:var(--accent)]">
                {hangulPronunciationGuide(word.hangul)}
              </p>
              <p className="text-xs text-[color:var(--muted)]">
                {word.romanization}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {word.meaning}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
