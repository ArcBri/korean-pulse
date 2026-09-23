import webpush from "web-push";
import {
  getVapidPrivateKey,
  getVapidPublicKey,
  getVapidSubject,
  isValidVapidSubject,
} from "@/lib/push/config";
import {
  deletePushSubscription,
  listPushSubscriptions,
  markNotified,
} from "@/lib/push/store";
import { isHourInSchedule, shouldSendHourlyReminder } from "@/lib/push/timezone";
import {
  GENERIC_PUSH_PAYLOAD,
  type StoredPushSubscription,
} from "@/lib/push/types";

function configureWebPush(): { ok: true } | { ok: false; error: string } {
  const publicKey = getVapidPublicKey();
  const privateKey = getVapidPrivateKey();
  if (!publicKey || !privateKey) {
    return { ok: false, error: "VAPID keys are not configured." };
  }

  const subject = getVapidSubject();
  if (!isValidVapidSubject(subject)) {
    return {
      ok: false,
      error:
        "VAPID_SUBJECT must be a mailto:address or https:// URL (Apple rejects BadJwtToken otherwise).",
    };
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return { ok: true };
}

export type PushSendFailure = {
  statusCode: number | null;
  endpointHost: string | null;
  body: string | null;
  reason: string;
  hint: string;
};

export type CronDetail = {
  timeZone: string;
  startHour: number;
  endHour: number;
  localHour: number;
  slotKey: string;
  decision: "sent" | "skipped" | "removed" | "error";
  reason?: string;
  statusCode?: number | null;
  endpointHost?: string | null;
  body?: string | null;
  hint?: string;
};

export type CronSendResult = {
  checked: number;
  sent: number;
  skipped: number;
  removed: number;
  errors: number;
  vapidSubject: string;
  details: CronDetail[];
};

function endpointHost(endpoint: string): string | null {
  try {
    return new URL(endpoint).host;
  } catch {
    return null;
  }
}

export function classifyWebPushError(error: unknown): PushSendFailure {
  const statusCode =
    typeof error === "object" &&
    error &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : null;

  const bodyRaw =
    typeof error === "object" &&
    error &&
    "body" in error &&
    typeof (error as { body?: unknown }).body === "string"
      ? (error as { body: string }).body
      : null;

  const endpoint =
    typeof error === "object" &&
    error &&
    "endpoint" in error &&
    typeof (error as { endpoint?: unknown }).endpoint === "string"
      ? (error as { endpoint: string }).endpoint
      : null;

  const body = bodyRaw ? bodyRaw.slice(0, 300) : null;
  const host = endpoint ? endpointHost(endpoint) : null;
  const lower = `${body ?? ""}`.toLowerCase();

  if (statusCode === 404 || statusCode === 410) {
    return {
      statusCode,
      endpointHost: host,
      body,
      reason: "subscription_expired",
      hint: "Subscription is gone. Re-enable notifications from the Home Screen app.",
    };
  }

  if (statusCode === 403 || lower.includes("badjwttoken")) {
    return {
      statusCode,
      endpointHost: host,
      body,
      reason: "vapid_auth_failed",
      hint: "Apple rejected VAPID auth. Set VAPID_SUBJECT to mailto:you@real-email.com (must match the same VAPID key pair used when the device subscribed), redeploy, then Turn off + Enable notifications again.",
    };
  }

  if (statusCode === 400) {
    return {
      statusCode,
      endpointHost: host,
      body,
      reason: "bad_request",
      hint: "Push service rejected the payload or subscription keys. Re-subscribe from the device.",
    };
  }

  if (statusCode === 413) {
    return {
      statusCode,
      endpointHost: host,
      body,
      reason: "payload_too_large",
      hint: "Notification payload exceeded the push service limit.",
    };
  }

  if (statusCode === 429) {
    return {
      statusCode,
      endpointHost: host,
      body,
      reason: "rate_limited",
      hint: "Push service rate-limited this destination. Retry next hour.",
    };
  }

  return {
    statusCode,
    endpointHost: host,
    body,
    reason: "web_push_send_failed",
    hint: "See statusCode/body. Common fixes: fix VAPID_SUBJECT, rotate/resync subscription, confirm Apple endpoint reachable from Vercel.",
  };
}

async function sendGenericPush(
  record: StoredPushSubscription,
): Promise<"sent" | "gone" | "error" | { error: PushSendFailure }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: record.endpoint,
        keys: record.keys,
      },
      JSON.stringify(GENERIC_PUSH_PAYLOAD),
      {
        TTL: 60 * 60,
        // Prefer high so iOS surfaces the user-visible reminder promptly.
        urgency: "high",
      },
    );
    return "sent";
  } catch (error) {
    const failure = classifyWebPushError(error);
    if (failure.reason === "subscription_expired") {
      await deletePushSubscription(record.endpoint);
      return "gone";
    }
    // Stale VAPID/auth: drop the Redis row so the next Enable creates a fresh sub.
    if (failure.reason === "vapid_auth_failed") {
      await deletePushSubscription(record.endpoint);
      console.error("web-push vapid auth failed; removed subscription", failure);
      return { error: failure };
    }
    console.error("web-push send failed", failure, error);
    return { error: failure };
  }
}

export async function sendDueHourlyPushes(now = new Date()): Promise<CronSendResult> {
  const configured = configureWebPush();
  if (!configured.ok) {
    throw new Error(configured.error);
  }

  const subscriptions = await listPushSubscriptions();
  const result: CronSendResult = {
    checked: subscriptions.length,
    sent: 0,
    skipped: 0,
    removed: 0,
    errors: 0,
    vapidSubject: getVapidSubject(),
    details: [],
  };

  for (const { record } of subscriptions) {
    const timeZone = record.timeZone || "UTC";
    const decision = shouldSendHourlyReminder({
      now,
      timeZone,
      startHour: record.startHour,
      endHour: record.endHour,
      lastNotifiedSlot: record.lastNotifiedSlot,
    });

    const baseDetail = {
      timeZone,
      startHour: record.startHour,
      endHour: record.endHour,
      localHour: decision.hour,
      slotKey: decision.slotKey,
      endpointHost: endpointHost(record.endpoint),
    };

    if (!decision.send) {
      result.skipped += 1;
      const outside = !isHourInSchedule(
        decision.hour,
        record.startHour,
        record.endHour,
      );
      result.details.push({
        ...baseDetail,
        decision: "skipped",
        reason: outside
          ? "outside_study_window"
          : record.lastNotifiedSlot === decision.slotKey
            ? "already_notified_slot"
            : "skipped",
      });
      continue;
    }

    const outcome = await sendGenericPush(record);
    if (outcome === "sent") {
      await markNotified(record.endpoint, decision.slotKey);
      result.sent += 1;
      result.details.push({ ...baseDetail, decision: "sent" });
    } else if (outcome === "gone") {
      result.removed += 1;
      result.details.push({
        ...baseDetail,
        decision: "removed",
        reason: "subscription_expired",
        hint: "Re-enable notifications from the Home Screen app.",
      });
    } else {
      result.errors += 1;
      const failure = typeof outcome === "object" ? outcome.error : null;
      result.details.push({
        ...baseDetail,
        decision: "error",
        reason: failure?.reason ?? "web_push_send_failed",
        statusCode: failure?.statusCode ?? null,
        body: failure?.body ?? null,
        hint: failure?.hint,
      });
      // vapid_auth_failed already deleted the Redis row
      if (failure?.reason === "vapid_auth_failed") {
        result.removed += 1;
      }
    }
  }

  return result;
}
