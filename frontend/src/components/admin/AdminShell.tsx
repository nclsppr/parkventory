import { Activity, Building2, Gauge, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell, type NoticeTone, type ShellNavigationItem } from "../AppShell";
import {
  adminOperationsUrl,
  adminTenantsUrl,
  adminUrl,
  adminUsersUrl,
} from "../../config";
import type { SessionData } from "../../types";
import { operatorInitials } from "./adminFormat";

export type AdminRoute = "overview" | "tenants" | "tenant" | "users" | "operations";

const adminNavigation: readonly ShellNavigationItem[] = [
  { route: "overview", label: "Vue d’ensemble", mobileLabel: "Vue", href: adminUrl, icon: Gauge },
  { route: "tenants", label: "Tenants", mobileLabel: "Tenants", href: adminTenantsUrl, icon: Building2 },
  { route: "users", label: "Utilisateurs", mobileLabel: "Comptes", href: adminUsersUrl, icon: UsersRound },
  { route: "operations", label: "Opérations", mobileLabel: "Suivi", href: adminOperationsUrl, icon: Activity },
];

export function AdminShell({
  route,
  session,
  children,
  loading,
  loadError,
  onRetry,
  onNotify,
  onSessionExpired,
}: {
  route: AdminRoute;
  session: SessionData;
  children: ReactNode;
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onNotify: (message: string, tone?: NoticeTone) => void;
  onSessionExpired: () => void;
}) {
  return (
    <AppShell
      activeRoute={route === "tenant" ? "tenants" : route}
      contentId="admin-content"
      homeHref={adminUrl}
      homeLabel="Vue d’ensemble de la console Parkventory"
      navigationItems={adminNavigation}
      navigationLabel="Navigation de la console d’administration"
      quickNavigationLabel="Navigation rapide de la console"
      sidebarLabel="Console d’administration Parkventory"
      shellClassName="admin-shell"
      profile={{
        initials: operatorInitials(session.displayName, session.email),
        primary: session.displayName,
        secondary: "Opérateur système",
      }}
      loading={loading}
      loadError={loadError}
      onNotify={onNotify}
      onRetry={onRetry}
      onSessionExpired={onSessionExpired}
    >
      {children}
    </AppShell>
  );
}
