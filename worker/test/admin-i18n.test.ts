import { describe, expect, it } from "vitest";
import { supportedLocales } from "../../shared/i18n";
import {
  adminDisplayName,
  adminIntegrityCheckKeys,
  adminIntegrityMessages,
  adminMessage,
  adminMessageKeys,
  adminProblem,
} from "../src/admin-i18n";

describe("catalogues d’administration", () => {
  it.each(supportedLocales)("contient toutes les clés de messages en %s", (locale) => {
    expect(adminMessageKeys).not.toHaveLength(0);
    for (const key of adminMessageKeys) {
      expect(adminMessage(locale, key).trim(), key).not.toBe("");
    }
  });

  it.each(supportedLocales)("contient les neuf diagnostics stables en %s", (locale) => {
    const definitions = adminIntegrityMessages(locale);
    expect(Object.keys(definitions)).toEqual([...adminIntegrityCheckKeys]);
    for (const key of adminIntegrityCheckKeys) {
      expect(definitions[key].label.trim(), `${key}.label`).not.toBe("");
      expect(definitions[key].detail.trim(), `${key}.detail`).not.toBe("");
    }
  });

  it("localise la prose sans modifier les clés de diagnostic", () => {
    const french = adminIntegrityMessages("fr");
    for (const locale of ["en", "de", "lb"] as const) {
      const localized = adminIntegrityMessages(locale);
      expect(Object.keys(localized)).toEqual(Object.keys(french));
      for (const key of adminIntegrityCheckKeys) {
        expect(localized[key].label).not.toBe(french[key].label);
        expect(localized[key].detail).not.toBe(french[key].detail);
      }
    }
  });

  it.each(supportedLocales)("n’expose jamais le vocabulaire technique tenant en %s", (locale) => {
    const prose = [
      ...adminMessageKeys.map((key) => adminMessage(locale, key)),
      ...adminIntegrityCheckKeys.flatMap((key) => {
        const definition = adminIntegrityMessages(locale)[key];
        return [definition.label, definition.detail];
      }),
    ].join("\n");

    expect(prose).not.toMatch(/\btenants?\b|mandant/i);
  });

  it("préfère X-Parkventory-Locale à Accept-Language", async () => {
    const response = adminProblem(new Request("https://parkventory.test", {
      headers: {
        "X-Parkventory-Locale": "de",
        "Accept-Language": "fr, en;q=0.8",
      },
    }), 400, "invalidRole");

    expect(await response.json()).toEqual({
      type: "about:blank",
      title: "Anfrage abgelehnt",
      status: 400,
      detail: "Die angeforderte Rolle ist ungültig.",
    });
  });

  it("respecte les qualités Accept-Language et retombe sur le français", async () => {
    const luxembourgish = adminProblem(new Request("https://parkventory.test", {
      headers: { "Accept-Language": "fr;q=0.3, lb-LU;q=0.9, en;q=0.7" },
    }), 403, "tenantAdminForbidden");
    expect(await luxembourgish.json()).toMatchObject({
      title: "Ufro refuséiert",
      detail: "Dëse Beräich ass fir d’Administrateure vun Ärer Organisatioun reservéiert.",
    });

    const fallback = adminProblem(new Request("https://parkventory.test", {
      headers: { "Accept-Language": "es-MX, it;q=0.8" },
    }), 503, "databaseUnavailable");
    expect(await fallback.json()).toMatchObject({
      title: "Erreur du service",
      detail: "La base de données n’est pas disponible.",
    });
  });

  it("localise uniquement le nom d’un compte dont l’adresse est effacée", () => {
    expect(adminDisplayName("en", "Alice", null)).toBe("Alice");
    expect(adminDisplayName("fr", "Compte supprimé", 1)).toBe("Compte supprimé");
    expect(adminDisplayName("en", "Compte supprimé", 1)).toBe("Deleted account");
    expect(adminDisplayName("de", "Compte supprimé", 1)).toBe("Gelöschtes Konto");
    expect(adminDisplayName("lb", "Compte supprimé", 1)).toBe("Geläschte Kont");
  });
});
