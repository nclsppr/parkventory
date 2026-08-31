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
  logoUrl: string | null;
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
  godmode: boolean;
  branding: OrganizationBranding | null;
  locale: Locale;
}

export type AdminActivitySeverity = "INFO" | "WARNING" | "ERROR";
export type AdminActivityOutcome = "SUCCESS" | "DENIED" | "FAILED";

export interface AdminActivityItem {
  id: string;
  type: string;
  occurredAt: number;
  severity: AdminActivitySeverity;
  outcome: AdminActivityOutcome;
  organizationId: string | null;
  userId: string | null;
  membershipId: string | null;
  entityType: string | null;
  entityId: string | null;
  requestId: string | null;
  route: string | null;
  errorCode: string | null;
  organization: null | {
    id: string;
    name: string | null;
    domain: string | null;
  };
  actor: null | {
    id: string;
    displayName: string | null;
    email: string | null;
  };
}

export interface AdminPageInfo {
  nextCursor: string | null;
}

export interface AdminOverviewData {
  generatedAt: number;
  window: {
    days: number;
    from: number;
    to: number;
    timeZone: "UTC";
  };
  totals: {
    tenants: number;
    users: number;
    parkingSpots: number;
    shares: number;
    reservations: number;
    activeSessions: number;
  };
  period: {
    newTenants: number;
    newUsers: number;
    shares: number;
    reservations: number;
    incidents: number;
    activeUsers7d: number;
    activeUsers30d: number;
    withdrawals: number;
    cancellations: number;
    reservationRate: number | null;
  };
  series: Array<{
    date: string;
    newTenants: number;
    newUsers: number;
    shares: number;
    reservations: number;
    incidents: number;
  }>;
}

export interface AdminTenantSummary {
  id: string;
  domain: string;
  name: string;
  createdAt: number;
  memberCount: number;
  spotCount: number;
  shareCount: number;
  reservationCount: number;
  activeSessionCount: number;
  lastActivityAt: number | null;
  brandingEnabled: boolean;
}

export interface AdminTenantsData {
  items: AdminTenantSummary[];
  page: AdminPageInfo;
}

export interface AdminTenantDetailData {
  tenant: {
    id: string;
    domain: string;
    name: string;
    createdAt: number;
    branding: null | {
      enabled: boolean;
      companyName: string;
      logoUrl: string | null;
    };
  };
  stats: {
    users: number;
    parkingSpots: number;
    shares: number;
    reservations: number;
    activeSessions: number;
  };
  recentActivity: AdminActivityItem[];
  recentMembers: Array<{
    membershipId: string;
    userId: string;
    displayName: string;
    email: string | null;
    emailErasedAt: number | null;
    role: "MEMBER" | "ADMIN";
    createdAt: number;
    activeSessions: number;
    lastActivityAt: number | null;
  }>;
  recentSpots: Array<{
    id: string;
    label: string;
    level: string;
    timeZone: string;
    createdAt: number;
    owner: {
      membershipId: string;
      userId: string;
      displayName: string;
      email: string | null;
    };
    shares: number;
    reservations: number;
  }>;
  links: {
    users: string;
    activity: string;
  };
}

export interface AdminUserSummary {
  id: string;
  email: string | null;
  emailErasedAt: number | null;
  displayName: string;
  createdAt: number;
  membershipId: string;
  role: "MEMBER" | "ADMIN";
  tenant: {
    id: string;
    name: string;
    domain: string;
  };
  spot: null | {
    id: string;
    label: string;
    level: string;
  };
  activeSessions: number;
  lastSessionAt: number | null;
  lastActivityAt: number | null;
  shares: number;
  reservations: number;
}

export interface TenantAdminOverviewData {
  generatedAt: number;
  tenant: {
    id: string;
    name: string;
    domain: string;
  };
  totals: {
    users: number;
    administrators: number;
    parkingSpots: number;
    shares: number;
    reservations: number;
    activeSessions: number;
  };
  period: {
    days: 30;
    from: number;
    to: number;
    shares: number;
    reservations: number;
    activeUsers: number;
  };
  series: Array<{
    date: string;
    shares: number;
    reservations: number;
  }>;
  branding: {
    configured: boolean;
    enabled: boolean;
    actionColor: string;
    availableColor: string;
    logoAvailable: boolean;
    logoEnabled: boolean;
    logoUrl: string | null;
    updatedAt: number | null;
  };
}

export interface TenantAdminMember {
  membershipId: string;
  userId: string;
  displayName: string;
  email: string | null;
  emailErasedAt: number | null;
  role: "MEMBER" | "ADMIN";
  createdAt: number;
  activeSessions: number;
  lastActivityAt: number | null;
  isSelf: boolean;
  canEraseEmail: boolean;
}

export interface TenantAdminMembersData {
  items: TenantAdminMember[];
  page: AdminPageInfo;
}

export interface AdminUsersData {
  items: AdminUserSummary[];
  page: AdminPageInfo;
}

export interface AdminActivityData {
  items: AdminActivityItem[];
  page: AdminPageInfo;
}

export interface AdminDiagnosticsData {
  generatedAt: number;
  database: {
    status: "ok";
  };
  telemetry: {
    events: number;
    oldestEventAt: number | null;
    latestEventAt: number | null;
  };
  authentication: {
    pendingMagicLinks: number;
    expiredMagicLinks: number;
    activeTenantSessions: number;
    activeSystemSessions: number;
    revokedSessions: number;
  };
  incidents: {
    last24Hours: number;
    last7Days: number;
    latest: Array<{
      id: string;
      incidentId: string | null;
      occurredAt: number;
      route: string | null;
      errorCode: string | null;
      requestId: string | null;
    }>;
  };
  integrity: {
    status: "healthy" | "attention";
    issueCount: number;
    checks: Array<{
      key: string;
      label: string;
      severity: "WARNING" | "ERROR";
      count: number;
      status: "ok" | "attention";
      detail: string;
    }>;
  };
}

export interface AdminIntegrityIssue {
  issueKind: "ROW" | "MISSING";
  organizationId: string | null;
  references: Array<{
    type: string;
    id: string;
  }>;
  occurrences: number;
}

export interface AdminIntegrityData {
  check: string;
  items: AdminIntegrityIssue[];
  page: AdminPageInfo;
}
