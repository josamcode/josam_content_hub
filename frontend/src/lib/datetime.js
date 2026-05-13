function getTimezonePartsForDate(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
}

export function buildIsoFromLocalParts({ dateStr, timeStr, timezone }) {
  if (!dateStr || !timeStr || !timezone) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  if ([y, m, d, hh, mm].some((value) => Number.isNaN(value))) return null;

  let utcMillis = Date.UTC(y, m - 1, d, hh, mm, 0);

  for (let i = 0; i < 3; i += 1) {
    const actual = getTimezonePartsForDate(new Date(utcMillis), timezone);
    const actualUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    );
    const expectedUtc = Date.UTC(y, m - 1, d, hh, mm, 0);
    utcMillis -= actualUtc - expectedUtc;
  }

  return new Date(utcMillis).toISOString();
}

export function isoToLocalParts(iso, timezone) {
  if (!iso || !timezone) return { date: "", time: "" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const obj = Object.fromEntries(
    parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  );

  return {
    date: `${obj.year}-${obj.month}-${obj.day}`,
    time: `${obj.hour}:${obj.minute}`,
  };
}

export function formatScheduledAtInTimezone(iso, timezone) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

const BASE_TIMEZONES = [
  "Africa/Cairo",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
];

export function getTimezoneOptions(extra = []) {
  const set = new Set(BASE_TIMEZONES);
  for (const tz of extra) {
    if (tz) set.add(tz);
  }
  const browser = getBrowserTimezone();
  if (browser) set.add(browser);
  return Array.from(set);
}
