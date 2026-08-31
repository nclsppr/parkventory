import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AdminActivityItem } from "../../types";
import { I18nProvider } from "../../i18n/I18n";
import { AdminActivityList } from "./AdminActivityList";

afterEach(cleanup);
beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/fr/");
});

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
    render(<I18nProvider><AdminActivityList items={[
      activity("MEMBER_REGISTERED"),
      activity("SESSION_STARTED"),
      activity("GODMODE_ACCESS_DENIED"),
      activity("INCIDENT_RECORDED"),
      activity("TENANT_ADMIN_ACCESS_DENIED"),
      activity("TENANT_BRANDING_UPDATED"),
      activity("TENANT_ADMIN_GRANTED"),
      activity("TENANT_ADMIN_REVOKED"),
      activity("TENANT_MEMBER_EMAIL_ERASED"),
    ]} /></I18nProvider>);

    expect(screen.getByText("Membre inscrit")).toBeInTheDocument();
    expect(screen.getByText("Session ouverte")).toBeInTheDocument();
    expect(screen.getByText("Accès opérateur refusé")).toBeInTheDocument();
    expect(screen.getByText("Incident enregistré")).toBeInTheDocument();
    expect(screen.getByText("Accès administrateur refusé")).toBeInTheDocument();
    expect(screen.getByText("Identité visuelle actualisée")).toBeInTheDocument();
    expect(screen.getByText("Administrateur nommé")).toBeInTheDocument();
    expect(screen.getByText("Rôle d’administrateur retiré")).toBeInTheDocument();
    expect(screen.getByText("Adresse e-mail du membre effacée")).toBeInTheDocument();
    expect(screen.getAllByText(/Alex Martin · Acme/)).toHaveLength(9);
  });
});
