import { useEffect, useState } from "react";
import { ApiError, loadSession } from "./api/client";
import { isPublicDemo, relativePathname } from "./config";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { AuthCallbackPage, SignInPage } from "./pages/AuthPages";

function currentPath() {
  return relativePathname(window.location.pathname);
}

export default function App() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    document.title = path === "/app"
      ? "Accueil — Parkventory"
      : path === "/auth/callback"
        ? "Connexion — Parkventory"
        : "Parkventory — Le parking partagé, simplement";
  }, [path]);

  if (path === "/auth/callback") return <AuthCallbackPage />;
  if (path === "/app") return <AuthenticatedDashboard />;
  return <LandingPage />;
}

function AuthenticatedDashboard() {
  const [state, setState] = useState<"checking" | "authenticated" | "anonymous">(
    isPublicDemo ? "authenticated" : "checking",
  );
  const [reason, setReason] = useState<string | undefined>();

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
        <p className="auth-loading" role="status">Vérification de la session locale…</p>
      </main>
    );
  }
  if (state === "anonymous") return <SignInPage reason={reason} />;
  return <DashboardPage onSessionExpired={() => setState("anonymous")} />;
}
