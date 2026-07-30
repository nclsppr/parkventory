export function dateInputValue(daysFromToday = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export function formatInputDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "Date à préciser";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Fuseau local";
}
