export const baseUrl = import.meta.env.BASE_URL;
export const homeUrl = baseUrl;
export const appUrl = `${baseUrl}app`;
export const shareUrl = `${baseUrl}app/partager`;
export const findUrl = `${baseUrl}app/trouver`;
export const authCallbackUrl = `${baseUrl}auth/callback`;

export const isPublicDemo = import.meta.env.VITE_DEMO_MODE === "true";
export const demoLabel = isPublicDemo ? "Démo publique" : "Environnement local";
export const demoContext = isPublicDemo ? "démo publique" : "environnement local";

export function relativePathname(pathname: string, base = baseUrl) {
  const normalizedBase = base === "/" ? "" : base.replace(/\/+$/, "");
  const relative = normalizedBase && pathname === normalizedBase
    ? "/"
    : normalizedBase && pathname.startsWith(`${normalizedBase}/`)
      ? pathname.slice(normalizedBase.length)
      : pathname;

  return relative.replace(/\/+$/, "") || "/";
}
