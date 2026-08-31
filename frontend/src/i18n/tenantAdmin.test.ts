import { describe, expect, it } from "vitest";
import { supportedLocales } from "../../../shared/i18n";
import { tenantAdminMessages } from "./tenantAdmin";

function catalogShape(value: unknown): unknown {
  if (typeof value === "function") return "function";
  if (typeof value === "string") return "string";
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([key, child]) => [key, catalogShape(child)]),
    );
  }
  return typeof value;
}

function stringLeaves(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(stringLeaves);
}

describe("tenant admin messages", () => {
  it("conserve exactement la même structure en FR, EN, DE et LB", () => {
    const referenceShape = catalogShape(tenantAdminMessages.fr);
    for (const locale of supportedLocales) {
      expect(catalogShape(tenantAdminMessages[locale])).toEqual(referenceShape);
      expect(stringLeaves(tenantAdminMessages[locale]).every((message) => message.trim().length > 0)).toBe(true);
    }
  });

  it.each(supportedLocales)("localise les valeurs dynamiques et les pluriels en %s", (locale) => {
    const copy = tenantAdminMessages[locale];
    const singular = copy.usage.daySummary("DATE", 1, "1", 1, "1");
    const plural = copy.usage.daySummary("DATE", 2, "2", 2, "2");

    expect(copy.state.loadingWorkspace("ACME")).toContain("ACME");
    expect(copy.header.scopeDescription("acme.test")).toContain("acme.test");
    expect(copy.branding.logoAlt("ACME")).toContain("ACME");
    expect(copy.members.caption("ACME")).toContain("ACME");
    expect(copy.erase.title("Alice")).toContain("Alice");
    expect(copy.erase.success("Alice")).toContain("Alice");
    expect(singular).toContain("DATE");
    expect(plural).toContain("DATE");
    expect(plural).not.toBe(singular);
  });

  it.each(supportedLocales)("emploie organisation dans toute la prose visible en %s", (locale) => {
    const copy = tenantAdminMessages[locale];
    const prose = [
      ...stringLeaves(copy),
      copy.state.loadingWorkspace("ACME"),
      copy.header.scopeDescription("acme.test"),
      copy.usage.title(30, "30"),
      copy.usage.chartLabel(30, "30"),
      copy.usage.daySummary("DATE", 2, "2", 2, "2"),
      copy.branding.logoAlt("ACME"),
      copy.members.caption("ACME"),
      copy.erase.title("Alice"),
      copy.erase.success("Alice"),
    ].join("\n");
    const expectedTerm = {
      fr: "organisation",
      en: "organisation",
      de: "Organisation",
      lb: "Organisatioun",
    }[locale];

    expect(prose).toContain(expectedTerm);
    expect(prose).not.toMatch(/\btenants?\b|mandant/i);
  });
});
