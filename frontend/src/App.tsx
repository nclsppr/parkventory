import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { ApiError, loadSession } from "./api/client";
import type { ApplicationRoute } from "./components/AppShell";
import { findUrl, relativePathname, shareUrl } from "./config";
import { ApplicationPage } from "./pages/ApplicationPage";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AuthCallbackPage, SignInPage } from "./pages/AuthPages";
import { LegalNoticePage, PrivacyPage } from "./pages/LegalPages";
import { ThemeProvider, ThemeToggle } from "./components/Theme";
import { Logo } from "./components/Logo";
import type { SessionData } from "./types";

const AdminApplicationPage = lazy(() => import("./pages/admin/AdminApplicationPage"));

type AdminRoute = "overview" | "tenants" | "tenant" | "users" | "operations";

interface AdminRouteMatch {
  route: AdminRoute;
  tenantId?: string;
}

const applicationRoutes: Record<string, ApplicationRoute> = {
  "/app": "dashboard",
  "/app/partager": "share",
  "/app/trouver": "find",
  "/app/admin": "tenantAdmin",
};

function legacyIntentTarget() {
  if (relativePathname(window.location.pathname) !== "/app") return null;
  const intent = new URLSearchParams(window.location.search).get("intent");
  if (intent === "share") return shareUrl;
  if (intent === "find") return findUrl;
  return null;
}

function currentPath() {
  const legacyTarget = legacyIntentTarget();
  return legacyTarget
    ? relativePathname(new URL(legacyTarget, window.location.origin).pathname)
    : relativePathname(window.location.pathname);
}

function adminRoute(path: string): AdminRouteMatch | null {
  if (path === "/admin") return { route: "overview" };
  if (path === "/admin/tenants") return { route: "tenants" };
  if (path === "/admin/users") return { route: "users" };
  if (path === "/admin/operations") return { route: "operations" };
  const tenantMatch = path.match(/^\/admin\/tenants\/([^/]+)$/);
  if (!tenantMatch) return null;
  try {
    return { route: "tenant", tenantId: decodeURIComponent(tenantMatch[1]) };
  } catch {
    return null;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [location, setLocation] = useState(() => ({
    path: currentPath(),
    search: window.location.search,
  }));
  const { path, search } = location;

  useEffect(() => {
    const onPopState = () => {
      const legacyTarget = legacyIntentTarget();
      if (legacyTarget) window.history.replaceState({}, "", legacyTarget);
      setLocation({
        path: relativePathname(window.location.pathname),
        search: window.location.search,
      });
    };

    onPopState();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const titles: Record<string, string> = {
      "/": "Parkventory — Le parking partagé, simplement",
      "/app": "Accueil — Parkventory",
      "/app/partager": "Partager ma place — Parkventory",
      "/app/trouver": "Trouver une place — Parkventory",
      "/app/admin": "Administration du tenant — Parkventory",
      "/admin": "Vue d’ensemble — Administration Parkventory",
      "/admin/tenants": "Tenants — Administration Parkventory",
      "/admin/users": "Utilisateurs — Administration Parkventory",
      "/admin/operations": "Opérations — Administration Parkventory",
      "/auth/callback": "Connexion — Parkventory",
      "/confidentialite": "Confidentialité — Parkventory",
      "/mentions-legales": "Mentions légales — Parkventory",
    };
    document.title = titles[path]
      ?? (path.startsWith("/admin/tenants/") ? "Tenant — Administration Parkventory" : "Page introuvable — Parkventory");
  }, [path]);

  if (path === "/") return <LandingPage />;
  if (path === "/auth/callback") return <AuthCallbackPage />;
  if (path === "/confidentialite") return <PrivacyPage />;
  if (path === "/mentions-legales") return <LegalNoticePage />;
  if (applicationRoutes[path]) {
    return <AuthenticatedApplication key="application" area="application" route={applicationRoutes[path]} search={search} />;
  }
  const matchedAdminRoute = adminRoute(path);
  if (matchedAdminRoute) {
    return <AuthenticatedApplication key="admin" area="admin" route={matchedAdminRoute.route} tenantId={matchedAdminRoute.tenantId} search={search} />;
  }
  return <NotFoundPage />;
}

function AuthenticatedApplication({
  area,
  route,
  search,
  tenantId,
}: {
  area: "application" | "admin";
  route: ApplicationRoute | AdminRoute;
  search: string;
  tenantId?: string;
}) {
  const [state, setState] = useState<"checking" | "authenticated" | "anonymous" | "forbidden">(
    "checking",
  );
  const [session, setSession] = useState<SessionData | null>(null);
  const [reason, setReason] = useState<string | undefined>();
  const handleSessionExpired = useCallback(() => {
    setSession(null);
    setState("anonymous");
  }, []);
  const handleForbidden = useCallback(() => setState("forbidden"), []);

  useEffect(() => {
    let active = true;
    loadSession()
      .then((loadedSession) => {
        if (!active) return;
        setSession(loadedSession);
        setState("authenticated");
      })
      .catch((error) => {
        if (!active) return;
        setSession(null);
        setState("anonymous");
        setReason(
          error instanceof ApiError && error.status === 401
            ? undefined
            : error instanceof Error
              ? error.message
              : "La connexion n’a pas pu être vérifiée.",
        );
      });
    return () => {
      active = false;
    };
  }, []);

  if (state === "checking") {
    return (
      <main className={`auth-page ${area === "admin" ? "auth-page-admin" : ""}`.trim()}>
        <div className="auth-backdrop" aria-hidden="true" />
        <ThemeToggle className="auth-theme-toggle" />
        <p className="auth-loading" role="status">
          {area === "admin" ? "Vérification de l’accès opérateur…" : "Vérification de la connexion…"}
        </p>
      </main>
    );
  }
  if (state === "anonymous") return <SignInPage reason={reason} mode={area} />;
  if (state === "forbidden") return <NotFoundPage />;
  if (area === "admin") {
    if (!session?.godmode) return <NotFoundPage />;
    return (
      <Suspense fallback={
        <main className="dashboard-state">
          <Logo />
          <h1>Ouverture de la console…</h1>
          <p role="status">Chargement du poste de contrôle Parkventory.</p>
        </main>
      }>
        <AdminApplicationPage
          route={route as AdminRoute}
          search={search}
          session={session}
          tenantId={tenantId}
          onSessionExpired={handleSessionExpired}
          onForbidden={handleForbidden}
        />
      </Suspense>
    );
  }
  if (session?.godmode) return <NotFoundPage />;
  if (route === "tenantAdmin" && session?.role !== "ADMIN") return <NotFoundPage />;
  return (
    <ApplicationPage
      route={route as ApplicationRoute}
      initialBranding={session?.branding ?? null}
      isTenantAdmin={session?.role === "ADMIN"}
      onSessionExpired={handleSessionExpired}
    />
  );
}
