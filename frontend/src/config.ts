export const baseUrl = import.meta.env.BASE_URL;
export const homeUrl = baseUrl;
export const appUrl = `${baseUrl}app`;
export const shareUrl = `${baseUrl}app/partager`;
export const findUrl = `${baseUrl}app/trouver`;
export const authCallbackUrl = `${baseUrl}auth/callback`;

export const isPublicDemo = import.meta.env.VITE_DEMO_MODE === "true";
export const isOidcIdentity = !isPublicDemo && import.meta.env.VITE_AUTH_MODE === "oidc";
export const oidcLoginUrl = "/api/v1/auth/oidc/login";
export const demoLabel = isPublicDemo
  ? "Démo publique"
  : isOidcIdentity
    ? "Service en ligne"
    : "Environnement local";
export const demoContext = isPublicDemo
  ? "démo publique"
  : isOidcIdentity
    ? "service en ligne"
    : "environnement local";

export function relativePathname(pathname: string, base = baseUrl) {
  const normalizedBase = base === "/" ? "" : base.replace(/\/+$/, "");
  const relative = normalizedBase && pathname === normalizedBase
    ? "/"
    : normalizedBase && pathname.startsWith(`${normalizedBase}/`)
      ? pathname.slice(normalizedBase.length)
      : pathname;

  return relative.replace(/\/+$/, "") || "/";
}
