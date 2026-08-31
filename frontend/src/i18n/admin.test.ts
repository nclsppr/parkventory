import { describe, expect, it } from "vitest";
import { supportedLocales } from "../../../shared/i18n";
import { adminMessages } from "./admin";

const tenantAdminEvents = [
  "TENANT_ADMIN_ACCESS_DENIED",
  "TENANT_BRANDING_UPDATED",
  "TENANT_ADMIN_GRANTED",
  "TENANT_ADMIN_REVOKED",
  "TENANT_MEMBER_EMAIL_ERASED",
] as const;

const integrityChecks = [
  "tenant_without_member",
  "spot_owner_tenant_mismatch",
  "offer_spot_owner_mismatch",
  "reservation_offer_member_mismatch",
  "active_offer_overlap",
  "multiple_confirmed_reservations",
  "system_organization_count",
  "system_membership_invalid",
  "system_business_data",
] as const;

describe("adminMessages", () => {
  it("couvre les événements tenant-admin dans les quatre langues", () => {
    for (const locale of supportedLocales) {
      for (const eventType of tenantAdminEvents) {
        expect(adminMessages[locale].eventTypes[eventType]).toBeTruthy();
      }
      expect(adminMessages[locale].activity.unknownEvent("TECHNICAL_CODE")).toContain("TECHNICAL_CODE");
    }
  });

  it("couvre chaque contrôle d’intégrité dans les quatre langues", () => {
    for (const locale of supportedLocales) {
      for (const checkKey of integrityChecks) {
        expect(adminMessages[locale].integrityChecks[checkKey]?.label).toBeTruthy();
        expect(adminMessages[locale].integrityChecks[checkKey]?.detail).toBeTruthy();
      }
    }
  });
});
