import {
  localizedPath,
  type Locale,
  type RouteId,
} from "../../shared/i18n";

export const baseUrl = import.meta.env.BASE_URL;

export function withBasePath(pathname: string) {
  if (baseUrl === "/") return pathname;
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}${pathname}`;
}

export function routeUrl(locale: Locale, route: Exclude<RouteId, "notFound">) {
  return withBasePath(localizedPath(locale, route));
}

export function localizedUrls(locale: Locale) {
  return {
    homeUrl: routeUrl(locale, "home"),
    appUrl: routeUrl(locale, "app"),
    shareUrl: routeUrl(locale, "share"),
    findUrl: routeUrl(locale, "find"),
    authCallbackUrl: routeUrl(locale, "authCallback"),
    privacyUrl: routeUrl(locale, "privacy"),
    legalUrl: routeUrl(locale, "legal"),
  };
}

export function relativePathname(pathname: string, base = baseUrl) {
  const normalizedBase = base === "/" ? "" : base.replace(/\/+$/, "");
  const relative = normalizedBase && pathname === normalizedBase
    ? "/"
    : normalizedBase && pathname.startsWith(`${normalizedBase}/`)
      ? pathname.slice(normalizedBase.length)
      : pathname;

  return relative.replace(/\/+$/, "") || "/";
}
