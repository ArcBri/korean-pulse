/**
 * Normalize and compare Hangul typed by the learner against vocab answers.
 */

const ZERO_WIDTH_AND_BOM =
  /[\u200B-\u200D\uFEFF\u2060\u180E]/g;

export function normalizeHangulInput(value: string): string {
  return value
    .replace(ZERO_WIDTH_AND_BOM, "")
    .normalize("NFC")
    .trim();
}

export function hangulInputsMatch(
  typed: string,
  expected: string,
): boolean {
  if (!normalizeHangulInput(typed)) return false;
  return normalizeHangulInput(typed) === normalizeHangulInput(expected);
}
