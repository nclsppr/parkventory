import { useCallback, useEffect, useState } from "react";
import { ApiError, loadSession } from "./api/client";
import type { ApplicationRoute } from "./components/AppShell";
import { findUrl, relativePathname, shareUrl } from "./config";
import { ApplicationPage } from "./pages/ApplicationPage";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AuthCallbackPage, SignInPage } from "./pages/AuthPages";
import { LegalNoticePage, PrivacyPage } from "./pages/LegalPages";
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
      "/confidentialite": "Confidentialité — Parkventory",
      "/mentions-legales": "Mentions légales — Parkventory",
    };
    document.title = titles[path] ?? "Page introuvable — Parkventory";
  }, [path]);

  if (path === "/") return <LandingPage />;
  if (path === "/auth/callback") return <AuthCallbackPage />;
  if (path === "/confidentialite") return <PrivacyPage />;
  if (path === "/mentions-legales") return <LegalNoticePage />;
  if (applicationRoutes[path]) {
    return <AuthenticatedApplication route={applicationRoutes[path]} />;
  }
  return <NotFoundPage />;
}

function AuthenticatedApplication({ route }: { route: ApplicationRoute }) {
  const [state, setState] = useState<"checking" | "authenticated" | "anonymous">(
    "checking",
  );
  const [reason, setReason] = useState<string | undefined>();
  const handleSessionExpired = useCallback(() => setState("anonymous"), []);

  useEffect(() => {
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
              : "La session n’a pas pu être vérifiée.",
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
          Vérification de la session…
        </p>
      </main>
    );
  }
  if (state === "anonymous") return <SignInPage reason={reason} />;
  return <ApplicationPage route={route} onSessionExpired={handleSessionExpired} />;
}
