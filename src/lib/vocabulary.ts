import {
  BEGINNER_VOCABULARY,
  TOPIC_LABELS,
  type Topic,
  type VocabularyEntry,
} from "@/data/korean-beginner-vocabulary";

export type { VocabularyEntry, Topic };
export { BEGINNER_VOCABULARY, TOPIC_LABELS };

const vocabularyById = new Map(
  BEGINNER_VOCABULARY.map((entry) => [entry.id, entry]),
);

export function getVocabularyById(id: string): VocabularyEntry | undefined {
  return vocabularyById.get(id);
}

export function getAllVocabulary(): VocabularyEntry[] {
  return BEGINNER_VOCABULARY;
}

export function searchVocabulary(
  query: string,
  topic?: Topic | "all",
): VocabularyEntry[] {
  const normalized = query.trim().toLowerCase();
  return BEGINNER_VOCABULARY.filter((entry) => {
    const topicOk = !topic || topic === "all" || entry.topic === topic;
    if (!topicOk) return false;
    if (!normalized) return true;
    return (
      entry.hangul.includes(normalized) ||
      entry.romanization.toLowerCase().includes(normalized) ||
      entry.meaning.toLowerCase().includes(normalized) ||
      entry.id.toLowerCase().includes(normalized)
    );
  });
}

export function shuffleInPlace<T>(items: T[], random = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function pickRandomWithoutImmediateRepeat<T extends { id: string }>(
  candidates: T[],
  recentIds: string[],
  random = Math.random,
): T | undefined {
  if (candidates.length === 0) return undefined;
  const recent = new Set(recentIds.slice(-3));
  const preferred = candidates.filter((item) => !recent.has(item.id));
  const pool = preferred.length > 0 ? preferred : candidates;
  return pool[Math.floor(random() * pool.length)];
}
