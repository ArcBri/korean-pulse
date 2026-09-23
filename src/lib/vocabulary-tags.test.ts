import { describe, expect, it } from "vitest";
import { getEntryTags, TOPIC_LABELS } from "@/data/korean-beginner-vocabulary";

describe("getEntryTags", () => {
  it("shows a single Verb tag for verb-topic entries", () => {
    expect(
      getEntryTags({
        id: "gada",
        hangul: "가다",
        romanization: "gada",
        meaning: "to go",
        topic: "verbs",
        partOfSpeech: "verb",
      }),
    ).toEqual(["Verb"]);
  });

  it("keeps topic + POS when they add information", () => {
    expect(
      getEntryTags({
        id: "bap",
        hangul: "밥",
        romanization: "bap",
        meaning: "rice / meal",
        topic: "food",
        partOfSpeech: "noun",
      }),
    ).toEqual(["Food", "Noun"]);
  });

  it("labels the verbs topic filter as Verb", () => {
    expect(TOPIC_LABELS.verbs).toBe("Verb");
  });
});
