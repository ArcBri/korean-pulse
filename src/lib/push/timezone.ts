export type LocalClock = {
  dateKey: string;
  hour: number;
  slotKey: string;
};

/** Local calendar date + hour for a timezone (hour 0–23). */
export function getLocalClock(now: Date, timeZone: string): LocalClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const year = lookup("year");
  const month = lookup("month");
  const day = lookup("day");
  const hour = Number(lookup("hour"));

  const dateKey = `${year}-${month}-${day}`;
  return {
    dateKey,
    hour,
    slotKey: `${dateKey}T${String(hour).padStart(2, "0")}`,
  };
}

export function isHourInSchedule(
  hour: number,
  startHour: number,
  endHour: number,
): boolean {
  const start = clampHour(startHour);
  const end = clampHour(endHour);
  if (end < start) return false;
  return hour >= start && hour <= end;
}

function clampHour(hour: number): number {
  if (!Number.isFinite(hour)) return 0;
  return Math.min(23, Math.max(0, Math.floor(hour)));
}

export function shouldSendHourlyReminder(options: {
  now?: Date;
  timeZone: string;
  startHour: number;
  endHour: number;
  lastNotifiedSlot?: string | null;
}): { send: boolean; slotKey: string; hour: number } {
  const now = options.now ?? new Date();
  const clock = getLocalClock(now, options.timeZone);
  const inWindow = isHourInSchedule(
    clock.hour,
    options.startHour,
    options.endHour,
  );
  const alreadySent = options.lastNotifiedSlot === clock.slotKey;
  return {
    send: inWindow && !alreadySent,
    slotKey: clock.slotKey,
    hour: clock.hour,
  };
}
