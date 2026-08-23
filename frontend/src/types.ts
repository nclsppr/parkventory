export type AvailabilityStatus = "AVAILABLE" | "RESERVED" | "UNAVAILABLE";
export type AvailabilityViewerRelation = "NONE" | "OFFERED" | "RESERVED";

export interface AvailabilityItem {
  id: string;
  dateLabel: string;
  timeLabel: string;
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

export interface ThanksMessage {
  id: string;
  initials: string;
  author: string;
  message: string;
  when: string;
}

export interface DashboardData {
  demo: boolean;
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
  stats: DashboardStats;
  availability: AvailabilityItem[];
  activeShares: AvailabilityItem[];
  thanks: ThanksMessage[];
}

export interface ShareRequest {
  spot: string;
  date: string;
  from: string;
  to: string;
}

export interface InvitationRequest {
  email: string;
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
}
