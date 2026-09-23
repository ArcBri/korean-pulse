import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  FEEDBACK_DAILY_LIMIT,
  FEEDBACK_SUBJECT_PREFIX,
} from "@/lib/feedback";
import {
  assertUnderFeedbackLimit,
  feedbackBucketKeys,
  getFeedbackFromAddress,
  getFeedbackToAddress,
  hashIp,
  isResendConfigured,
  recordFeedbackSend,
} from "@/lib/feedback-server";

export const runtime = "nodejs";

type FeedbackBody = {
  subject?: string;
  message?: string;
  instanceId?: string;
};

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function GET() {
  return NextResponse.json({
    resendConfigured: isResendConfigured(),
    dailyLimit: FEEDBACK_DAILY_LIMIT,
    to: getFeedbackToAddress(),
  });
}

export async function POST(request: Request) {
  if (!isResendConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        code: "resend_unconfigured",
        message:
          "Email sending isn’t configured on this deployment yet. Use the mail-app fallback instead.",
      },
      { status: 503 },
    );
  }

  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_json", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const instanceId = body.instanceId?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const subject = (body.subject?.trim() || FEEDBACK_SUBJECT_PREFIX).slice(0, 160);

  if (!instanceId || instanceId.length > 80) {
    return NextResponse.json(
      { ok: false, code: "missing_instance", message: "Missing app instance id." },
      { status: 400 },
    );
  }
  if (!message || message.length < 3) {
    return NextResponse.json(
      { ok: false, code: "empty_message", message: "Add a short message before sending." },
      { status: 400 },
    );
  }
  if (message.length > 4000) {
    return NextResponse.json(
      { ok: false, code: "too_long", message: "Keep feedback under 4000 characters." },
      { status: 400 },
    );
  }

  const ipHash = hashIp(clientIp(request));
  const keys = feedbackBucketKeys({ instanceId, ipHash });
  const gate = assertUnderFeedbackLimit(keys);
  if (!gate.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: "daily_limit",
        message: gate.message,
        remaining: 0,
        dailyLimit: FEEDBACK_DAILY_LIMIT,
      },
      { status: 429 },
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = getFeedbackToAddress();
  const from = getFeedbackFromAddress();

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    text: [
      message,
      "",
      "---",
      `Hangul Hour feedback`,
      `Instance: ${instanceId}`,
      `Sent: ${new Date().toISOString()}`,
    ].join("\n"),
  });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        code: "resend_error",
        message: error.message || "Could not send feedback right now.",
      },
      { status: 502 },
    );
  }

  const count = recordFeedbackSend(keys);
  return NextResponse.json({
    ok: true,
    id: data?.id ?? null,
    remaining: Math.max(0, FEEDBACK_DAILY_LIMIT - count),
    dailyLimit: FEEDBACK_DAILY_LIMIT,
  });
}
