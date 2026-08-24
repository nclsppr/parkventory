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
  } = useDashboardData(onSessionExpired);
  const [notice, setNotice] = useState<{ message: string; tone: NoticeTone } | null>(null);
  const hasData = Boolean(data);

  const notify = (message: string, tone: NoticeTone = "success") => {
    setNotice({ message, tone });
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
        <h1>{loadError ? "Le service ne répond pas." : "Chargement de votre espace…"}</h1>
        <p role={loadError ? "alert" : "status"}>{loadError ?? "Lecture de votre session et de votre espace."}</p>
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
            onRefresh={refreshDashboard}
            onSessionExpired={onSessionExpired}
          />
        ) : (
          <FindPage
            data={data}
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
