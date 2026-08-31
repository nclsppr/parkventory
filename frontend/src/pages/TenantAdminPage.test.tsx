import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { localeConfig, supportedLocales, type Locale } from "../../../shared/i18n";
import { tenantAdminMessages } from "../i18n/tenantAdmin";
import type { TenantAdminMember, TenantAdminOverviewData } from "../types";

const i18nState = vi.hoisted(() => ({ locale: "fr", intlLocale: "fr-LU" }));
const api = vi.hoisted(() => {
  class MockApiError extends Error {
    constructor(message: string, public readonly status: number) {
      super(message);
      this.name = "ApiError";
    }
  }
  return {
    ApiError: MockApiError,
    eraseTenantMemberEmail: vi.fn(),
    loadTenantAdminMembers: vi.fn(),
    loadTenantAdminOverview: vi.fn(),
    updateTenantAdminBranding: vi.fn(),
  };
});

vi.mock("../i18n/I18n", () => ({ useI18n: () => i18nState }));
vi.mock("../api/client", () => api);

import { TenantAdminPage } from "./TenantAdminPage";

const overview: TenantAdminOverviewData = {
  generatedAt: 1_777_000_000,
  tenant: { id: "org_acme", name: "Acme", domain: "acme.test" },
  totals: {
    users: 12_345,
    administrators: 2,
    parkingSpots: 38,
    shares: 81,
    reservations: 42,
    activeSessions: 7,
  },
  period: {
    days: 30,
    from: 1_774_408_000,
    to: 1_777_000_000,
    shares: 2,
    reservations: 1,
    activeUsers: 5,
  },
  series: [{ date: "2026-04-23", shares: 2, reservations: 1 }],
  branding: {
    configured: true,
    enabled: true,
    actionColor: "#C8F913",
    availableColor: "#15C9D5",
    logoAvailable: false,
    logoEnabled: false,
    logoUrl: null,
    updatedAt: null,
  },
};

const members: TenantAdminMember[] = [
  {
    membershipId: "mem_alice",
    userId: "usr_alice",
    displayName: "Alice Example",
    email: "alice@acme.test",
    emailErasedAt: null,
    role: "MEMBER",
    createdAt: 1_777_000_000,
    activeSessions: 1,
    lastActivityAt: null,
    isSelf: false,
    canEraseEmail: true,
  },
  {
    membershipId: "mem_admin",
    userId: "usr_admin",
    displayName: "Admin Example",
    email: "admin@acme.test",
    emailErasedAt: null,
    role: "ADMIN",
    createdAt: 1_777_000_000,
    activeSessions: 2,
    lastActivityAt: 1_777_000_000,
    isSelf: true,
    canEraseEmail: false,
  },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("TenantAdminPage i18n", () => {
  it.each(supportedLocales)("rend le panneau, ses formats et ses noms accessibles en %s", async (locale) => {
    i18nState.locale = locale;
    i18nState.intlLocale = localeConfig[locale].intlLocale;
    api.loadTenantAdminOverview.mockResolvedValue(overview);
    api.loadTenantAdminMembers.mockResolvedValue({ items: members, page: { nextCursor: null } });
    api.updateTenantAdminBranding.mockResolvedValue({ accepted: true, message: "Réponse serveur ignorée" });
    api.eraseTenantMemberEmail.mockResolvedValue({ accepted: true, message: "Réponse serveur ignorée" });
    const onNotify = vi.fn();
    const onRefreshDashboard = vi.fn().mockResolvedValue(undefined);
    const copy = tenantAdminMessages[locale];

    render(
      <TenantAdminPage
        organizationName="Acme"
        onNotify={onNotify}
        onSessionExpired={vi.fn()}
        onRefreshDashboard={onRefreshDashboard}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Acme", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: copy.metrics.regionLabel })).toHaveTextContent(
      new Intl.NumberFormat(i18nState.intlLocale).format(12_345),
    );
    expect(screen.getByRole("heading", { name: copy.branding.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: copy.members.title })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: copy.usage.chartLabel(30, new Intl.NumberFormat(i18nState.intlLocale).format(30)) })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: copy.branding.previewAria })).toBeInTheDocument();
    expect(screen.getByLabelText(copy.members.searchLabel)).toHaveAttribute("placeholder", copy.members.searchPlaceholder);
    expect(screen.getByText(copy.common.never)).toBeInTheDocument();
    expect(screen.getByLabelText(`${copy.branding.actionColor} · ${copy.branding.hexadecimalValue}`)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\btenants?\b|mandant/i);

    fireEvent.click(screen.getByRole("button", { name: copy.branding.save }));
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith(copy.branding.saved));

    const eraseTrigger = screen.getByRole("button", { name: copy.members.eraseEmail });
    eraseTrigger.focus();
    fireEvent.click(eraseTrigger);
    expect(screen.getByRole("alertdialog", { name: copy.erase.title("Alice Example") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.erase.close })).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(eraseTrigger).toHaveFocus();
  });

  it("annonce un succès localisé après l’effacement au lieu de reprendre la prose du serveur", async () => {
    const locale: Locale = "en";
    i18nState.locale = locale;
    i18nState.intlLocale = localeConfig[locale].intlLocale;
    api.loadTenantAdminOverview.mockResolvedValue(overview);
    api.loadTenantAdminMembers.mockResolvedValue({ items: members, page: { nextCursor: null } });
    api.eraseTenantMemberEmail.mockResolvedValue({ accepted: true, message: "Texte serveur en français" });
    const onNotify = vi.fn();

    render(
      <TenantAdminPage
        organizationName="Acme"
        onNotify={onNotify}
        onSessionExpired={vi.fn()}
        onRefreshDashboard={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: tenantAdminMessages.en.members.eraseEmail }));
    fireEvent.click(screen.getByRole("button", { name: tenantAdminMessages.en.erase.confirm }));
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith(tenantAdminMessages.en.erase.success("Alice Example")));
    expect(onNotify).not.toHaveBeenCalledWith("Texte serveur en français");
  });
});
