import { describe, expect, it } from "vitest";
import { demoDashboard } from "../data/demo";
import { dateInputValue, formatInputDate } from "../lib/dates";
import { addDemoShare } from "./SharePage";

describe("demo share management", () => {
  it("keeps the seeded active share relative to the current date", () => {
    expect(demoDashboard.activeShares[0].dateLabel)
      .toBe(formatInputDate(dateInputValue(1)));
  });

  it("adds a demo share to management and only exposes nearby shares in discovery", () => {
    const nearby = addDemoShare(
      structuredClone(demoDashboard),
      {
        spot: "A-24",
        date: dateInputValue(2),
        from: "08:00",
        to: "18:00",
      },
      "demo-nearby-share",
    );

    expect(nearby.activeShares.at(-1)).toMatchObject({
      id: "demo-nearby-share",
      status: "UNAVAILABLE",
      viewerRelation: "OFFERED",
      canWithdraw: true,
    });
    expect(nearby.availability.some((item) => item.id === "demo-nearby-share")).toBe(true);
    expect(nearby.stats.shares).toBe(demoDashboard.stats.shares + 1);
    expect(nearby.organization.sharedTotal).toBe(demoDashboard.organization.sharedTotal + 1);

    const distant = addDemoShare(
      structuredClone(demoDashboard),
      {
        spot: "A-24",
        date: dateInputValue(30),
        from: "08:00",
        to: "18:00",
      },
      "demo-distant-share",
    );

    expect(distant.activeShares.some((item) => item.id === "demo-distant-share")).toBe(true);
    expect(distant.availability.some((item) => item.id === "demo-distant-share")).toBe(false);
  });
});
