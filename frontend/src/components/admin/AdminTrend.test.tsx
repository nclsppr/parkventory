import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AdminTrend } from "./AdminTrend";

afterEach(cleanup);

describe("AdminTrend", () => {
  it("expose le graphe et ses données sans dépendre de la couleur", () => {
    render(<AdminTrend series={[
      { date: "2026-08-30", newTenants: 0, newUsers: 1, shares: 1, reservations: 0, incidents: 0 },
    ]} />);

    expect(screen.getByRole("img", { name: /Maximum observé : 1 événement par jour/ })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Données quotidiennes du graphique" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nouveaux tenants" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nouveaux utilisateurs" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Incidents" })).toBeInTheDocument();
    expect(document.querySelector(".admin-trend-new-user")).toBeInTheDocument();
  });
});
