import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { StoredPushSubscription } from "@/lib/push/types";

const SUB_INDEX_KEY = "hangul-hour:push:subs";

function subscriptionId(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}

function subscriptionKey(id: string): string {
  return `hangul-hour:push:sub:${id}`;
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function isPushStoreConfigured(): boolean {
  return getRedis() !== null;
}

export async function savePushSubscription(
  record: StoredPushSubscription,
): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Push store is not configured (Upstash Redis env missing).");
  }

  // Replacing a device's subscription: drop older rows with the same deviceId
  // so force-refresh / re-Enable does not leave orphan Apple endpoints.
  if (record.deviceId) {
    const existing = await listPushSubscriptions();
    for (const { record: other } of existing) {
      if (
        other.deviceId === record.deviceId &&
        other.endpoint !== record.endpoint
      ) {
        await deletePushSubscription(other.endpoint);
      }
    }
  }

  const id = subscriptionId(record.endpoint);
  const key = subscriptionKey(id);
  const previous = (await redis.get(key)) as StoredPushSubscription | null;
  const next: StoredPushSubscription = {
    ...record,
    lastNotifiedSlot:
      record.lastNotifiedSlot ?? previous?.lastNotifiedSlot ?? null,
  };
  await redis.set(key, next);
  await redis.sadd(SUB_INDEX_KEY, id);
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Push store is not configured (Upstash Redis env missing).");
  }

  const id = subscriptionId(endpoint);
  await redis.del(subscriptionKey(id));
  await redis.srem(SUB_INDEX_KEY, id);
}

export async function listPushSubscriptions(): Promise<
  Array<{ id: string; record: StoredPushSubscription }>
> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Push store is not configured (Upstash Redis env missing).");
  }

  const ids = (await redis.smembers(SUB_INDEX_KEY)) as string[];
  if (ids.length === 0) return [];

  const results: Array<{ id: string; record: StoredPushSubscription }> = [];
  for (const id of ids) {
    const record = (await redis.get(
      subscriptionKey(id),
    )) as StoredPushSubscription | null;
    if (record?.endpoint && record.keys?.p256dh && record.keys?.auth) {
      results.push({ id, record });
    } else {
      await redis.srem(SUB_INDEX_KEY, id);
    }
  }
  return results;
}

export async function markNotified(
  endpoint: string,
  slotKey: string,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const id = subscriptionId(endpoint);
  const key = subscriptionKey(id);
  const record = (await redis.get(key)) as StoredPushSubscription | null;
  if (!record) return;
  await redis.set(key, { ...record, lastNotifiedSlot: slotKey });
}
