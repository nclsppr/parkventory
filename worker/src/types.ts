export interface TransactionalEmail {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}

export interface SendEmailBinding {
  send(message: TransactionalEmail): Promise<void>;
}

export type Bindings = Omit<Env, "APP_ENV"> & {
  APP_ENV: "development" | "preview" | "production";
  APP_SECRET: string;
  TURNSTILE_SECRET_KEY: string;
  EMAIL_FROM: string;
  PUBLIC_ORIGIN: string;
  EMAIL?: SendEmailBinding;
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
