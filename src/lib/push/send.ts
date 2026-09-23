import webpush from "web-push";
import {
  getVapidPrivateKey,
  getVapidPublicKey,
  getVapidSubject,
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

function configureWebPush(): boolean {
  const publicKey = getVapidPublicKey();
  const privateKey = getVapidPrivateKey();
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(getVapidSubject(), publicKey, privateKey);
  return true;
}

export type CronSendResult = {
  checked: number;
  sent: number;
  skipped: number;
  removed: number;
  errors: number;
  /** Sanitized per-subscription decisions (no endpoint/keys). */
  details: Array<{
    timeZone: string;
    startHour: number;
    endHour: number;
    localHour: number;
    slotKey: string;
    decision: "sent" | "skipped" | "removed" | "error";
    reason?: string;
  }>;
};

async function sendGenericPush(
  record: StoredPushSubscription,
): Promise<"sent" | "gone" | "error"> {
  try {
    await webpush.sendNotification(
      {
        endpoint: record.endpoint,
        keys: record.keys,
      },
      JSON.stringify(GENERIC_PUSH_PAYLOAD),
      {
        TTL: 60 * 60,
        urgency: "normal",
      },
    );
    return "sent";
  } catch (error) {
    const statusCode =
      typeof error === "object" &&
      error &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : null;

    if (statusCode === 404 || statusCode === 410) {
      await deletePushSubscription(record.endpoint);
      return "gone";
    }
    console.error("web-push send failed", error);
    return "error";
  }
}

export async function sendDueHourlyPushes(now = new Date()): Promise<CronSendResult> {
  if (!configureWebPush()) {
    throw new Error("VAPID keys are not configured.");
  }

  const subscriptions = await listPushSubscriptions();
  const result: CronSendResult = {
    checked: subscriptions.length,
    sent: 0,
    skipped: 0,
    removed: 0,
    errors: 0,
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
      });
    } else {
      result.errors += 1;
      result.details.push({
        ...baseDetail,
        decision: "error",
        reason: "web_push_send_failed",
      });
    }
  }

  return result;
}
