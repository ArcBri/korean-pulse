export type NotificationPayload = {
  title: string;
  body: string;
  tag: string;
  url?: string;
};

export type PushConfigResponse = {
  configured: boolean;
  publicKey: string | null;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.requestPermission();
}

export async function showWordNotification(
  payload: NotificationPayload,
): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission !== "granted") return false;

  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration?.showNotification) {
    await registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      data: { url: payload.url ?? "/" },
    });
    return true;
  }

  new Notification(payload.title, {
    body: payload.body,
    tag: payload.tag,
  });
  return true;
}

export function computeDelayToNextHourBoundary(now = new Date()): number {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return Math.max(250, next.getTime() - now.getTime());
}

export async function fetchPushConfig(): Promise<PushConfigResponse> {
  try {
    const response = await fetch("/api/push/config", { method: "GET" });
    if (!response.ok) {
      return { configured: false, publicKey: null };
    }
    return (await response.json()) as PushConfigResponse;
  } catch {
    return { configured: false, publicKey: null };
  }
}

export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function subscribeToWebPush(options: {
  startHour: number;
  endHour: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "Web Push is not supported in this browser." };
  }

  const config = await fetchPushConfig();
  if (!config.configured || !config.publicKey) {
    return {
      ok: false,
      error:
        "Background push is not configured on the server yet (VAPID + Redis).",
    };
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    return { ok: false, error: "Could not register the service worker." };
  }

  await navigator.serviceWorker.ready;

  // Always create a fresh subscription with the current VAPID public key.
  // Reusing a stale PushSubscription (old key / prior enable) causes Apple 403.
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    try {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: existing.endpoint }),
      });
    } catch {
      // Continue; local unsubscribe still clears the browser subscription.
    }
    await existing.unsubscribe().catch(() => undefined);
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      config.publicKey,
    ) as BufferSource,
  });

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      timeZone: getDeviceTimeZone(),
      startHour: options.startHour,
      endHour: options.endHour,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    return {
      ok: false,
      error: payload?.error || "Failed to save the push subscription.",
    };
  }

  return { ok: true };
}

export async function syncWebPushSchedule(options: {
  startHour: number;
  endHour: number;
}): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return false;

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      timeZone: getDeviceTimeZone(),
      startHour: options.startHour,
      endHour: options.endHour,
    }),
  });
  return response.ok;
}

export async function unsubscribeFromWebPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  try {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  } catch {
    // Local unsubscribe should still proceed if the API is unreachable.
  }

  await subscription.unsubscribe();
}

export async function hasActiveWebPushSubscription(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return Boolean(subscription);
}
