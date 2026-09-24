export type PushSubscriptionKeys = {
  p256dh: string;
  auth: string;
};

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: PushSubscriptionKeys;
  expirationTime?: number | null;
};

export type StoredPushSubscription = {
  endpoint: string;
  keys: PushSubscriptionKeys;
  timeZone: string;
  startHour: number;
  endHour: number;
  updatedAt: string;
  lastNotifiedSlot?: string | null;
  /** Stable per-browser id so re-subscribe replaces old Redis rows. */
  deviceId?: string | null;
};

export type PushSubscribeBody = {
  subscription: PushSubscriptionJSON;
  timeZone: string;
  startHour: number;
  endHour: number;
  deviceId?: string;
};

export const GENERIC_PUSH_PAYLOAD = {
  title: "Hangul Hour",
  body: "Your Hangul Hour word is ready",
  url: "/",
  tag: "hangul-hour-ready",
} as const;
