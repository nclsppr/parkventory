export function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function formatDateTime(value: number | null) {
  if (value === null) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1_000));
}

export function formatShortDate(value: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value * 1_000));
}

export function formatSeriesDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
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

export function formatRole(role: "MEMBER" | "ADMIN") {
  return role === "ADMIN" ? "Administrateur" : "Membre";
}
