import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Home,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { ApiError, logout } from "../api/client";
import {
  appUrl,
  environmentLabel,
  findUrl,
  shareUrl,
  tenantAdminUrl,
} from "../config";
import { AppLink } from "./AppLink";
import { ApplicationBrand, useOrganizationBranding } from "./OrganizationBranding";
import { ThemeToggle } from "./Theme";

export type ApplicationRoute = "dashboard" | "share" | "find" | "tenantAdmin";
export type NoticeTone = "success" | "error";

export interface ShellNavigationItem {
  route: string;
  label: string;
  mobileLabel: string;
  href: string;
  icon: LucideIcon;
}

export interface ShellProfile {
  initials: string;
  primary: string;
  secondary: string;
}

interface AppShellProps {
  activeRoute: string;
  children: ReactNode;
  profile: ShellProfile;
  loading: boolean;
  loadError: string | null;
  navigationItems?: readonly ShellNavigationItem[];
  homeHref?: string;
  homeLabel?: string;
  sidebarLabel?: string;
  navigationLabel?: string;
  quickNavigationLabel?: string;
  contentId?: string;
  shellClassName?: string;
  onNotify: (message: string, tone?: NoticeTone) => void;
  onRetry: () => void;
  onSessionExpired: () => void;
}

export const applicationNavigation: readonly ShellNavigationItem[] = [
  { route: "dashboard", label: "Accueil", mobileLabel: "Accueil", href: appUrl, icon: Home },
  { route: "share", label: "Partager ma place", mobileLabel: "Partager", href: shareUrl, icon: CalendarDays },
  { route: "find", label: "Trouver une place", mobileLabel: "Trouver", href: findUrl, icon: Search },
];

export const tenantAdminNavigation: readonly ShellNavigationItem[] = [
  ...applicationNavigation,
  { route: "tenantAdmin", label: "Administration du tenant", mobileLabel: "Admin", href: tenantAdminUrl, icon: ShieldCheck },
];

export function EnvironmentStatus({ loading }: { loading: boolean }) {
  return (
    <span
      className="demo-status"
      title="Parkventory est en version bêta."
    >
      <i /> {loading ? "Actualisation…" : environmentLabel}
    </span>
  );
}

export function AppShell({
  activeRoute,
  children,
  profile,
  loading,
  loadError,
  navigationItems = applicationNavigation,
  homeHref = appUrl,
  homeLabel,
  sidebarLabel = "Navigation de l’application",
  navigationLabel = "Navigation principale de l’application",
  quickNavigationLabel = "Navigation rapide",
  contentId = "dashboard-content",
  shellClassName = "",
  onNotify,
  onRetry,
  onSessionExpired,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const branding = useOrganizationBranding();
  const sidebar = useRef<HTMLElement>(null);
  const sidebarClose = useRef<HTMLButtonElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);

  const closeSidebar = (restoreFocus = false) => {
    setSidebarOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => menuTrigger.current?.focus());
  };

  useEffect(() => {
    if (!sidebarOpen) return;
    sidebarClose.current?.focus();
    let focusFrame = window.requestAnimationFrame(() => {
      focusFrame = window.requestAnimationFrame(() => sidebarClose.current?.focus());
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        window.requestAnimationFrame(() => menuTrigger.current?.focus());
        return;
      }
      if (event.key === "Tab") {
        const focusable = Array.from(
          sidebar.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [],
        ).filter((element) => element.offsetParent !== null || element === document.activeElement);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      await logout();
      onSessionExpired();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
      } else {
        onNotify(error instanceof Error ? error.message : "La déconnexion a échoué.", "error");
      }
    } finally {
      setLogoutBusy(false);
    }
  };

  const applicationHomeLabel = branding
    ? `Accueil de l’application ${branding.companyName} sur Parkventory`
    : "Accueil de l’application Parkventory";
  const resolvedHomeLabel = homeLabel ?? applicationHomeLabel;

  return (
    <div className={`app-shell ${shellClassName}`.trim()}>
      <a className="skip-link" href={`#${contentId}`}>Aller au contenu</a>
      <aside
        ref={sidebar}
        className={`app-sidebar ${sidebarOpen ? "app-sidebar-open" : ""}`}
        aria-label={sidebarLabel}
      >
        <div className="sidebar-heading">
          <AppLink
            href={homeHref}
            aria-label={resolvedHomeLabel}
            onNavigate={() => closeSidebar()}
          >
            <ApplicationBrand />
          </AppLink>
          <button
            ref={sidebarClose}
            type="button"
            className="sidebar-close"
            onClick={() => closeSidebar(true)}
            aria-label="Fermer la navigation"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={navigationLabel}>
          {navigationItems.map(({ route, label, href, icon: Icon }) => (
            <AppLink
              className={activeRoute === route ? "active" : undefined}
              aria-current={activeRoute === route ? "page" : undefined}
              href={href}
              key={route}
              onNavigate={() => closeSidebar()}
            >
              <Icon aria-hidden="true" /> <span>{label}</span>
            </AppLink>
          ))}
        </nav>
        <button className="sidebar-logout" type="button" onClick={handleLogout} disabled={logoutBusy}>
          <LogOut aria-hidden="true" /> {logoutBusy ? "Déconnexion…" : "Se déconnecter"}
        </button>
        <div className="sidebar-profile">
          <span className="avatar">{profile.initials}</span>
          <div><strong>{profile.primary}</strong><small>{profile.secondary}</small></div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Fermer la navigation"
          onClick={() => closeSidebar(true)}
        />
      )}

      <main className="app-main" id={contentId}>
        <div className="app-topbar">
          <AppLink
            className={`mobile-app-logo ${branding ? "mobile-organization-logo" : ""}`.trim()}
            href={homeHref}
            aria-label={resolvedHomeLabel}
          >
            <ApplicationBrand compact />
          </AppLink>
          <div className="app-topbar-actions">
            <ThemeToggle />
            <EnvironmentStatus loading={loading} />
          </div>
          <button
            ref={menuTrigger}
            className="mobile-sidebar-trigger"
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir la navigation"
            aria-expanded={sidebarOpen}
          >
            <Menu aria-hidden="true" />
          </button>
        </div>

        {loadError && (
          <div className="dashboard-error" role="alert">
            <span>{loadError}</span>
            <button type="button" onClick={onRetry}>Réessayer</button>
          </div>
        )}

        {children}
      </main>

      <nav className="mobile-app-nav" aria-label={quickNavigationLabel}>
        {navigationItems.map(({ route, mobileLabel, href, icon: Icon }) => (
          <AppLink
            aria-current={activeRoute === route ? "page" : undefined}
            href={href}
            key={route}
          >
            <Icon aria-hidden="true" /><span>{mobileLabel}</span>
          </AppLink>
        ))}
      </nav>
    </div>
  );
}
