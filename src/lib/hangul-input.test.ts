import { describe, expect, it } from "vitest";
import {
  hangulInputsMatch,
  normalizeHangulInput,
} from "@/lib/hangul-input";

describe("normalizeHangulInput", () => {
  it("trims whitespace", () => {
    expect(normalizeHangulInput("  감사합니다  ")).toBe("감사합니다");
  });

  it("strips zero-width and BOM characters", () => {
    expect(normalizeHangulInput("\uFEFF감\u200B사\u200D합니다")).toBe(
      "감사합니다",
    );
  });

  it("applies NFC normalization", () => {
    // 가 as NFD (ㄱ + ㅏ) vs NFC
    const nfd = "\u1100\u1161";
    const nfc = "가";
    expect(normalizeHangulInput(nfd)).toBe(nfc);
  });
});

describe("hangulInputsMatch", () => {
  it("matches exact Hangul", () => {
    expect(hangulInputsMatch("죄송합니다", "죄송합니다")).toBe(true);
  });

  it("matches after trim and ZW strip", () => {
    expect(hangulInputsMatch("  죄송\u200B합니다 ", "죄송합니다")).toBe(
      true,
    );
  });

  it("rejects wrong Hangul", () => {
    expect(hangulInputsMatch("감사합니다", "죄송합니다")).toBe(false);
  });

  it("rejects empty / whitespace-only typed input", () => {
    expect(hangulInputsMatch("", "가")).toBe(false);
    expect(hangulInputsMatch("   ", "가")).toBe(false);
  });

  it("preserves meaningful spaces inside phrases", () => {
    expect(hangulInputsMatch("어디 예요", "어디예요")).toBe(false);
    expect(hangulInputsMatch("어디예요", "어디예요")).toBe(true);
  });
});
