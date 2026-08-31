const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function organizationName(domain: string): string {
  const stem = domain.split(".")[0].replace(/[-_]+/g, " ").trim();
  if (!stem) return domain;
  return stem.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase());
}

export function displayName(email: string, fallback = "Member"): string {
  const local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  if (!local) return fallback;
  return local.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase());
}

function formattedParts(epochSeconds: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(epochSeconds * 1000));
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function zonedDateTimeToEpoch(
  date: string,
  time: string,
  timeZone = "Europe/Paris",
): number | null {
  if (!datePattern.test(date) || !timePattern.test(time)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute) / 1000;
  let candidate = desiredAsUtc;
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const actual = formattedParts(candidate, timeZone);
    const actualAsUtc = Date.UTC(
      Number(actual.year),
      Number(actual.month) - 1,
      Number(actual.day),
      Number(actual.hour),
      Number(actual.minute),
    ) / 1000;
    candidate += desiredAsUtc - actualAsUtc;
  }

  const final = formattedParts(candidate, timeZone);
  if (
    Number(final.year) !== year
    || Number(final.month) !== month
    || Number(final.day) !== day
    || Number(final.hour) !== hour
    || Number(final.minute) !== minute
  ) return null;
  return candidate;
}

export function parisDate(epochSeconds: number): string {
  const parts = formattedParts(epochSeconds, "Europe/Paris");
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

export function localizedDate(date: string, locale = "fr-FR"): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function frenchDate(date: string): string {
  return localizedDate(date, "fr-FR");
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "PV";
}
