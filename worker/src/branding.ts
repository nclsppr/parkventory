import type { Bindings, OrganizationBranding } from "./types";

const hexColorPattern = /^#[0-9a-f]{6}$/i;
const sameOriginLogoPattern = /^\/(?:[a-z0-9][a-z0-9_-]*\/)*[a-z0-9][a-z0-9._-]*\.(?:avif|png|svg|webp)$/i;

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && hexColorPattern.test(value);
}

export interface OrganizationBrandingRow {
  branding_enabled: number | null;
  branding_company_name: string | null;
  branding_logo_url: string | null;
  branding_action_fill: string | null;
  branding_on_action: string | null;
  branding_available_fill: string | null;
  branding_on_available: string | null;
  branding_highlight: string | null;
  branding_dark_action_ink: string | null;
  branding_dark_available_ink: string | null;
  branding_light_action_ink: string | null;
  branding_light_available_ink: string | null;
}

export function organizationBrandingFromRow(
  row: OrganizationBrandingRow | null,
): OrganizationBranding | null {
  if (row?.branding_enabled !== 1) return null;

  const companyName = row.branding_company_name?.trim() ?? "";
  const logoUrl = row.branding_logo_url ?? "";
  const actionFill = row.branding_action_fill;
  const onAction = row.branding_on_action;
  const availableFill = row.branding_available_fill;
  const onAvailable = row.branding_on_available;
  const highlight = row.branding_highlight;
  const darkActionInk = row.branding_dark_action_ink;
  const darkAvailableInk = row.branding_dark_available_ink;
  const lightActionInk = row.branding_light_action_ink;
  const lightAvailableInk = row.branding_light_available_ink;
  if (
    companyName.length < 1
    || companyName.length > 120
    || !sameOriginLogoPattern.test(logoUrl)
    || !isHexColor(actionFill)
    || !isHexColor(onAction)
    || !isHexColor(availableFill)
    || !isHexColor(onAvailable)
    || !isHexColor(highlight)
    || !isHexColor(darkActionInk)
    || !isHexColor(darkAvailableInk)
    || !isHexColor(lightActionInk)
    || !isHexColor(lightAvailableInk)
  ) return null;

  return {
    enabled: true,
    companyName,
    logoUrl,
    colors: {
      actionFill,
      onAction,
      availableFill,
      onAvailable,
      highlight,
      dark: {
        actionInk: darkActionInk,
        availableInk: darkAvailableInk,
      },
      light: {
        actionInk: lightActionInk,
        availableInk: lightAvailableInk,
      },
    },
  };
}

export async function loadOrganizationBranding(
  database: Bindings["DB"],
  normalizedDomain: string,
): Promise<OrganizationBranding | null> {
  const row = await database.prepare(`
    SELECT
      enabled AS branding_enabled,
      company_name AS branding_company_name,
      logo_url AS branding_logo_url,
      action_fill AS branding_action_fill,
      on_action AS branding_on_action,
      available_fill AS branding_available_fill,
      on_available AS branding_on_available,
      highlight AS branding_highlight,
      dark_action_ink AS branding_dark_action_ink,
      dark_available_ink AS branding_dark_available_ink,
      light_action_ink AS branding_light_action_ink,
      light_available_ink AS branding_light_available_ink
    FROM organization_branding
    WHERE normalized_domain = ?1
  `).bind(normalizedDomain).first<OrganizationBrandingRow>();
  return organizationBrandingFromRow(row);
}
