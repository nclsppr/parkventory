import { Activity, Building2, Gauge, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell, type NoticeTone, type ShellNavigationItem } from "../AppShell";
import { localizedUrls } from "../../config";
import type { Locale } from "../../../../shared/i18n";
import type { SessionData } from "../../types";
import { useI18n } from "../../i18n/I18n";
import { adminMessages } from "../../i18n/admin";
import { operatorInitials } from "./adminFormat";

export type AdminRoute = "overview" | "tenants" | "tenant" | "users" | "operations";

export function AdminShell({
  route,
  session,
  children,
  loading,
  loadError,
  onRetry,
  onNotify,
  onSessionExpired,
  onLocalePersisted,
}: {
  route: AdminRoute;
  session: SessionData;
  children: ReactNode;
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onNotify: (message: string, tone?: NoticeTone) => void;
  onSessionExpired: () => void;
  onLocalePersisted: (locale: Locale) => void;
}) {
  const { locale } = useI18n();
  const copy = adminMessages[locale];
  const urls = localizedUrls(locale);
  const adminNavigation: readonly ShellNavigationItem[] = [
    { route: "overview", label: copy.shell.overview, mobileLabel: copy.shell.overviewShort, href: urls.adminUrl, icon: Gauge },
    { route: "tenants", label: copy.shell.organizations, mobileLabel: copy.shell.organizationsShort, href: urls.adminTenantsUrl, icon: Building2 },
    { route: "users", label: copy.shell.users, mobileLabel: copy.shell.usersShort, href: urls.adminUsersUrl, icon: UsersRound },
    { route: "operations", label: copy.shell.operations, mobileLabel: copy.shell.operationsShort, href: urls.adminOperationsUrl, icon: Activity },
  ];

  return (
    <AppShell
      activeRoute={route === "tenant" ? "tenants" : route}
      contentId="admin-content"
      homeHref={urls.adminUrl}
      homeLabel={copy.shell.homeLabel}
      navigationItems={adminNavigation}
      navigationLabel={copy.shell.navigationLabel}
      quickNavigationLabel={copy.shell.quickNavigationLabel}
      sidebarLabel={copy.shell.sidebarLabel}
      shellClassName="admin-shell"
      profile={{
        initials: operatorInitials(session.displayName, session.email),
        primary: session.displayName,
        secondary: copy.shell.systemOperator,
      }}
      loading={loading}
      loadError={loadError}
      onNotify={onNotify}
      onLocalePersisted={onLocalePersisted}
      onRetry={onRetry}
      onSessionExpired={onSessionExpired}
    >
      {children}
    </AppShell>
  );
}
