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
import { shouldSendHourlyReminder } from "@/lib/push/timezone";
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
  };

  for (const { record } of subscriptions) {
    const decision = shouldSendHourlyReminder({
      now,
      timeZone: record.timeZone || "UTC",
      startHour: record.startHour,
      endHour: record.endHour,
      lastNotifiedSlot: record.lastNotifiedSlot,
    });

    if (!decision.send) {
      result.skipped += 1;
      continue;
    }

    const outcome = await sendGenericPush(record);
    if (outcome === "sent") {
      await markNotified(record.endpoint, decision.slotKey);
      result.sent += 1;
    } else if (outcome === "gone") {
      result.removed += 1;
    } else {
      result.errors += 1;
    }
  }

  return result;
}
