import { useCallback, useEffect, useMemo, useState } from "react";
import {
  legacyRouteFromPathname,
  localizedRouteFromPathname,
  type Locale,
  type RouteId,
} from "../../shared/i18n";
import { ApiError, loadSession } from "./api/client";
import type { ApplicationRoute } from "./components/AppShell";
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
  const { locale, setLocale } = useI18n();
  const [path, setPath] = useState(currentPath);
  const [sessionState, setSessionState] = useState<
    | { status: "checking" }
    | { status: "anonymous"; checkFailed: boolean }
    | { status: "authenticated"; data: SessionData }
  >({ status: "checking" });
  const localizedRoute = useMemo(() => localizedRouteFromPathname(path), [path]);
  const route = localizedRoute?.route ?? legacyIntentRoute(path) ?? "notFound";
  const routeLocale = localizedRoute?.locale ?? locale;
  const authenticatedLocale = sessionState.status === "authenticated"
    ? sessionState.data.locale
    : null;
  const showPublicLanguageSwitcher = sessionState.status === "anonymous";

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let active = true;
    loadSession()
      .then((loadedSession) => {
        if (!active) return;
        setSessionState((current) => current.status === "checking"
          ? { status: "authenticated", data: loadedSession }
          : current);
      })
      .catch((error) => {
        if (!active) return;
        setSessionState((current) => current.status === "checking"
          ? {
            status: "anonymous",
            checkFailed: !(error instanceof ApiError && error.status === 401),
          }
          : current);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authenticatedLocale && authenticatedLocale !== locale) {
      setLocale(authenticatedLocale, { replace: true });
    }
  }, [authenticatedLocale, locale, setLocale]);

  const handleSessionExpired = useCallback(() => {
    setSessionState({ status: "anonymous", checkFailed: false });
  }, []);

  const handleAuthenticatedSession = useCallback((authenticatedSession: SessionData) => {
    setSessionState({ status: "authenticated", data: authenticatedSession });
  }, []);

  const handleProfileLocalePersisted = useCallback((nextLocale: Locale) => {
    setSessionState((current) => current.status === "authenticated"
      ? { ...current, data: { ...current.data, locale: nextLocale } }
      : current);
    setLocale(nextLocale);
  }, [setLocale]);

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

  if (route === "home") {
    return <LandingPage showLanguageSwitcher={showPublicLanguageSwitcher} />;
  }
  if (route === "authCallback") {
    return (
      <AuthCallbackPage
        onAuthenticated={handleAuthenticatedSession}
        showLanguageSwitcher={showPublicLanguageSwitcher}
      />
    );
  }
  if (route === "privacy") {
    return <PrivacyPage showLanguageSwitcher={showPublicLanguageSwitcher} />;
  }
  if (route === "legal") {
    return <LegalNoticePage showLanguageSwitcher={showPublicLanguageSwitcher} />;
  }
  const applicationRoute = applicationRoutes[route];
  if (applicationRoute) {
    return (
      <AuthenticatedApplication
        route={applicationRoute}
        locale={routeLocale}
        sessionState={sessionState}
        onLocalePersisted={handleProfileLocalePersisted}
        onSessionExpired={handleSessionExpired}
      />
    );
  }
  return <NotFoundPage showLanguageSwitcher={showPublicLanguageSwitcher} />;
}

function AuthenticatedApplication({
  route,
  locale,
  sessionState,
  onLocalePersisted,
  onSessionExpired,
}: {
  route: ApplicationRoute;
  locale: Locale;
  sessionState:
    | { status: "checking" }
    | { status: "anonymous"; checkFailed: boolean }
    | { status: "authenticated"; data: SessionData };
  onLocalePersisted: (locale: Locale) => void;
  onSessionExpired: () => void;
}) {
  const copy = systemMessages[locale];

  if (sessionState.status === "checking") {
    return (
      <main className="auth-page">
        <div className="auth-backdrop" aria-hidden="true" />
        <div className="auth-preferences">
          <ThemeToggle />
        </div>
        <p className="auth-loading" role="status">
          {copy.checkingConnection}
        </p>
      </main>
    );
  }
  if (sessionState.status === "anonymous") {
    return <SignInPage reason={sessionState.checkFailed ? copy.connectionCheckFailed : undefined} />;
  }
  return (
    <ApplicationPage
      route={route}
      initialBranding={sessionState.data.branding}
      onLocalePersisted={onLocalePersisted}
      onSessionExpired={onSessionExpired}
    />
  );
}
