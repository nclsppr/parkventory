import type { Locale } from "../../shared/i18n";

export type Bindings = Omit<Env, "APP_ENV" | "EMAIL"> & {
  APP_ENV: "development" | "preview" | "production";
  EMAIL?: Env["EMAIL"];
};

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

export interface AuthenticatedMember {
  sessionId: string;
  membershipId: string;
  organizationId: string;
  organizationKind: "TENANT" | "SYSTEM";
  organizationName: string;
  userId: string;
  email: string;
  displayName: string;
  preferredLocale: Locale | null;
  role: "MEMBER" | "ADMIN";
  godmode: boolean;
  branding: OrganizationBranding | null;
}

export interface Variables {
  member: AuthenticatedMember;
  requestId: string;
}

export type AppEnvironment = {
  Bindings: Bindings;
  Variables: Variables;
};
