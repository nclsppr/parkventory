import { describe, expect, it } from "vitest";
import { formatTimeZone } from "./dates";

describe("formatTimeZone", () => {
  it("présente le fuseau comme une heure locale lisible", () => {
    expect(formatTimeZone("Europe/Paris")).toBe("Heure de Paris");
    expect(formatTimeZone("America/New_York")).toBe("Heure de New York");
    expect(formatTimeZone(null)).toBe("Non renseignée");
  });
});
