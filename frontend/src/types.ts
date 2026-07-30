export type AvailabilityStatus = "AVAILABLE" | "RESERVED" | "UNAVAILABLE";

export interface AvailabilityItem {
  id: string;
  dateLabel: string;
  timeLabel: string;
  spot: string;
  level: string;
  status: AvailabilityStatus;
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
  };
  organization: {
    name: string;
    sharedTotal: number;
  };
  stats: DashboardStats;
  availability: AvailabilityItem[];
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
