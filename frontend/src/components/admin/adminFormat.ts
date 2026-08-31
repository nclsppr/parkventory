export function formatNumber(value: number, intlLocale: string) {
  return new Intl.NumberFormat(intlLocale).format(value);
}

export function formatPercent(value: number, intlLocale: string) {
  return new Intl.NumberFormat(intlLocale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateTime(value: number | null, intlLocale: string, neverLabel: string) {
  if (value === null) return neverLabel;
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1_000));
}

export function formatShortDate(value: number, intlLocale: string) {
  return new Intl.DateTimeFormat(intlLocale, {
    day: "2-digit",
    month: "short",
  }).format(new Date(value * 1_000));
}

export function formatSeriesDate(value: string, intlLocale: string) {
  return new Intl.DateTimeFormat(intlLocale, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function operatorInitials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "OP";
  const initials = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "OP";
}

export function formatRole(
  role: "MEMBER" | "ADMIN",
  labels: { ADMIN: string; MEMBER: string },
) {
  return labels[role];
}
