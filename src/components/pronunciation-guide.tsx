const TIPS = [
  {
    title: "Vowels you’ll see often",
    body: "a like “ah,” eo like “uh,” o like “oh,” u like “oo,” eu like a short grunt between “uh” and “eu,” i like “ee.” Double vowels (ae, e, oe, wi…) are one smooth sound, not two clipped English letters.",
  },
  {
    title: "Consonants that look “soft”",
    body: "g/b/d/j start closer to English g/b/d/j than to k/p/t/ch. At the end of a syllable they often sound more clipped (거의 → geo-ui feels closer to “guh-wee”).",
  },
  {
    title: "Aspirated vs tense",
    body: "Letters with an h (k, t, p, ch) have a puff of air. Doubled letters (kk, tt, pp, ss, jj) are tight and clipped — think a hard stop, not a longer English sound.",
  },
  {
    title: "Batchim (final consonants)",
    body: "A consonant under the vowel is the syllable’s ending. Many finals collapse toward n, ng, m, l, or a soft stop. Read the romanization left to right; don’t invent English spelling.",
  },
  {
    title: "How Hangul Hour writes it",
    body: "The line under each Hangul word is Revised Romanization — a reading aid, not English spelling. Say the Hangul first when you can; use the romanization to check syllables.",
  },
] as const;

export function PronunciationGuide() {
  return (
    <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/85 p-5">
      <h2 className="font-display text-xl text-[color:var(--ink)]">
        Pronunciation guide
      </h2>
      <p className="mt-1 text-sm text-[color:var(--muted)]">
        Quick cues for the romanization under each word. Enough to sound
        closer — not a full linguistics lesson.
      </p>
      <ul className="mt-5 space-y-4">
        {TIPS.map((tip) => (
          <li key={tip.title}>
            <p className="text-sm font-medium text-[color:var(--ink)]">
              {tip.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">
              {tip.body}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-[color:var(--line)] pt-4 text-xs text-[color:var(--muted)]">
        Example: <span className="font-hangul text-[color:var(--ink)]">감사합니다</span>{" "}
        → <span className="text-[color:var(--accent)]">gamsahamnida</span>{" "}
        (gam-sa-ham-ni-da). Stress is fairly even across syllables.
      </p>
    </section>
  );
}
