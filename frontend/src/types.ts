import type { Locale } from "../../shared/i18n";

export type AvailabilityStatus = "AVAILABLE" | "RESERVED" | "UNAVAILABLE";
export type AvailabilityViewerRelation = "NONE" | "OFFERED" | "RESERVED";

export interface AvailabilityItem {
  id: string;
  localDate?: string;
  localFrom?: string;
  localTo?: string;
  dateLabel?: string;
  timeLabel?: string;
  timeZone: string;
  spot: string;
  level: string;
  status: AvailabilityStatus;
  viewerRelation: AvailabilityViewerRelation;
  reservationId: string | null;
  canCancel: boolean;
  canWithdraw: boolean;
}

export interface DashboardStats {
  shares: number;
  reservations: number;
  availableSpots: number;
}

export interface OrganizationBranding {
  enabled: true;
  companyName: string;
  logoUrl: string;
  colors: {
    actionFill: string;
    onAction: string;
    availableFill: string;
    onAvailable: string;
    highlight: string;
    dark: {
      actionInk: string;
      availableInk: string;
    };
    light: {
      actionInk: string;
      availableInk: string;
    };
  };
}

export interface DashboardData {
  user: {
    firstName: string;
    fullName: string;
    initials: string;
    assignedSpot: string | null;
    assignedLevel: string | null;
    assignedSiteTimeZone: string | null;
  };
  organization: {
    name: string;
    sharedTotal: number;
  };
  branding: OrganizationBranding | null;
  stats: DashboardStats;
  availability: AvailabilityItem[];
  activeShares: AvailabilityItem[];
}

export interface ShareRequest {
  spot: string;
  date: string;
  from: string;
  to: string;
}

export interface SpotRequest {
  label: string;
  level?: string;
}

export interface ActionResponse {
  accepted: boolean;
  message: string;
}

export interface SessionData {
  authenticated: boolean;
  displayName: string;
  email: string;
  organizationName: string;
  role: "MEMBER" | "ADMIN";
  branding: OrganizationBranding | null;
  locale: Locale;
}
