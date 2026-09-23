"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  searchVocabulary,
  TOPIC_LABELS,
  type Topic,
} from "@/lib/vocabulary";
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
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Hangul, romanization, or English"
          className="h-12 bg-[color:var(--surface-strong)]"
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
              {item === "all" ? "All topics" : TOPIC_LABELS[item]}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--line)] p-8 text-center text-[color:var(--muted)]">
          No words matched that search. Try a topic filter or a shorter query.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {results.map((word) => (
            <li
              key={word.id}
              className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-4"
            >
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{TOPIC_LABELS[word.topic]}</Badge>
                <Badge variant="outline" className="capitalize">
                  {word.partOfSpeech}
                </Badge>
              </div>
              <p className="font-hangul text-3xl text-[color:var(--ink)]">
                {word.hangul}
              </p>
              <p className="mt-1 text-[color:var(--accent)]">
                {word.romanization}
              </p>
              <p className="text-sm text-[color:var(--muted)]">{word.meaning}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
