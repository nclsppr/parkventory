import { useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import {
  AppShell,
  type ApplicationRoute,
  type NoticeTone,
} from "../components/AppShell";
import {
  ApplicationBrand,
  OrganizationBrandingProvider,
} from "../components/OrganizationBranding";
import { Toast } from "../components/Toast";
import { useDashboardData } from "../hooks/useDashboardData";
import type { OrganizationBranding } from "../types";
import { DashboardPage } from "./DashboardPage";
import { FindPage } from "./FindPage";
import { SharePage } from "./SharePage";

interface ApplicationPageProps {
  route: ApplicationRoute;
  initialBranding: OrganizationBranding | null;
  onSessionExpired: () => void;
}

export function ApplicationPage({
  route,
  initialBranding,
  onSessionExpired,
}: ApplicationPageProps) {
  const {
    data,
    loading,
    loadError,
    refreshDashboard,
  } = useDashboardData(onSessionExpired);
  const [notice, setNotice] = useState<{ message: string; tone: NoticeTone } | null>(null);
  const hasData = Boolean(data);
  const effectiveBranding = data ? data.branding : initialBranding;

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
      <OrganizationBrandingProvider branding={effectiveBranding}>
        <main className="dashboard-state">
          <ApplicationBrand />
          {loadError ? <AlertTriangle aria-hidden="true" /> : <LoaderCircle className="spin" aria-hidden="true" />}
          <h1>{loadError ? "Le service ne répond pas." : "Chargement de votre espace…"}</h1>
          <p role={loadError ? "alert" : "status"}>{loadError ?? "Ouverture de votre espace Parkventory."}</p>
          {loadError && (
            <button className="button button-primary" type="button" onClick={() => void refreshDashboard()}>
              Réessayer
            </button>
          )}
        </main>
      </OrganizationBrandingProvider>
    );
  }

  return (
    <OrganizationBrandingProvider branding={effectiveBranding}>
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
    </OrganizationBrandingProvider>
  );
}
