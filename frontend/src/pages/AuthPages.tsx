import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { requestMagicLink, verifyMagicLink } from "../api/client";
import { appUrl, homeUrl } from "../config";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/Theme";
import { Turnstile } from "../components/Turnstile";
import type { SessionData } from "../types";

const personalDomains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"];
const verificationRequests = new Map<string, Promise<SessionData>>();

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

export function SignInPage({ reason }: { reason?: string }) {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [challengeKey, setChallengeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(reason ?? null);
  const [sent, setSent] = useState(false);
  const handleTurnstile = useCallback((token: string | null) => setTurnstileToken(token), []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    const domain = normalized.split("@")[1];
    if (!domain || personalDomains.includes(domain)) {
      setSent(false);
      setMessage("Utilisez une adresse e-mail professionnelle.");
      return;
    }
    if (!turnstileToken) {
      setSent(false);
      setMessage("Terminez la vérification anti-abus avant de continuer.");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const response = await requestMagicLink(normalized, turnstileToken);
      setSent(true);
      setMessage(response.message);
    } catch (error) {
      setSent(false);
      setMessage(error instanceof Error ? error.message : "L’envoi du lien a échoué.");
    } finally {
      setBusy(false);
      setChallengeKey((key) => key + 1);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true" />
      <a className="auth-brand" href={homeUrl} aria-label="Parkventory, accueil"><Logo /></a>
      <ThemeToggle className="auth-theme-toggle" />
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-icon"><Mail aria-hidden="true" /></div>
        <p className="section-index">Accès à l’espace parking</p>
        <h1 id="auth-title">Connectez-vous sans mot de passe.</h1>
        <p className="auth-intro">
          Saisissez votre adresse professionnelle. Le lien privé expire après 15 minutes et ne fonctionne qu’une fois.
        </p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="signin-email">Adresse e-mail professionnelle</label>
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            placeholder="vous@entreprise.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby="signin-message"
            required
          />
          <Turnstile key={challengeKey} onToken={handleTurnstile} />
          <button className="button button-primary" type="submit" disabled={busy || !turnstileToken}>
            {busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
            {busy ? "Envoi en cours…" : "Recevoir mon lien"}
          </button>
        </form>
        <div
          id="signin-message"
          className={`auth-message ${sent ? "auth-message-success" : ""}`}
          role={message ? "status" : undefined}
        >
          {sent && <CheckCircle2 aria-hidden="true" />}
          <span>{message ?? "Aucun compte n’est créé avant la validation du lien."}</span>
        </div>
        <p className="auth-trust">
          <ShieldCheck aria-hidden="true" />
          Parkventory ne demande jamais votre mot de passe d’entreprise.
        </p>
      </section>
      <a className="auth-home-link" href={homeUrl}>
        <ArrowLeft aria-hidden="true" /> Revenir à la présentation
      </a>
    </main>
  );
}

export function AuthCallbackPage() {
  const token = new URLSearchParams(window.location.search).get("token");
  const [state, setState] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Validation de votre lien sécurisé…");

  useEffect(() => {
    let active = true;
    let redirectTimer: number | undefined;
    if (!token) {
      setState("error");
      setMessage("Ce lien ne contient pas de jeton de connexion.");
      return () => undefined;
    }

    verifyMagicLinkOnce(token)
      .then((session) => {
        if (!active) return;
        window.history.replaceState({}, "", "/auth/callback");
        setState("success");
        setMessage(`Bienvenue ${session.displayName}. Votre espace est prêt.`);
        redirectTimer = window.setTimeout(() => window.location.replace(appUrl), 700);
      })
      .catch((error) => {
        if (!active) return;
        window.history.replaceState({}, "", "/auth/callback");
        setState("error");
        setMessage(error instanceof Error ? error.message : "Ce lien ne peut pas être validé.");
      });

    return () => {
      active = false;
      if (redirectTimer !== undefined) window.clearTimeout(redirectTimer);
    };
  }, [token]);

  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true" />
      <a className="auth-brand" href={homeUrl} aria-label="Parkventory, accueil"><Logo /></a>
      <ThemeToggle className="auth-theme-toggle" />
      <section className="auth-panel auth-callback-panel" aria-labelledby="callback-title">
        <div className={`auth-icon auth-icon-${state}`}>
          {state === "verifying"
            ? <LoaderCircle className="spin" aria-hidden="true" />
            : state === "success"
              ? <CheckCircle2 aria-hidden="true" />
              : <Mail aria-hidden="true" />}
        </div>
        <p className="section-index">Lien magique</p>
        <h1 id="callback-title">
          {state === "verifying" ? "Un instant." : state === "success" ? "Vous êtes connecté." : "Lien non valide."}
        </h1>
        <p className="auth-intro" role="status">{message}</p>
        {state === "error" && (
          <a className="button button-primary" href={appUrl}>
            Demander un nouveau lien <ArrowRight aria-hidden="true" />
          </a>
        )}
      </section>
    </main>
  );
}
