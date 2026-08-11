import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Home,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import { ApiError, logout } from "../api/client";
import {
  appUrl,
  demoLabel,
  findUrl,
  homeUrl,
  isPublicDemo,
  shareUrl,
} from "../config";
import type { DashboardData } from "../types";
import { AppLink } from "./AppLink";
import { Logo } from "./Logo";
import { ThemeToggle } from "./Theme";

export type ApplicationRoute = "dashboard" | "share" | "find";
export type NoticeTone = "success" | "error";

interface AppShellProps {
  activeRoute: ApplicationRoute;
  children: ReactNode;
  data: DashboardData;
  loading: boolean;
  loadError: string | null;
  onNotify: (message: string, tone?: NoticeTone) => void;
  onRetry: () => void;
  onSessionExpired: () => void;
}

const navigation = [
  { route: "dashboard" as const, label: "Accueil", href: appUrl, icon: Home },
  { route: "share" as const, label: "Partager ma place", href: shareUrl, icon: CalendarDays },
  { route: "find" as const, label: "Trouver une place", href: findUrl, icon: Search },
];

export function EnvironmentStatus({ loading }: { loading: boolean }) {
  return (
    <span
      className="demo-status"
      title={isPublicDemo ? "Les données sont fictives et non persistées." : "Les données viennent de PostgreSQL local."}
    >
      <i /> {loading ? "Actualisation…" : demoLabel}
    </span>
  );
}

export function AppShell({
  activeRoute,
  children,
  data,
  loading,
  loadError,
  onNotify,
  onRetry,
  onSessionExpired,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
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
    if (logoutBusy || isPublicDemo) return;
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

  return (
    <div className="app-shell">
      <a className="skip-link" href="#dashboard-content">Aller au contenu</a>
      <aside
        ref={sidebar}
        className={`app-sidebar ${sidebarOpen ? "app-sidebar-open" : ""}`}
        aria-label="Navigation de l’application"
      >
        <div className="sidebar-heading">
          <a href={homeUrl} aria-label="Revenir au site Parkventory"><Logo /></a>
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
        <nav aria-label="Navigation principale de l’application">
          {navigation.map(({ route, label, href, icon: Icon }) => (
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
        {!isPublicDemo && (
          <button className="sidebar-logout" type="button" onClick={handleLogout} disabled={logoutBusy}>
            <LogOut aria-hidden="true" /> {logoutBusy ? "Déconnexion…" : "Se déconnecter"}
          </button>
        )}
        <div className="sidebar-profile">
          <span className="avatar">{data.user.initials}</span>
          <div><strong>{data.user.fullName}</strong><small>{data.organization.name}</small></div>
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

      <main className="app-main" id="dashboard-content">
        <div className="app-topbar">
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
          <a className="mobile-app-logo" href={homeUrl} aria-label="Revenir au site Parkventory"><Logo compact /></a>
          <div className="app-topbar-actions">
            <ThemeToggle />
            <EnvironmentStatus loading={loading} />
          </div>
        </div>

        {loadError && (
          <div className="dashboard-error" role="alert">
            <span>{loadError}</span>
            <button type="button" onClick={onRetry}>Réessayer</button>
          </div>
        )}

        {children}
      </main>

      <nav className="mobile-app-nav" aria-label="Navigation rapide">
        {navigation.map(({ route, label, href, icon: Icon }) => (
          <AppLink
            aria-current={activeRoute === route ? "page" : undefined}
            href={href}
            key={route}
          >
            <Icon aria-hidden="true" /><span>{label === "Partager ma place" ? "Partager" : label === "Trouver une place" ? "Trouver" : label}</span>
          </AppLink>
        ))}
      </nav>
    </div>
  );
}
