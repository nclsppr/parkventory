import { describe, expect, it } from "vitest";
import { supportedLocales } from "../../shared/i18n";
import { adminTenantUrl, localizedUrls, routeUrl } from "./config";

describe("URLs privées localisées", () => {
  it.each(supportedLocales)("garde les slugs admin techniques en %s", (locale) => {
    const urls = localizedUrls(locale);

    expect(urls.tenantAdminUrl).toBe(`/${locale}/app/admin`);
    expect(urls.adminUrl).toBe(`/${locale}/admin`);
    expect(urls.adminTenantsUrl).toBe(`/${locale}/admin/tenants`);
    expect(urls.adminUsersUrl).toBe(`/${locale}/admin/users`);
    expect(urls.adminOperationsUrl).toBe(`/${locale}/admin/operations`);
    expect(routeUrl(locale, "adminOverview")).toBe(urls.adminUrl);
  });

  it("encode le détail tenant avec le builder partagé", () => {
    expect(adminTenantUrl("lb", "org:acme_2026.08-31"))
      .toBe("/lb/admin/tenants/org%3Aacme_2026.08-31");
    expect(localizedUrls("lb").adminTenantUrl("org:acme_2026.08-31"))
      .toBe("/lb/admin/tenants/org%3Aacme_2026.08-31");
  });

  it("propage le refus des identifiants hors contrat", () => {
    expect(() => adminTenantUrl("fr", "org/acme")).toThrow(TypeError);
  });
});
