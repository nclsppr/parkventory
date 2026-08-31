import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  legacyAdminTenantIdFromPathname,
  legacyRouteFromPathname,
  localizedAdminTenantRouteFromPathname,
  localizedRouteFromPathname,
  type Locale,
  type RouteId,
} from "../../shared/i18n";
import { ApiError, loadSession } from "./api/client";
import type { ApplicationRoute } from "./components/AppShell";
import { Logo } from "./components/Logo";
import { ThemeProvider, ThemeToggle } from "./components/Theme";
import { localizedUrls, relativePathname, routeUrl } from "./config";
import { I18nProvider, useI18n } from "./i18n/I18n";
import { applyClientMetadata } from "./i18n/metadata";
import { systemMessages } from "./i18n/system";
import { ApplicationPage } from "./pages/ApplicationPage";
import { AuthCallbackPage, SignInPage } from "./pages/AuthPages";
import { LandingPage } from "./pages/LandingPage";
import { LegalNoticePage, PrivacyPage } from "./pages/LegalPages";
import { NotFoundPage } from "./pages/NotFoundPage";
import type { SessionData } from "./types";

const AdminApplicationPage = lazy(() => import("./pages/admin/AdminApplicationPage"));

type AdminRoute = "overview" | "tenants" | "tenant" | "users" | "operations";
type ResolvedRoute = RouteId | "adminTenant";
type SessionState =
  | { status: "checking" }
  | { status: "anonymous"; checkFailed: boolean }
  | { status: "authenticated"; data: SessionData };

const applicationRoutes: Partial<Record<RouteId, ApplicationRoute>> = {
  app: "dashboard",
  share: "share",
  find: "find",
  tenantAdmin: "tenantAdmin",
};

const adminRoutes: Partial<Record<RouteId, AdminRoute>> = {
  adminOverview: "overview",
  adminTenants: "tenants",
  adminUsers: "users",
  adminOperations: "operations",
};

function legacyIntentRoute(pathname: string, search: string): Exclude<RouteId, "notFound"> | null {
  const legacyRoute = legacyRouteFromPathname(pathname);
  if (legacyRoute !== "app") return legacyRoute;
  const intent = new URLSearchParams(search).get("intent");
  if (intent === "share") return "share";
  if (intent === "find") return "find";
  return legacyRoute;
}

function currentLocation() {
  return {
    path: relativePathname(window.location.pathname),
    search: window.location.search,
  };
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
  const [location, setLocation] = useState(currentLocation);
  const [sessionState, setSessionState] = useState<SessionState>({ status: "checking" });
  const { path, search } = location;
  const localizedRoute = useMemo(() => localizedRouteFromPathname(path), [path]);
  const localizedAdminTenant = useMemo(
    () => localizedAdminTenantRouteFromPathname(path),
    [path],
  );
  const legacyAdminTenantId = useMemo(() => legacyAdminTenantIdFromPathname(path), [path]);
  const legacyRoute = useMemo(() => legacyIntentRoute(path, search), [path, search]);
  const route: ResolvedRoute = localizedAdminTenant || legacyAdminTenantId
    ? "adminTenant"
    : localizedRoute?.route ?? legacyRoute ?? "notFound";
  const tenantId = localizedAdminTenant?.tenantId ?? legacyAdminTenantId ?? undefined;
  const routeLocale = localizedAdminTenant?.locale ?? localizedRoute?.locale ?? locale;
  const authenticatedLocale = sessionState.status === "authenticated"
    ? sessionState.data.locale
    : null;
  const showPublicLanguageSwitcher = sessionState.status === "anonymous";

  useEffect(() => {
    const onPopState = () => setLocation(currentLocation());
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
    if (localizedRoute || localizedAdminTenant || route === "notFound") return;
    const url = new URL(window.location.href);
    if (route === "adminTenant" && tenantId) {
      url.pathname = localizedUrls(locale).adminTenantUrl(tenantId);
    } else {
      url.pathname = routeUrl(locale, route as Exclude<RouteId, "notFound">);
    }
    if (path === "/app" && url.searchParams.has("intent")) {
      url.searchParams.delete("intent");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [locale, localizedAdminTenant, localizedRoute, path, route, tenantId]);

  useEffect(() => {
    applyClientMetadata(routeLocale, route, tenantId);
  }, [route, routeLocale, tenantId]);

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

  const applicationRoute = route === "adminTenant" ? undefined : applicationRoutes[route];
  if (applicationRoute) {
    return (
      <AuthenticatedApplication
        key="application"
        area="application"
        route={applicationRoute}
        locale={routeLocale}
        search={search}
        sessionState={sessionState}
        onLocalePersisted={handleProfileLocalePersisted}
        onSessionExpired={handleSessionExpired}
      />
    );
  }

  const adminRoute = route === "adminTenant" ? "tenant" : adminRoutes[route];
  if (adminRoute) {
    return (
      <AuthenticatedApplication
        key="admin"
        area="admin"
        route={adminRoute}
        locale={routeLocale}
        search={search}
        sessionState={sessionState}
        tenantId={tenantId}
        onLocalePersisted={handleProfileLocalePersisted}
        onSessionExpired={handleSessionExpired}
      />
    );
  }

  return <NotFoundPage showLanguageSwitcher={showPublicLanguageSwitcher} />;
}

function AuthenticatedApplication({
  area,
  route,
  locale,
  search,
  sessionState,
  tenantId,
  onLocalePersisted,
  onSessionExpired,
}: {
  area: "application" | "admin";
  route: ApplicationRoute | AdminRoute;
  locale: Locale;
  search: string;
  sessionState: SessionState;
  tenantId?: string;
  onLocalePersisted: (locale: Locale) => void;
  onSessionExpired: () => void;
}) {
  const copy = systemMessages[locale];
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => setForbidden(false), [area, route, tenantId]);

  if (sessionState.status === "checking") {
    return (
      <main className={`auth-page ${area === "admin" ? "auth-page-admin" : ""}`.trim()}>
        <div className="auth-backdrop" aria-hidden="true" />
        <div className="auth-preferences">
          <ThemeToggle />
        </div>
        <p className="auth-loading" role="status">
          {area === "admin" ? copy.checkingOperator : copy.checkingConnection}
        </p>
      </main>
    );
  }

  if (sessionState.status === "anonymous") {
    return (
      <SignInPage
        reason={sessionState.checkFailed ? copy.connectionCheckFailed : undefined}
        mode={area === "admin" ? "admin" : "application"}
      />
    );
  }

  if (forbidden) return <NotFoundPage showLanguageSwitcher={false} />;
  const session = sessionState.data;

  if (area === "admin") {
    if (!session.godmode) return <NotFoundPage showLanguageSwitcher={false} />;
    return (
      <Suspense fallback={
        <main className="dashboard-state">
          <Logo />
          <h1>{copy.openingConsole}</h1>
          <p role="status">{copy.loadingConsole}</p>
        </main>
      }>
        <AdminApplicationPage
          route={route as AdminRoute}
          search={search}
          session={session}
          tenantId={tenantId}
          onLocalePersisted={onLocalePersisted}
          onSessionExpired={onSessionExpired}
          onForbidden={() => setForbidden(true)}
        />
      </Suspense>
    );
  }

  if (session.godmode) return <NotFoundPage showLanguageSwitcher={false} />;
  if (route === "tenantAdmin" && session.role !== "ADMIN") {
    return <NotFoundPage showLanguageSwitcher={false} />;
  }
  return (
    <ApplicationPage
      route={route as ApplicationRoute}
      initialBranding={session.branding}
      isTenantAdmin={session.role === "ADMIN"}
      onLocalePersisted={onLocalePersisted}
      onSessionExpired={onSessionExpired}
    />
  );
}
