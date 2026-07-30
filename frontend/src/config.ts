export const baseUrl = import.meta.env.BASE_URL;
export const homeUrl = baseUrl;
export const appUrl = `${baseUrl}app`;

export const isPublicDemo = import.meta.env.VITE_DEMO_MODE === "true";
export const demoLabel = isPublicDemo ? "Démo publique" : "Démo locale";
export const demoContext = isPublicDemo ? "démo publique" : "démo locale";

export function relativePathname(pathname: string, base = baseUrl) {
  const normalizedBase = base === "/" ? "" : base.replace(/\/+$/, "");
  const relative = normalizedBase && pathname === normalizedBase
    ? "/"
    : normalizedBase && pathname.startsWith(`${normalizedBase}/`)
      ? pathname.slice(normalizedBase.length)
      : pathname;

  return relative.replace(/\/+$/, "") || "/";
}
