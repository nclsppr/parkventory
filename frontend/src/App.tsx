import { useCallback, useEffect, useState } from "react";
import { ApiError, loadSession } from "./api/client";
import type { ApplicationRoute } from "./components/AppShell";
import {
  findUrl,
  isOidcIdentity,
  isPublicDemo,
  relativePathname,
  shareUrl,
} from "./config";
import { ApplicationPage } from "./pages/ApplicationPage";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AuthCallbackPage, SignInPage } from "./pages/AuthPages";
import { ThemeProvider, ThemeToggle } from "./components/Theme";

const applicationRoutes: Record<string, ApplicationRoute> = {
  "/app": "dashboard",
  "/app/partager": "share",
  "/app/trouver": "find",
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

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onPopState = () => {
      const legacyTarget = legacyIntentTarget();
      if (legacyTarget) window.history.replaceState({}, "", legacyTarget);
      setPath(relativePathname(window.location.pathname));
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
      "/auth/callback": "Connexion — Parkventory",
    };
    document.title = titles[path] ?? "Page introuvable — Parkventory";
  }, [path]);

  if (path === "/") return <LandingPage />;
  if (path === "/auth/callback") return <AuthCallbackPage />;
  if (applicationRoutes[path]) {
    return <AuthenticatedApplication route={applicationRoutes[path]} />;
  }
  return <NotFoundPage />;
}

function AuthenticatedApplication({ route }: { route: ApplicationRoute }) {
  const [state, setState] = useState<"checking" | "authenticated" | "anonymous">(
    isPublicDemo ? "authenticated" : "checking",
  );
  const [reason, setReason] = useState<string | undefined>();
  const handleSessionExpired = useCallback(() => setState("anonymous"), []);

  useEffect(() => {
    if (isPublicDemo) return;
    let active = true;
    loadSession()
      .then(() => {
        if (active) setState("authenticated");
      })
      .catch((error) => {
        if (!active) return;
        setState("anonymous");
        setReason(
          error instanceof ApiError && error.status === 401
            ? undefined
            : error instanceof Error
              ? error.message
              : isOidcIdentity
                ? "La session n’a pas pu être vérifiée."
                : "La session locale n’a pas pu être vérifiée.",
        );
      });
    return () => {
      active = false;
    };
  }, []);

  if (state === "checking") {
    return (
      <main className="auth-page">
        <div className="auth-backdrop" aria-hidden="true" />
        <ThemeToggle className="auth-theme-toggle" />
        <p className="auth-loading" role="status">
          {isOidcIdentity ? "Vérification de la session…" : "Vérification de la session locale…"}
        </p>
      </main>
    );
  }
  if (state === "anonymous") return <SignInPage reason={reason} />;
  return <ApplicationPage route={route} onSessionExpired={handleSessionExpired} />;
}
