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
  branding_logo_enabled?: number | null;
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
  const storedLogoUrl = row.branding_logo_url ?? "";
  const logoEnabled = row.branding_logo_enabled !== 0;
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
    || (logoEnabled && !sameOriginLogoPattern.test(storedLogoUrl))
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
    logoUrl: logoEnabled ? storedLogoUrl : null,
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
      logo_enabled AS branding_logo_enabled,
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

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

export interface DerivedBrandingPalette {
  actionFill: string;
  onAction: string;
  availableFill: string;
  onAvailable: string;
  highlight: string;
  darkActionInk: string;
  darkAvailableInk: string;
  lightActionInk: string;
  lightAvailableInk: string;
}

function normalizedHexColor(value: unknown): string | null {
  if (!isHexColor(value)) return null;
  return value.toUpperCase();
}

function rgbFromHex(value: string): RgbColor {
  return {
    red: Number.parseInt(value.slice(1, 3), 16),
    green: Number.parseInt(value.slice(3, 5), 16),
    blue: Number.parseInt(value.slice(5, 7), 16),
  };
}

function hexFromRgb(color: RgbColor): string {
  const channel = (value: number) => Math.round(value).toString(16).padStart(2, "0").toUpperCase();
  return `#${channel(color.red)}${channel(color.green)}${channel(color.blue)}`;
}

function relativeLuminance(color: RgbColor): number {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return (0.2126 * channel(color.red))
    + (0.7152 * channel(color.green))
    + (0.0722 * channel(color.blue));
}

export function colorContrast(first: string, second: string): number {
  const firstLuminance = relativeLuminance(rgbFromHex(first));
  const secondLuminance = relativeLuminance(rgbFromHex(second));
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function mixColor(color: string, target: string, ratio: number): string {
  const sourceRgb = rgbFromHex(color);
  const targetRgb = rgbFromHex(target);
  return hexFromRgb({
    red: sourceRgb.red + ((targetRgb.red - sourceRgb.red) * ratio),
    green: sourceRgb.green + ((targetRgb.green - sourceRgb.green) * ratio),
    blue: sourceRgb.blue + ((targetRgb.blue - sourceRgb.blue) * ratio),
  });
}

function ensureTextContrast(color: string, background: string, target: string): string {
  if (colorContrast(color, background) >= 4.5) return color;
  for (let step = 1; step <= 100; step += 1) {
    const candidate = mixColor(color, target, step / 100);
    if (colorContrast(candidate, background) >= 4.5) return candidate;
  }
  return target;
}

function foregroundFor(fill: string): string {
  const dark = "#030504";
  const light = "#FFFFFF";
  return colorContrast(fill, dark) >= colorContrast(fill, light) ? dark : light;
}

export function deriveBrandingPalette(
  actionColor: unknown,
  availableColor: unknown,
): DerivedBrandingPalette | null {
  const actionFill = normalizedHexColor(actionColor);
  const availableFill = normalizedHexColor(availableColor);
  if (!actionFill || !availableFill) return null;

  return {
    actionFill,
    onAction: foregroundFor(actionFill),
    availableFill,
    onAvailable: foregroundFor(availableFill),
    highlight: availableFill,
    darkActionInk: ensureTextContrast(actionFill, "#030504", "#FFFFFF"),
    darkAvailableInk: ensureTextContrast(availableFill, "#030504", "#FFFFFF"),
    lightActionInk: ensureTextContrast(actionFill, "#F4F6F1", "#030504"),
    lightAvailableInk: ensureTextContrast(availableFill, "#F4F6F1", "#030504"),
  };
}
