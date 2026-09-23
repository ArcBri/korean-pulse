"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FEEDBACK_EMAIL,
  FEEDBACK_SUBJECT_PREFIX,
  buildFeedbackMailto,
} from "@/lib/feedback";

export function FeedbackForm() {
  const [subject, setSubject] = useState(FEEDBACK_SUBJECT_PREFIX);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string>("");

  const submit = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setStatus("Add a short message before sending.");
      return;
    }

    const href = buildFeedbackMailto({ subject, message: trimmed });
    window.location.href = href;
    setStatus(
      "Opening your email app. If nothing opens, copy the address below and write us directly.",
    );
  };

  return (
    <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/85 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-[color:var(--accent-soft)] p-2 text-[color:var(--accent)]">
          <MessageSquare className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl text-[color:var(--ink)]">
            Feedback
          </h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Ideas, bugs, or vocabulary requests go to{" "}
            <a
              href={`mailto:${FEEDBACK_EMAIL}`}
              className="font-medium text-[color:var(--accent)] underline-offset-2 hover:underline"
            >
              {FEEDBACK_EMAIL}
            </a>
            . This opens your mail app — nothing is uploaded to our servers.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block space-y-2 text-sm">
              <span className="text-[color:var(--muted)]">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="h-10 w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-[color:var(--muted)]">Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                placeholder="What should we improve?"
                className="w-full resize-y rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
              />
            </label>
            <Button
              type="button"
              onClick={submit}
              className="bg-[color:var(--accent)] text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-deep)]"
            >
              Open email to send
            </Button>
            {status ? (
              <p
                role="status"
                className="text-sm text-[color:var(--accent)]"
              >
                {status}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
