import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { ApiError, requestMagicLink, verifyMagicLink } from "../api/client";
import { localizedUrls } from "../config";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/Theme";
import { Turnstile } from "../components/Turnstile";
import { authMessages } from "../i18n/auth";
import { useI18n } from "../i18n/I18n";
import type { SessionData } from "../types";

const personalDomains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"];
const verificationRequests = new Map<string, Promise<SessionData>>();

type SignInMode = "application" | "admin";
type SignInFeedbackKey =
  | "invalidEmail"
  | "invalidProfessionalEmail"
  | "securityRequired"
  | "linkSent"
  | "requestRateLimited"
  | "requestUnavailable"
  | "requestFailed";
type SignInFeedback = { key: SignInFeedbackKey } | { text: string } | null;

export function sessionLandingUrl(session: Pick<SessionData, "godmode" | "locale">) {
  const urls = localizedUrls(session.locale);
  return session.godmode ? urls.adminUrl : urls.appUrl;
}

function verifyMagicLinkOnce(token: string): Promise<SessionData> {
  const existingRequest = verificationRequests.get(token);
  if (existingRequest) return existingRequest;
  const request = verifyMagicLink(token);
  verificationRequests.set(token, request);
  void request.catch(() => {
    if (verificationRequests.get(token) === request) verificationRequests.delete(token);
  });
  return request;
}

export function SignInPage({
  reason,
  mode = "application",
}: {
  reason?: string;
  mode?: SignInMode;
}) {
  const { locale } = useI18n();
  const copy = authMessages[locale];
  const modeCopy = mode === "admin" ? copy.admin : null;
  const { homeUrl } = localizedUrls(locale);
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [challengeKey, setChallengeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<SignInFeedback>(reason ? { text: reason } : null);
  const handleTurnstile = useCallback((token: string | null) => setTurnstileToken(token), []);

  useEffect(() => {
    setFeedback((current) => {
      if (reason) return { text: reason };
      return current && "text" in current ? null : current;
    });
  }, [reason]);

  const message = feedback
    ? "text" in feedback
      ? feedback.text
      : feedback.key === "invalidEmail"
        ? copy.admin.invalidEmail
        : copy[feedback.key]
    : null;
  const sent = feedback !== null && "key" in feedback && feedback.key === "linkSent";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    const domain = normalized.split("@")[1];
    const validFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
    if (!validFormat) {
      setFeedback({ key: mode === "admin" ? "invalidEmail" : "invalidProfessionalEmail" });
      return;
    }
    if (mode === "application" && (!domain || personalDomains.includes(domain))) {
      setFeedback({ key: "invalidProfessionalEmail" });
      return;
    }
    if (!turnstileToken) {
      setFeedback({ key: "securityRequired" });
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      await requestMagicLink(normalized, turnstileToken, mode === "admin" ? "admin" : "tenant");
      setFeedback({ key: "linkSent" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        setFeedback({ key: "requestRateLimited" });
      } else if (error instanceof ApiError && (error.status === 0 || error.status >= 500)) {
        setFeedback({ key: "requestUnavailable" });
      } else {
        setFeedback({ key: "requestFailed" });
      }
    } finally {
      setBusy(false);
      setChallengeKey((key) => key + 1);
    }
  };

  return (
    <main className={`auth-page ${mode === "admin" ? "auth-page-admin" : ""}`.trim()}>
      <div className="auth-backdrop" aria-hidden="true" />
      <a className="auth-brand" href={homeUrl} aria-label={copy.brandHomeLabel}>
        <Logo />
      </a>
      <div className="auth-preferences">
        <LanguageSwitcher />
        <ThemeToggle className="auth-theme-toggle" />
      </div>
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-icon"><Mail aria-hidden="true" /></div>
        <p className="section-index">{modeCopy?.accessKicker ?? copy.accessKicker}</p>
        <h1 id="auth-title">{modeCopy?.signInTitle ?? copy.signInTitle}</h1>
        <p className="auth-intro">{modeCopy?.signInIntro ?? copy.signInIntro}</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="signin-email">{modeCopy?.emailLabel ?? copy.emailLabel}</label>
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            placeholder={modeCopy?.emailPlaceholder ?? copy.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby="signin-message"
            required
          />
          <Turnstile key={challengeKey} onToken={handleTurnstile} />
          <button className="button button-primary" type="submit" disabled={busy || !turnstileToken}>
            {busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
            {busy ? copy.sending : copy.requestLink}
          </button>
        </form>
        <div
          id="signin-message"
          className={`auth-message ${sent ? "auth-message-success" : ""}`}
          role={message ? "status" : undefined}
        >
          {sent && <CheckCircle2 aria-hidden="true" />}
          <span>{message ?? copy.defaultHint}</span>
        </div>
        <p className="auth-trust">
          <ShieldCheck aria-hidden="true" />
          {modeCopy?.trust ?? copy.trust}
        </p>
      </section>
      <a className="auth-home-link" href={homeUrl}>
        <ArrowLeft aria-hidden="true" /> {copy.backToPresentation}
      </a>
    </main>
  );
}

export function AuthCallbackPage({
  onAuthenticated,
  showLanguageSwitcher = true,
}: {
  onAuthenticated?: (session: SessionData) => void;
  showLanguageSwitcher?: boolean;
}) {
  const { locale } = useI18n();
  const copy = authMessages[locale];
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const { adminUrl, appUrl, homeUrl } = localizedUrls(locale);
  const [token] = useState(() => {
    const fragmentToken = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token");
    return fragmentToken ?? new URLSearchParams(window.location.search).get("token");
  });
  const [state, setState] = useState<"verifying" | "success" | "error">("verifying");
  const [displayName, setDisplayName] = useState("");
  const [operatorDestination, setOperatorDestination] = useState(false);
  const [errorKind, setErrorKind] = useState<"incomplete" | "expired" | "failed" | null>(null);

  const message = state === "verifying"
    ? copy.callbackVerifyingMessage
    : state === "success"
      ? operatorDestination
        ? copy.callbackOperatorWelcome(displayName)
        : copy.callbackWelcome(displayName)
      : errorKind === "incomplete"
        ? copy.callbackIncomplete
        : errorKind === "expired"
          ? copy.callbackExpired
          : copy.callbackFailed;

  useEffect(() => {
    let active = true;
    let redirectTimer: number | undefined;
    window.history.replaceState({}, "", localizedUrls(localeRef.current).authCallbackUrl);
    if (!token) {
      setState("error");
      setErrorKind("incomplete");
      return () => undefined;
    }

    verifyMagicLinkOnce(token)
      .then((session) => {
        if (!active) return;
        onAuthenticated?.(session);
        window.history.replaceState({}, "", localizedUrls(session.locale).authCallbackUrl);
        window.dispatchEvent(new PopStateEvent("popstate"));
        setDisplayName(session.displayName);
        setOperatorDestination(session.godmode);
        setState("success");
        redirectTimer = window.setTimeout(
          () => window.location.replace(sessionLandingUrl(session)),
          700,
        );
      })
      .catch((error) => {
        if (!active) return;
        window.history.replaceState({}, "", localizedUrls(localeRef.current).authCallbackUrl);
        setState("error");
        setErrorKind(error instanceof ApiError && error.status === 400 ? "expired" : "failed");
      });

    return () => {
      active = false;
      if (redirectTimer !== undefined) window.clearTimeout(redirectTimer);
    };
  }, [onAuthenticated, token]);

  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true" />
      <a className="auth-brand" href={homeUrl} aria-label={copy.brandHomeLabel}>
        <Logo />
      </a>
      <div className="auth-preferences">
        {showLanguageSwitcher && state !== "success" && <LanguageSwitcher />}
        <ThemeToggle className="auth-theme-toggle" />
      </div>
      <section className="auth-panel auth-callback-panel" aria-labelledby="callback-title">
        <div className={`auth-icon auth-icon-${state}`}>
          {state === "verifying"
            ? <LoaderCircle className="spin" aria-hidden="true" />
            : state === "success"
              ? <CheckCircle2 aria-hidden="true" />
              : <Mail aria-hidden="true" />}
        </div>
        <p className="section-index">{copy.callbackKicker}</p>
        <h1 id="callback-title">
          {state === "verifying"
            ? copy.callbackVerifyingTitle
            : state === "success"
              ? copy.callbackSuccessTitle
              : copy.callbackErrorTitle}
        </h1>
        <p className="auth-intro" role="status">{message}</p>
        {state === "error" && (
          <div className="auth-callback-actions">
            <a className="button button-primary" href={appUrl}>
              {copy.applicationAccess} <ArrowRight aria-hidden="true" />
            </a>
            <a className="button button-secondary" href={adminUrl}>
              {copy.operatorAccess} <ArrowRight aria-hidden="true" />
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
