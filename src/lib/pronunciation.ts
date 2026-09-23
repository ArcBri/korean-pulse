/**
 * Learner-facing syllable pronunciation from Hangul.
 * Space-separated chunks (e.g. 표준 → "pyoh joon") — English-friendly cues,
 * not strict Revised Romanization.
 */

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

const INITIALS = [
  "g",
  "kk",
  "n",
  "d",
  "tt",
  "r",
  "m",
  "b",
  "pp",
  "s",
  "ss",
  "",
  "j",
  "jj",
  "ch",
  "k",
  "t",
  "p",
  "h",
] as const;

/** English-leaning vowel spellings for reading aloud. */
const VOWELS = [
  "ah", // ㅏ
  "eh", // ㅐ
  "yah", // ㅑ
  "yeh", // ㅒ
  "uh", // ㅓ
  "eh", // ㅔ
  "yuh", // ㅕ
  "yeh", // ㅖ
  "oh", // ㅗ
  "wah", // ㅘ
  "weh", // ㅙ
  "weh", // ㅚ (approx)
  "yoh", // ㅛ
  "oo", // ㅜ
  "wuh", // ㅝ
  "weh", // ㅞ
  "wee", // ㅟ
  "yoo", // ㅠ
  "eu", // ㅡ
  "ui", // ㅢ
  "ee", // ㅣ
] as const;

const FINALS = [
  "",
  "k",
  "k",
  "k",
  "n",
  "n",
  "n",
  "t",
  "l",
  "l",
  "l",
  "l",
  "l",
  "l",
  "l",
  "l",
  "m",
  "p",
  "p",
  "t",
  "t",
  "ng",
  "t",
  "t",
  "k",
  "t",
  "p",
  "t",
] as const;

function isHangulSyllable(char: string): boolean {
  const code = char.codePointAt(0);
  return code !== undefined && code >= HANGUL_BASE && code <= HANGUL_END;
}

function syllableToCue(char: string): string {
  const code = char.codePointAt(0);
  if (code === undefined || code < HANGUL_BASE || code > HANGUL_END) {
    return char;
  }

  const index = code - HANGUL_BASE;
  const initial = INITIALS[Math.floor(index / 588)] ?? "";
  const vowel = VOWELS[Math.floor((index % 588) / 28)] ?? "";
  const final = FINALS[index % 28] ?? "";

  return `${initial}${vowel}${final}`;
}

/**
 * Turn Hangul (and mixed text) into space-separated pronunciation cues.
 * Non-Hangul runs (spaces, ?, Latin) are kept as separators / punctuation.
 */
export function hangulPronunciationGuide(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const chunks: string[] = [];
  let buffer = "";

  const flushBuffer = () => {
    if (!buffer) return;
    chunks.push(buffer);
    buffer = "";
  };

  for (const char of trimmed) {
    if (isHangulSyllable(char)) {
      flushBuffer();
      chunks.push(syllableToCue(char));
      continue;
    }

    if (/\s/.test(char)) {
      flushBuffer();
      continue;
    }

    // Keep light punctuation attached to the previous cue when possible.
    if (/[?,!.…]/.test(char) && chunks.length > 0 && !buffer) {
      chunks[chunks.length - 1] = `${chunks[chunks.length - 1]}${char}`;
      continue;
    }

    buffer += char;
  }

  flushBuffer();
  return chunks.join(" ");
}
