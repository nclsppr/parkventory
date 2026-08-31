import type { AvailabilityItem } from "../types";

export const DEFAULT_SITE_TIME_ZONE = "Europe/Paris";

function calendarParts(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function referenceInstant(value: string | Date, timeZone: string) {
  if (value instanceof Date) return value;
  const localDateTime = /^(\d{4})-(\d{2})-(\d{2})(?:T([01]\d|2[0-3]):([0-5]\d))?$/.exec(value);
  if (!localDateTime) return new Date(value);

  const [, year, month, day, hour = "12", minute = "00"] = localDateTime;
  const desiredAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  let candidate = desiredAsUtc;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]),
    );
    const actualAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    candidate += desiredAsUtc - actualAsUtc;
  }
  return new Date(candidate);
}

export function dateInputValue(
  daysFromToday = 0,
  timeZone = DEFAULT_SITE_TIME_ZONE,
  now = new Date(),
) {
  const { year, month, day } = calendarParts(now, timeZone);
  const shiftedDate = new Date(Date.UTC(year, month - 1, day + daysFromToday));
  return shiftedDate.toISOString().slice(0, 10);
}

export function formatInputDate(
  value: string,
  intlLocale = "fr-FR",
  fallback = "Date à préciser",
) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return fallback;
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function formatInputTime(
  value: string,
  intlLocale = "fr-FR",
  fallback = "—",
) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return fallback;
  }
  return new Intl.DateTimeFormat(intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, 0, 1, hour, minute)));
}

export function formatTimeRange(
  from: string,
  to: string,
  intlLocale = "fr-FR",
  fallback = "—",
) {
  const formattedFrom = formatInputTime(from, intlLocale, fallback);
  const formattedTo = formatInputTime(to, intlLocale, fallback);
  return formattedFrom === fallback || formattedTo === fallback
    ? fallback
    : `${formattedFrom} – ${formattedTo}`;
}

export function formatTimeRangePhrase(
  from: string,
  to: string,
  intlLocale = "fr-FR",
  fallback = "—",
) {
  const formattedFrom = formatInputTime(from, intlLocale, fallback);
  const formattedTo = formatInputTime(to, intlLocale, fallback);
  if (formattedFrom === fallback || formattedTo === fallback) return fallback;

  const language = intlLocale.split("-")[0].toLowerCase();
  if (language === "de") return `von ${formattedFrom} bis ${formattedTo} Uhr`;
  if (language === "lb") return `vun ${formattedFrom} bis ${formattedTo} Auer`;
  return `${formattedFrom} – ${formattedTo}`;
}

export function formatAvailabilityDate(
  item: Pick<AvailabilityItem, "localDate" | "dateLabel">,
  intlLocale: string,
  fallback: string,
) {
  return item.localDate
    ? formatInputDate(item.localDate, intlLocale, item.dateLabel ?? fallback)
    : item.dateLabel ?? fallback;
}

export function formatAvailabilityTime(
  item: Pick<AvailabilityItem, "localFrom" | "localTo" | "timeLabel">,
  intlLocale: string,
  fallback: string,
) {
  return item.localFrom && item.localTo
    ? formatTimeRange(item.localFrom, item.localTo, intlLocale, item.timeLabel ?? fallback)
    : item.timeLabel ?? fallback;
}

export function formatAvailabilityTimePhrase(
  item: Pick<AvailabilityItem, "localFrom" | "localTo" | "timeLabel">,
  intlLocale: string,
  fallback: string,
) {
  return item.localFrom && item.localTo
    ? formatTimeRangePhrase(item.localFrom, item.localTo, intlLocale, item.timeLabel ?? fallback)
    : item.timeLabel ?? fallback;
}

export function browserTimeZone(fallback = "Heure locale") {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
}

export function formatTimeZone(
  timeZone?: string | null,
  intlLocale?: string,
  missingLabel = "Non renseignée",
  localTimeLabel = "Heure locale",
  referenceDate: string | Date = new Date(),
) {
  if (!intlLocale) {
    if (!timeZone) return missingLabel;
    const location = timeZone.split("/").at(-1)?.replaceAll("_", " ").trim();
    return location ? `Heure de ${location}` : localTimeLabel;
  }
  if (!timeZone) return missingLabel;
  try {
    const instant = referenceInstant(referenceDate, timeZone);
    const timeZoneName = new Intl.DateTimeFormat(intlLocale, {
      timeZone,
      timeZoneName: "long",
    }).formatToParts(instant).find((part) => part.type === "timeZoneName")?.value;
    return timeZoneName || localTimeLabel;
  } catch {
    return localTimeLabel;
  }
}
