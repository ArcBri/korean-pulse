export function getVapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return key || null;
}

export function getVapidPrivateKey(): string | null {
  const key = process.env.VAPID_PRIVATE_KEY?.trim();
  return key || null;
}

/** Apple requires JWT `sub` to be a mailto: or https: URI. */
export function normalizeVapidSubject(raw: string | null | undefined): string {
  const value = raw?.trim() || "mailto:noreply@hangul-hour.app";
  if (/^mailto:/i.test(value) || /^https:\/\//i.test(value)) {
    return value;
  }
  // Common misconfig: bare email without mailto:
  if (value.includes("@") && !value.includes("://")) {
    return `mailto:${value}`;
  }
  return value;
}

export function getVapidSubject(): string {
  return normalizeVapidSubject(process.env.VAPID_SUBJECT);
}

export function isValidVapidSubject(subject = getVapidSubject()): boolean {
  return /^mailto:[^\s]+@.+/i.test(subject) || /^https:\/\/[^\s]+/i.test(subject);
}

export function isPushConfigured(): boolean {
  return Boolean(
    getVapidPublicKey() &&
      getVapidPrivateKey() &&
      process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

export function getCronSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  return secret || null;
}

export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = getCronSecret();
  if (!secret) {
    // Allow only when explicitly running without a secret in local/dev.
    return process.env.NODE_ENV !== "production";
  }

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const headerSecret = request.headers.get("x-cron-secret");
  return headerSecret === secret;
}
