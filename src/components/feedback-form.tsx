"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FEEDBACK_DAILY_LIMIT,
  FEEDBACK_EMAIL,
  FEEDBACK_INSTANCE_STORAGE_KEY,
  FEEDBACK_SUBJECT_PREFIX,
  FEEDBACK_USAGE_STORAGE_KEY,
  buildFeedbackMailto,
  createFeedbackInstanceId,
  readFeedbackUsage,
  remainingFeedbackToday,
  type FeedbackUsage,
} from "@/lib/feedback";

type DeliveryMode = "loading" | "resend" | "mailto";

function loadInstanceId(): string {
  try {
    const existing = window.localStorage.getItem(FEEDBACK_INSTANCE_STORAGE_KEY);
    if (existing) return existing;
    const created = createFeedbackInstanceId();
    window.localStorage.setItem(FEEDBACK_INSTANCE_STORAGE_KEY, created);
    return created;
  } catch {
    return createFeedbackInstanceId();
  }
}

function loadUsage(): FeedbackUsage {
  try {
    return readFeedbackUsage(
      window.localStorage.getItem(FEEDBACK_USAGE_STORAGE_KEY),
    );
  } catch {
    return readFeedbackUsage(null);
  }
}

function saveUsage(usage: FeedbackUsage) {
  try {
    window.localStorage.setItem(
      FEEDBACK_USAGE_STORAGE_KEY,
      JSON.stringify(usage),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function FeedbackForm() {
  const [subject, setSubject] = useState(FEEDBACK_SUBJECT_PREFIX);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<DeliveryMode>("loading");
  const [usage, setUsage] = useState<FeedbackUsage>({ dateKey: "", count: 0 });
  const [instanceId, setInstanceId] = useState("");

  useEffect(() => {
    setInstanceId(loadInstanceId());
    setUsage(loadUsage());

    void fetch("/api/feedback")
      .then(async (response) => {
        if (!response.ok) throw new Error("status failed");
        const data = (await response.json()) as { resendConfigured?: boolean };
        setMode(data.resendConfigured ? "resend" : "mailto");
      })
      .catch(() => setMode("mailto"));
  }, []);

  const remaining = remainingFeedbackToday(usage);
  const limitReached = remaining <= 0;

  const openMailtoFallback = (trimmed: string) => {
    window.location.href = buildFeedbackMailto({
      subject,
      message: trimmed,
    });
    setStatus(
      "Opening your email app. If nothing opens, write us at the address above.",
    );
  };

  const submit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setStatus("Add a short message before sending.");
      return;
    }

    if (limitReached) {
      setStatus(
        `You've already sent ${FEEDBACK_DAILY_LIMIT} feedbacks today on this device. Try again tomorrow.`,
      );
      return;
    }

    if (mode !== "resend") {
      openMailtoFallback(trimmed);
      return;
    }

    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message: trimmed,
          instanceId,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        code?: string;
        message?: string;
        remaining?: number;
      };

      if (response.status === 429 || data.code === "daily_limit") {
        const nextUsage = {
          ...loadUsage(),
          count: FEEDBACK_DAILY_LIMIT,
        };
        saveUsage(nextUsage);
        setUsage(nextUsage);
        setStatus(
          data.message ||
            `You've reached today's limit of ${FEEDBACK_DAILY_LIMIT} feedback messages. Try again tomorrow.`,
        );
        return;
      }

      if (response.status === 503 || data.code === "resend_unconfigured") {
        setMode("mailto");
        openMailtoFallback(trimmed);
        return;
      }

      if (!response.ok || !data.ok) {
        setStatus(
          data.message ||
            "Could not send right now. You can still email us with the address above.",
        );
        return;
      }

      const current = loadUsage();
      const nextUsage = {
        dateKey: current.dateKey,
        count: current.count + 1,
      };
      saveUsage(nextUsage);
      setUsage(nextUsage);
      setMessage("");
      const left =
        typeof data.remaining === "number"
          ? data.remaining
          : remainingFeedbackToday(nextUsage);
      setStatus(
        left > 0
          ? `Thanks — feedback sent. You can send ${left} more today.`
          : `Thanks — feedback sent. You've used both of today's ${FEEDBACK_DAILY_LIMIT} messages.`,
      );
    } catch {
      setStatus(
        "Network error. You can still reach us via the email link above.",
      );
    } finally {
      setBusy(false);
    }
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
            . Limit: {FEEDBACK_DAILY_LIMIT} messages per day on this device
            {mode === "resend"
              ? " (sent in-app)."
              : mode === "mailto"
                ? " — email sending isn’t configured here, so we’ll open your mail app."
                : "."}
          </p>

          <div className="mt-4 space-y-3">
            <label className="block space-y-2 text-sm">
              <span className="text-[color:var(--muted)]">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                disabled={busy || limitReached}
                className="h-10 w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] disabled:opacity-60"
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-[color:var(--muted)]">Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                placeholder="What should we improve?"
                disabled={busy || limitReached}
                className="w-full resize-y rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] disabled:opacity-60"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void submit()}
                disabled={busy || limitReached || mode === "loading"}
                className="bg-[color:var(--accent)] text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-deep)]"
              >
                {busy
                  ? "Sending…"
                  : mode === "resend"
                    ? "Send feedback"
                    : "Open email to send"}
              </Button>
              <p className="text-xs text-[color:var(--muted)]">
                {limitReached
                  ? `Daily limit reached (${FEEDBACK_DAILY_LIMIT}/${FEEDBACK_DAILY_LIMIT})`
                  : `${remaining} of ${FEEDBACK_DAILY_LIMIT} left today`}
              </p>
            </div>
            {status ? (
              <p role="status" className="text-sm text-[color:var(--accent)]">
                {status}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
