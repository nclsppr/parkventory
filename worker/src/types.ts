export type Bindings = Omit<Env, "APP_ENV" | "EMAIL"> & {
  APP_ENV: "development" | "preview" | "production";
  EMAIL?: Env["EMAIL"];
};

export interface AuthenticatedMember {
  sessionId: string;
  membershipId: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  email: string;
  displayName: string;
  role: "MEMBER" | "ADMIN";
}

export interface Variables {
  member: AuthenticatedMember;
}

export type AppEnvironment = {
  Bindings: Bindings;
  Variables: Variables;
};
