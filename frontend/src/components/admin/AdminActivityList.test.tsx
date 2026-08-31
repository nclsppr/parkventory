import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AdminActivityItem } from "../../types";
import { AdminActivityList } from "./AdminActivityList";

afterEach(cleanup);

function activity(type: string): AdminActivityItem {
  return {
    id: type,
    type,
    occurredAt: 1_777_000_000,
    severity: type.includes("DENIED") || type.includes("INCIDENT") ? "ERROR" : "INFO",
    outcome: type.includes("DENIED") ? "DENIED" : type.includes("INCIDENT") ? "FAILED" : "SUCCESS",
    organizationId: "org_1",
    userId: "usr_1",
    membershipId: "mem_1",
    entityType: null,
    entityId: null,
    requestId: "req_1",
    route: null,
    errorCode: null,
    organization: { id: "org_1", name: "Acme", domain: "acme.test" },
    actor: { id: "usr_1", displayName: "Alex Martin", email: "alex@acme.test" },
  };
}

describe("AdminActivityList", () => {
  it("traduit les événements réellement émis et affiche les identités humaines", () => {
    render(<AdminActivityList items={[
      activity("MEMBER_REGISTERED"),
      activity("SESSION_STARTED"),
      activity("GODMODE_ACCESS_DENIED"),
      activity("INCIDENT_RECORDED"),
    ]} />);

    expect(screen.getByText("Membre inscrit")).toBeInTheDocument();
    expect(screen.getByText("Session ouverte")).toBeInTheDocument();
    expect(screen.getByText("Accès opérateur refusé")).toBeInTheDocument();
    expect(screen.getByText("Incident enregistré")).toBeInTheDocument();
    expect(screen.getAllByText(/Alex Martin · Acme/)).toHaveLength(4);
  });
});
