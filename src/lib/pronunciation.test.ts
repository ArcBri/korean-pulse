import { describe, expect, it } from "vitest";
import { hangulPronunciationGuide } from "@/lib/pronunciation";

describe("hangulPronunciationGuide", () => {
  it("splits 표준 into English-friendly syllable cues", () => {
    expect(hangulPronunciationGuide("표준")).toBe("pyoh joon");
  });

  it("handles multi-syllable words", () => {
    expect(hangulPronunciationGuide("안녕하세요")).toBe(
      "ahn nyuhng hah seh yoh",
    );
  });

  it("keeps phrase punctuation readable", () => {
    expect(hangulPronunciationGuide("어디예요?")).toMatch(/\?$/);
  });
});
