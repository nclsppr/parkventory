import { useCallback, useEffect, useMemo, useState } from "react";
import {
  legacyRouteFromPathname,
  localizedRouteFromPathname,
  type Locale,
  type RouteId,
} from "../../shared/i18n";
import { ApiError, loadSession } from "./api/client";
import type { ApplicationRoute } from "./components/AppShell";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { ThemeProvider, ThemeToggle } from "./components/Theme";
import { relativePathname, routeUrl } from "./config";
import { I18nProvider, useI18n } from "./i18n/I18n";
import { applyClientMetadata } from "./i18n/metadata";
import { systemMessages } from "./i18n/system";
import { ApplicationPage } from "./pages/ApplicationPage";
import { AuthCallbackPage, SignInPage } from "./pages/AuthPages";
import { LandingPage } from "./pages/LandingPage";
import { LegalNoticePage, PrivacyPage } from "./pages/LegalPages";
import { NotFoundPage } from "./pages/NotFoundPage";
import type { SessionData } from "./types";

const applicationRoutes: Partial<Record<RouteId, ApplicationRoute>> = {
  app: "dashboard",
  share: "share",
  find: "find",
};

function legacyIntentRoute(pathname: string): Exclude<RouteId, "notFound"> | null {
  const legacyRoute = legacyRouteFromPathname(pathname);
  if (legacyRoute !== "app") return legacyRoute;
  const intent = new URLSearchParams(window.location.search).get("intent");
  if (intent === "share") return "share";
  if (intent === "find") return "find";
  return legacyRoute;
}

function currentPath() {
  return relativePathname(window.location.pathname);
}

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </I18nProvider>
  );
}

function AppContent() {
  const { locale } = useI18n();
  const [path, setPath] = useState(currentPath);
  const localizedRoute = useMemo(() => localizedRouteFromPathname(path), [path]);
  const route = localizedRoute?.route ?? legacyIntentRoute(path) ?? "notFound";
  const routeLocale = localizedRoute?.locale ?? locale;

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (localizedRoute || route === "notFound") return;
    const url = new URL(window.location.href);
    url.pathname = routeUrl(locale, route);
    if (path === "/app" && url.searchParams.has("intent")) {
      url.searchParams.delete("intent");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [locale, localizedRoute, path, route]);

  useEffect(() => {
    applyClientMetadata(routeLocale, route);
  }, [route, routeLocale]);

  if (route === "home") return <LandingPage />;
  if (route === "authCallback") return <AuthCallbackPage />;
  if (route === "privacy") return <PrivacyPage />;
  if (route === "legal") return <LegalNoticePage />;
  const applicationRoute = applicationRoutes[route];
  if (applicationRoute) {
    return <AuthenticatedApplication route={applicationRoute} locale={routeLocale} />;
  }
  return <NotFoundPage />;
}

function AuthenticatedApplication({
  route,
  locale,
}: {
  route: ApplicationRoute;
  locale: Locale;
}) {
  const copy = systemMessages[locale];
  const [state, setState] = useState<"checking" | "authenticated" | "anonymous">(
    "checking",
  );
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessionCheckFailed, setSessionCheckFailed] = useState(false);
  const handleSessionExpired = useCallback(() => {
    setSession(null);
    setState("anonymous");
  }, []);

  useEffect(() => {
    let active = true;
    loadSession()
      .then((loadedSession) => {
        if (!active) return;
        setSession(loadedSession);
        setSessionCheckFailed(false);
        setState("authenticated");
      })
      .catch((error) => {
        if (!active) return;
        setSession(null);
        setState("anonymous");
        setSessionCheckFailed(!(error instanceof ApiError && error.status === 401));
      });
    return () => {
      active = false;
    };
  }, []);

  if (state === "checking") {
    return (
      <main className="auth-page">
        <div className="auth-backdrop" aria-hidden="true" />
        <div className="auth-preferences">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <p className="auth-loading" role="status">
          {copy.checkingConnection}
        </p>
      </main>
    );
  }
  if (state === "anonymous") {
    return <SignInPage reason={sessionCheckFailed ? copy.connectionCheckFailed : undefined} />;
  }
  return (
    <ApplicationPage
      route={route}
      initialBranding={session?.branding ?? null}
      onSessionExpired={handleSessionExpired}
    />
  );
}
