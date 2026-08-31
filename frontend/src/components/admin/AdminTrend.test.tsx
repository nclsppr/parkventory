import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { I18nProvider } from "../../i18n/I18n";
import { AdminTrend } from "./AdminTrend";

afterEach(cleanup);
beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/fr/");
});

describe("AdminTrend", () => {
  it("expose le graphe et ses données sans dépendre de la couleur", () => {
    render(<I18nProvider><AdminTrend series={[
      { date: "2026-08-30", newTenants: 0, newUsers: 1, shares: 1, reservations: 0, incidents: 0 },
    ]} /></I18nProvider>);

    expect(screen.getByRole("img", { name: /Maximum observé : 1 événement par jour/ })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Données quotidiennes du graphique" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nouvelles organisations" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nouveaux utilisateurs" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Incidents" })).toBeInTheDocument();
    expect(document.querySelector(".admin-trend-new-user")).toBeInTheDocument();
  });
});
