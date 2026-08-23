import { useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import {
  AppShell,
  type ApplicationRoute,
  type NoticeTone,
} from "../components/AppShell";
import { Logo } from "../components/Logo";
import { Toast } from "../components/Toast";
import { useDashboardData } from "../hooks/useDashboardData";
import { isOidcIdentity } from "../config";
import type { DashboardData } from "../types";
import { DashboardPage } from "./DashboardPage";
import { FindPage } from "./FindPage";
import { SharePage } from "./SharePage";

interface ApplicationPageProps {
  route: ApplicationRoute;
  onSessionExpired: () => void;
}

export function ApplicationPage({ route, onSessionExpired }: ApplicationPageProps) {
  const {
    data,
    loading,
    loadError,
    refreshDashboard,
    setData,
  } = useDashboardData(onSessionExpired);
  const [notice, setNotice] = useState<{ message: string; tone: NoticeTone } | null>(null);
  const hasData = Boolean(data);

  const notify = (message: string, tone: NoticeTone = "success") => {
    setNotice({ message, tone });
  };

  const mutateDemo = (mutation: (current: DashboardData) => DashboardData) => {
    setData((current) => current ? mutation(current) : current);
  };

  useEffect(() => {
    if (!hasData) return;
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("#dashboard-content h1")?.focus({ preventScroll: true });
    });
  }, [route, hasData]);

  if (!data) {
    return (
      <main className="dashboard-state">
        <Logo />
        {loadError ? <AlertTriangle aria-hidden="true" /> : <LoaderCircle className="spin" aria-hidden="true" />}
        <h1>{loadError
          ? isOidcIdentity ? "Le service ne répond pas." : "Le parking local ne répond pas."
          : "Chargement de votre espace…"}</h1>
        <p role={loadError ? "alert" : "status"}>{loadError ?? (isOidcIdentity
          ? "Lecture de votre session et de votre espace."
          : "Lecture de votre session et des données PostgreSQL.")}</p>
        {loadError && (
          <button className="button button-primary" type="button" onClick={() => void refreshDashboard()}>
            Réessayer
          </button>
        )}
      </main>
    );
  }

  return (
    <>
      <AppShell
        activeRoute={route}
        data={data}
        loading={loading}
        loadError={loadError}
        onNotify={notify}
        onRetry={() => void refreshDashboard()}
        onSessionExpired={onSessionExpired}
      >
        {route === "dashboard" ? (
          <DashboardPage data={data} onNotify={notify} onSessionExpired={onSessionExpired} />
        ) : route === "share" ? (
          <SharePage
            data={data}
            onDemoMutation={mutateDemo}
            onRefresh={refreshDashboard}
            onSessionExpired={onSessionExpired}
          />
        ) : (
          <FindPage
            data={data}
            onDemoMutation={mutateDemo}
            onRefresh={refreshDashboard}
            onSessionExpired={onSessionExpired}
          />
        )}
      </AppShell>
      <Toast
        message={notice?.message ?? null}
        tone={notice?.tone}
        onDismiss={() => setNotice(null)}
      />
    </>
  );
}
