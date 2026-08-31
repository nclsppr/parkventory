import { useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import {
  AppShell,
  tenantAdminNavigation,
  type ApplicationRoute,
  type NoticeTone,
} from "../components/AppShell";
import {
  ApplicationBrand,
  OrganizationBrandingProvider,
} from "../components/OrganizationBranding";
import { ThemeToggle } from "../components/Theme";
import { Toast } from "../components/Toast";
import { useDashboardData } from "../hooks/useDashboardData";
import { applicationMessages } from "../i18n/application";
import { commonMessages } from "../i18n/common";
import { useI18n } from "../i18n/I18n";
import type { Locale } from "../../../shared/i18n";
import type { OrganizationBranding } from "../types";
import { DashboardPage } from "./DashboardPage";
import { FindPage } from "./FindPage";
import { SharePage } from "./SharePage";
import { TenantAdminPage } from "./TenantAdminPage";

interface ApplicationPageProps {
  route: ApplicationRoute;
  initialBranding: OrganizationBranding | null;
  onLocalePersisted: (locale: Locale) => void;
  isTenantAdmin: boolean;
  onSessionExpired: () => void;
}

export function ApplicationPage({
  route,
  initialBranding,
  onLocalePersisted,
  isTenantAdmin,
  onSessionExpired,
}: ApplicationPageProps) {
  const { locale } = useI18n();
  const copy = applicationMessages[locale].state;
  const commonCopy = commonMessages[locale];
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

  useEffect(() => {
    setNotice(null);
  }, [locale]);

  if (!data) {
    return (
      <OrganizationBrandingProvider branding={effectiveBranding}>
        <main className="dashboard-state">
          <div className="dashboard-state-preferences">
            <ThemeToggle />
          </div>
          <ApplicationBrand />
          {loadError ? <AlertTriangle aria-hidden="true" /> : <LoaderCircle className="spin" aria-hidden="true" />}
          <h1>{loadError ? copy.serviceUnavailable : copy.loadingWorkspace}</h1>
          <p role={loadError ? "alert" : "status"}>{loadError ?? copy.openingWorkspace}</p>
          {loadError && (
            <button className="button button-primary" type="button" onClick={() => void refreshDashboard()}>
              {commonCopy.retry}
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
        navigationItems={isTenantAdmin ? tenantAdminNavigation(locale) : undefined}
        profile={{
          initials: data.user.initials,
          primary: data.user.fullName,
          secondary: data.organization.name,
        }}
        loading={loading}
        loadError={loadError}
        onNotify={notify}
        onLocalePersisted={onLocalePersisted}
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
        ) : route === "find" ? (
          <FindPage
            data={data}
            onRefresh={refreshDashboard}
            onSessionExpired={onSessionExpired}
          />
        ) : (
          <TenantAdminPage
            organizationName={data.organization.name}
            onNotify={notify}
            onSessionExpired={onSessionExpired}
            onRefreshDashboard={refreshDashboard}
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
