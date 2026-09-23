const TIPS = [
  {
    title: "Read the green line under each word",
    body: "That’s a say-it-out-loud guide, split by Hangul block — e.g. 표준 → pyoh joon. Stress is fairly even; don’t force English rhythm.",
  },
  {
    title: "What the cues mean",
    body: "ah / uh / oh / oo / ee / eu are rough English matches. Aspirated letters (k, t, p, ch) have a puff of air; doubled ones (kk, tt, pp…) are tight and clipped.",
  },
  {
    title: "The smaller line underneath",
    body: "That’s Revised Romanization (the usual textbook spelling). Handy for search and dictionaries; the green line is for speaking.",
  },
] as const;

export function PronunciationGuide() {
  return (
    <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/85 p-5">
      <h2 className="font-display text-xl text-[color:var(--ink)]">
        How to read pronunciation
      </h2>
      <p className="mt-1 text-sm text-[color:var(--muted)]">
        Every card already shows a syllable-by-syllable guide under the Hangul.
        These notes explain that line.
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
    </section>
  );
}
