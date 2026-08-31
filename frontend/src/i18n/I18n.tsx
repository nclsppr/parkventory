import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  defaultLocale,
  isLocale,
  localeConfig,
  localeCookieName,
  localeFromLanguagePreferences,
  localeFromPathname,
  localizedPath,
  localizedRouteFromPathname,
  type Locale,
} from "../../../shared/i18n";
import { relativePathname, withBasePath } from "../config";

const storageKey = "parkventory:locale:v1";

interface I18nContextValue {
  locale: Locale;
  intlLocale: string;
  setLocale: (locale: Locale, options?: { replace?: boolean }) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function storedLocale(): Locale | null {
  try {
    const value = window.localStorage.getItem(storageKey);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

function initialLocale(): Locale {
  return localeFromPathname(relativePathname(window.location.pathname))
    ?? storedLocale()
    ?? localeFromLanguagePreferences(navigator.languages, defaultLocale);
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `${localeCookieName}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function targetForLocale(locale: Locale): string {
  const pathname = relativePathname(window.location.pathname);
  const currentRoute = localizedRouteFromPathname(pathname);
  if (currentRoute) return withBasePath(localizedPath(locale, currentRoute.route));

  const currentLocale = localeFromPathname(pathname);
  if (currentLocale) {
    const suffix = pathname.replace(new RegExp(`^/${currentLocale}(?=/|$)`), "");
    return withBasePath(`/${locale}${suffix || "/"}`);
  }
  return withBasePath(localizedPath(locale, "home"));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const localeRef = useRef(locale);
  localeRef.current = locale;

  useLayoutEffect(() => {
    document.documentElement.lang = localeConfig[locale].htmlLang;
    try {
      window.localStorage.setItem(storageKey, locale);
    } catch {
      // The route still keeps the selected language when storage is unavailable.
    }
    try {
      setLocaleCookie(locale);
    } catch {
      // Cookies can be disabled without preventing in-page localization.
    }
  }, [locale]);

  useEffect(() => {
    const syncLocaleFromPath = () => {
      const routeLocale = localeFromPathname(relativePathname(window.location.pathname));
      if (routeLocale) {
        localeRef.current = routeLocale;
        setLocaleState(routeLocale);
      }
    };
    window.addEventListener("popstate", syncLocaleFromPath);
    return () => window.removeEventListener("popstate", syncLocaleFromPath);
  }, []);

  const setLocale = useCallback((nextLocale: Locale, options?: { replace?: boolean }) => {
    if (nextLocale === localeRef.current) return;
    const target = targetForLocale(nextLocale);
    localeRef.current = nextLocale;
    setLocaleState(nextLocale);
    const nextUrl = `${target}${window.location.search}${window.location.hash}`;
    if (options?.replace) {
      window.history.replaceState({}, "", nextUrl);
    } else {
      window.history.pushState({}, "", nextUrl);
    }
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    intlLocale: localeConfig[locale].intlLocale,
    setLocale,
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider.");
  return context;
}
