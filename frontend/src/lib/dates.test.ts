import { afterEach, describe, expect, it, vi } from "vitest";
import { localeConfig, supportedLocales } from "../../../shared/i18n";
import {
  dateInputValue,
  formatAvailabilityDate,
  formatAvailabilityTime,
  formatAvailabilityTimePhrase,
  formatInputDate,
  formatInputTime,
  formatTimeRange,
  formatTimeRangePhrase,
  formatTimeZone,
} from "./dates";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("dateInputValue", () => {
  it("calcule aujourd’hui et demain dans le fuseau du parking", () => {
    const nearUtcMidnight = new Date("2026-08-31T22:30:00.000Z");

    expect(dateInputValue(0, "Europe/Paris", nearUtcMidnight)).toBe("2026-09-01");
    expect(dateInputValue(1, "Europe/Paris", nearUtcMidnight)).toBe("2026-09-02");
    expect(dateInputValue(0, "America/New_York", nearUtcMidnight)).toBe("2026-08-31");
    expect(dateInputValue(0, "Invalid/Zone", nearUtcMidnight)).toBe("2026-09-01");
  });
});

describe("formatTimeZone", () => {
  it("présente le fuseau comme une heure locale lisible", () => {
    expect(formatTimeZone("Europe/Paris")).toBe("Heure de Paris");
    expect(formatTimeZone("America/New_York")).toBe("Heure de New York");
    expect(formatTimeZone(null)).toBe("Non renseignée");
    expect(formatTimeZone("Invalid/Zone")).toBe("Heure locale");
  });

  it("calcule le libellé saisonnier pour la date du créneau", () => {
    const winter = formatTimeZone(
      "Europe/Paris",
      "fr-FR",
      "Fuseau non renseigné",
      "Heure locale",
      "2026-01-15",
    );
    const summer = formatTimeZone(
      "Europe/Paris",
      "fr-FR",
      "Fuseau non renseigné",
      "Heure locale",
      "2026-07-15",
    );

    expect(winter).not.toBe(summer);
    expect(winter).toMatch(/normale|standard/i);
    expect(summer).toMatch(/été|summer/i);
  });

  it("utilise l’heure exacte du créneau le jour du changement d’heure", () => {
    const beforeChange = formatTimeZone(
      "Europe/Paris",
      "fr-FR",
      "Fuseau non renseigné",
      "Heure locale",
      "2026-03-29T01:30",
    );
    const afterChange = formatTimeZone(
      "Europe/Paris",
      "fr-FR",
      "Fuseau non renseigné",
      "Heure locale",
      "2026-03-29T03:30",
    );

    expect(beforeChange).toMatch(/normale|standard/i);
    expect(afterChange).toMatch(/été|summer/i);
    expect(beforeChange).not.toBe(afterChange);
  });

  it("évite un libellé anglais si les données de la locale manquent au navigateur", () => {
    vi.spyOn(Intl.DateTimeFormat, "supportedLocalesOf").mockReturnValue([]);

    expect(formatTimeZone(
      "Europe/Paris",
      "lb-LU",
      "Zäitzon net uginn",
      "Lokal Zäit",
      "2026-09-01T08:00",
    )).toBe("Paris");
    expect(formatTimeZone(
      "Invalid/Zone",
      "lb-LU",
      "Zäitzon net uginn",
      "Lokal Zäit",
    )).toBe("Lokal Zäit");
  });
});

describe("dates localisées", () => {
  it.each(supportedLocales)("formate date et heure à partir des valeurs brutes en %s", (locale) => {
    const intlLocale = localeConfig[locale].intlLocale;
    const expectedDate = locale === "lb"
      ? "Dënschdeg, 25. August 2026"
      : new Intl.DateTimeFormat(intlLocale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(2026, 7, 25));

    expect(formatInputDate("2026-08-25", intlLocale, "missing")).toBe(expectedDate);
    expect(formatAvailabilityDate(
      { localDate: "2026-08-25", dateLabel: "legacy" },
      intlLocale,
      "missing",
    )).toBe(expectedDate);
    expect(formatAvailabilityTime(
      { localFrom: "08:00", localTo: "18:00", timeLabel: "legacy" },
      intlLocale,
      "missing",
    )).toBe(formatTimeRange("08:00", "18:00", intlLocale, "missing"));
  });

  it("conserve les anciens libellés uniquement si les valeurs brutes manquent", () => {
    expect(formatAvailabilityDate({ dateLabel: "legacy date" }, "en-GB", "missing"))
      .toBe("legacy date");
    expect(formatAvailabilityTime({ timeLabel: "legacy time" }, "en-GB", "missing"))
      .toBe("legacy time");
  });

  it("forme les plages horaires grammaticales en allemand et en luxembourgeois", () => {
    expect(formatTimeRangePhrase("08:00", "18:00", "de-DE", "missing"))
      .toBe("von 08:00 bis 18:00 Uhr");
    expect(formatTimeRangePhrase("08:00", "18:00", "lb-LU", "missing"))
      .toBe("vun 08:00 bis 18:00 Auer");
    expect(formatAvailabilityTimePhrase(
      { localFrom: "08:00", localTo: "18:00", timeLabel: "legacy" },
      "de-DE",
      "missing",
    )).toBe("von 08:00 bis 18:00 Uhr");
  });

  it("conserve une date et une heure luxembourgeoises sans dépendre d’ICU", () => {
    expect(formatInputDate("2026-09-01", "lb-LU", "missing"))
      .toBe("Dënschdeg, 1. September 2026");
    expect(formatInputTime("08:05", "lb-LU", "missing")).toBe("08:05");
  });

  it("rejette les dates calendaires impossibles dans toutes les langues", () => {
    for (const locale of supportedLocales) {
      expect(formatInputDate("2026-02-31", localeConfig[locale].intlLocale, "missing"))
        .toBe("missing");
    }
  });
});
