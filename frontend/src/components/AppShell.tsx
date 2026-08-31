import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Home,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import type { Locale } from "../../../shared/i18n";
import { ApiError, logout, updateProfileLocale } from "../api/client";
import { localizedUrls } from "../config";
import { applicationMessages } from "../i18n/application";
import { commonMessages } from "../i18n/common";
import { useI18n } from "../i18n/I18n";
import type { DashboardData } from "../types";
import { AppLink } from "./AppLink";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ApplicationBrand, useOrganizationBranding } from "./OrganizationBranding";
import { ThemeToggle } from "./Theme";

export type ApplicationRoute = "dashboard" | "share" | "find";
export type NoticeTone = "success" | "error";

interface AppShellProps {
  activeRoute: ApplicationRoute;
  children: ReactNode;
  data: DashboardData;
  loading: boolean;
  loadError: string | null;
  onLocalePersisted: (locale: Locale) => void;
  onNotify: (message: string, tone?: NoticeTone) => void;
  onRetry: () => void;
  onSessionExpired: () => void;
}

export function EnvironmentStatus({ loading }: { loading: boolean }) {
  const { locale } = useI18n();
  const copy = applicationMessages[locale].shell;
  return (
    <span
      className="demo-status"
      title={copy.betaTitle}
    >
      <i /> {loading ? copy.refreshing : copy.betaLabel}
    </span>
  );
}

export function AppShell({
  activeRoute,
  children,
  data,
  loading,
  loadError,
  onLocalePersisted,
  onNotify,
  onRetry,
  onSessionExpired,
}: AppShellProps) {
  const { locale } = useI18n();
  const copy = applicationMessages[locale].shell;
  const commonCopy = commonMessages[locale];
  const { appUrl, findUrl, shareUrl } = localizedUrls(locale);
  const navigation = [
    {
      route: "dashboard" as const,
      label: copy.navigation.dashboard,
      shortLabel: copy.navigation.dashboardShort,
      href: appUrl,
      icon: Home,
    },
    {
      route: "share" as const,
      label: copy.navigation.share,
      shortLabel: copy.navigation.shareShort,
      href: shareUrl,
      icon: CalendarDays,
    },
    {
      route: "find" as const,
      label: copy.navigation.find,
      shortLabel: copy.navigation.findShort,
      href: findUrl,
      icon: Search,
    },
  ];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [languageBusy, setLanguageBusy] = useState(false);
  const branding = useOrganizationBranding();
  const sidebar = useRef<HTMLElement>(null);
  const sidebarClose = useRef<HTMLButtonElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);

  const closeSidebar = (restoreFocus = false) => {
    setSidebarOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => menuTrigger.current?.focus());
  };

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const desktopLayout = window.matchMedia("(min-width: 821px)");
    const closeInDesktopLayout = () => {
      if (desktopLayout.matches) setSidebarOpen(false);
    };

    closeInDesktopLayout();
    desktopLayout.addEventListener("change", closeInDesktopLayout);
    return () => desktopLayout.removeEventListener("change", closeInDesktopLayout);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
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
          sidebar.current?.querySelectorAll<HTMLElement>(
            "a[href], button:not([disabled]), select:not([disabled])",
          ) ?? [],
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
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
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
        onNotify(error instanceof Error ? error.message : copy.logoutFailed, "error");
      }
    } finally {
      setLogoutBusy(false);
    }
  };

  const handleProfileLocaleChange = async (nextLocale: Locale) => {
    if (languageBusy || nextLocale === locale) return;
    setLanguageBusy(true);
    try {
      await updateProfileLocale(nextLocale);
      onLocalePersisted(nextLocale);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
      } else {
        onNotify(error instanceof Error ? error.message : copy.languageUpdateFailed, "error");
      }
    } finally {
      setLanguageBusy(false);
    }
  };

  const applicationHomeLabel = branding
    ? copy.organizationAppHome(branding.companyName)
    : copy.appHome;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#dashboard-content">{commonCopy.skipToContent}</a>
      <aside
        ref={sidebar}
        id="application-sidebar"
        className={`app-sidebar ${sidebarOpen ? "app-sidebar-open" : ""}`}
        aria-label={copy.appNavigation}
        aria-modal={sidebarOpen ? "true" : undefined}
        role={sidebarOpen ? "dialog" : undefined}
      >
        <div className="sidebar-heading">
          <AppLink
            href={appUrl}
            aria-label={applicationHomeLabel}
            onNavigate={() => closeSidebar()}
          >
            <ApplicationBrand />
          </AppLink>
          <button
            ref={sidebarClose}
            type="button"
            className="sidebar-close"
            onClick={() => closeSidebar(true)}
            aria-label={copy.closeNavigation}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={copy.mainNavigation}>
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
        <button className="sidebar-logout" type="button" onClick={handleLogout} disabled={logoutBusy}>
          <LogOut aria-hidden="true" /> {logoutBusy ? copy.signingOut : copy.signOut}
        </button>
        <section className="sidebar-profile" aria-label={copy.profile}>
          <div className="sidebar-profile-identity">
            <span className="avatar">{data.user.initials}</span>
            <div><strong>{data.user.fullName}</strong><small>{data.organization.name}</small></div>
          </div>
          <div className="sidebar-profile-preference">
            <span>{commonCopy.language}</span>
            <LanguageSwitcher
              className="sidebar-profile-language"
              disabled={languageBusy}
              onLocaleChange={handleProfileLocaleChange}
            />
          </div>
        </section>
      </aside>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          aria-hidden="true"
          onClick={() => closeSidebar(true)}
        />
      )}

      <main className="app-main" id="dashboard-content" inert={sidebarOpen ? true : undefined}>
        <div className="app-topbar">
          <AppLink
            className={`mobile-app-logo ${branding ? "mobile-organization-logo" : ""}`.trim()}
            href={appUrl}
            aria-label={applicationHomeLabel}
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
            aria-label={copy.openNavigation}
            aria-controls="application-sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu aria-hidden="true" />
          </button>
        </div>

        {loadError && (
          <div className="dashboard-error" role="alert">
            <span>{loadError}</span>
            <button type="button" onClick={onRetry}>{commonCopy.retry}</button>
          </div>
        )}

        {children}
      </main>

      <nav
        className="mobile-app-nav"
        aria-label={copy.quickNavigation}
        inert={sidebarOpen ? true : undefined}
      >
        {navigation.map(({ route, shortLabel, href, icon: Icon }) => (
          <AppLink
            aria-current={activeRoute === route ? "page" : undefined}
            href={href}
            key={route}
          >
            <Icon aria-hidden="true" /><span>{shortLabel}</span>
          </AppLink>
        ))}
      </nav>
    </div>
  );
}
