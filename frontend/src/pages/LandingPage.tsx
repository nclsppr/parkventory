import { FormEvent, PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CarFront,
  CheckCircle2,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { DashboardPreview } from "../components/DashboardPreview";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/Theme";
import { requestMagicLink } from "../api/client";
import {
  appUrl,
  demoLabel,
  findUrl,
  homeUrl,
  isOidcIdentity,
  isPublicDemo,
  legalUrl,
  oidcLoginUrl,
  privacyUrl,
  shareUrl,
} from "../config";
import { useLandingMotion } from "../hooks/useLandingMotion";

const personalDomains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"];

export function LandingPage() {
  const landingRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [registrationBusy, setRegistrationBusy] = useState(false);

  useLandingMotion(landingRef);

  const handlePreviewPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
    event.currentTarget.style.setProperty("--preview-pointer-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--preview-pointer-y", `${y * 100}%`);
    event.currentTarget.style.setProperty("--preview-rotate-x", `${(0.5 - y) * 3.5}deg`);
    event.currentTarget.style.setProperty("--preview-rotate-y", `${(x - 0.5) * 4.5}deg`);
  };

  const resetPreviewPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--preview-pointer-x", "50%");
    event.currentTarget.style.setProperty("--preview-pointer-y", "50%");
    event.currentTarget.style.setProperty("--preview-rotate-x", "0deg");
    event.currentTarget.style.setProperty("--preview-rotate-y", "0deg");
  };

  const handleRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const domain = email.trim().toLowerCase().split("@")[1];

    if (!domain || personalDomains.includes(domain)) {
      setRegistrationMessage("Utilisez une adresse professionnelle pour rejoindre votre espace.");
      return;
    }

    setRegistrationBusy(true);
    setRegistrationMessage(null);
    try {
      const response = await requestMagicLink(email.trim().toLowerCase());
      setRegistrationMessage(response.message);
    } catch (error) {
      setRegistrationMessage(
        error instanceof Error
          ? error.message
          : "Le lien de connexion n’a pas pu être envoyé.",
      );
    } finally {
      setRegistrationBusy(false);
    }
  };

  return (
    <div className="landing-page" ref={landingRef}>
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <header className="landing-header">
        <a className="landing-brand" href={homeUrl} aria-label="Parkventory, accueil">
          <Logo />
        </a>
        <nav className="landing-nav" aria-label="Navigation principale">
          <a href="#fonctionnement">Comment ça marche</a>
          <a href="#equipes">Pour les équipes</a>
          <a href="#securite">Sécurité</a>
        </nav>
        <div className="landing-actions">
          <ThemeToggle />
          <a className="text-link" href={appUrl}>Se connecter</a>
          <a className="button button-primary button-small" href="#commencer">
            Commencer <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
        <button
          className="mobile-menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        {menuOpen && (
          <nav id="mobile-navigation" className="mobile-navigation" aria-label="Navigation mobile">
            <a href="#fonctionnement" onClick={() => setMenuOpen(false)}>Comment ça marche</a>
            <a href="#equipes" onClick={() => setMenuOpen(false)}>Pour les équipes</a>
            <a href="#securite" onClick={() => setMenuOpen(false)}>Sécurité</a>
            <div className="mobile-theme-choice">
              <span>Apparence</span>
              <ThemeToggle />
            </div>
            <a href={appUrl}>Ouvrir l’application</a>
          </nav>
        )}
        <span className="landing-progress" aria-hidden="true">
          <span className="landing-progress-bar" />
        </span>
      </header>

      <main id="contenu">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-parking-texture" aria-hidden="true" />
          <div className="hero-copy" data-reveal>
            <p className="eyebrow">Le parking partagé, simplement.</p>
            <h1 id="hero-title">
              Partagez votre place.<br />
              <span>Gagnez du temps.</span>
            </h1>
            <p className="hero-summary">
              Quand vous êtes absent, rendez votre place disponible à vos collègues.
              Quand vous en avez besoin, réservez en quelques secondes.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href={shareUrl}>
                <CalendarCheck aria-hidden="true" /> Partager ma place
              </a>
              <a className="button button-secondary" href={findUrl}>
                <Search aria-hidden="true" /> Voir les disponibilités
              </a>
            </div>
            <p className="hero-note">
              <CheckCircle2 aria-hidden="true" /> Aucun administrateur requis pour démarrer
            </p>
          </div>
          <div
            className="hero-product"
            data-reveal="scale"
            onPointerMove={handlePreviewPointerMove}
            onPointerLeave={resetPreviewPointer}
          >
            <div className="hero-product-frame">
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section className="benefit-strip" aria-label="Bénéfices principaux">
          <article data-reveal>
            <CalendarCheck aria-hidden="true" />
            <div><h2>Simple à partager</h2><p>Indiquez votre absence, votre place fait le reste.</p></div>
          </article>
          <article data-reveal>
            <ShieldCheck aria-hidden="true" />
            <div><h2>Fiable à réserver</h2><p>Une disponibilité, une réservation, aucun doublon.</p></div>
          </article>
          <article data-reveal>
            <Users aria-hidden="true" />
            <div><h2>Pensé pour les équipes</h2><p>Moins de recherche, plus de fluidité au quotidien.</p></div>
          </article>
        </section>

        <div className="landing-signal" aria-hidden="true">
          <div className="landing-signal-track">
            {[0, 1].map((group) => (
              <div className="landing-signal-group" key={group}>
                <span>Partager</span><i />
                <span>Rendre disponible</span><i />
                <span>Réserver</span><i />
                <span>Recommencer</span><i />
              </div>
            ))}
          </div>
        </div>

        <section className="process-section" id="fonctionnement" aria-labelledby="process-title">
          <div className="section-heading process-heading" data-reveal>
            <div>
              <p className="section-index">01 / Comment ça marche</p>
              <h2 id="process-title">Une place libre.<br />Un collègue dépanné.</h2>
              <p>Parkventory transforme une absence en opportunité, sans ajouter de gestion au quotidien.</p>
            </div>
            <a className="special-link" href={appUrl}>
              Découvrir l’application <ArrowRight aria-hidden="true" />
            </a>
          </div>
          <ol className="process-steps" data-reveal>
            <li>
              <span className="step-number">01</span>
              <CalendarCheck aria-hidden="true" />
              <div><h3>Indiquez votre absence</h3><p>Choisissez une journée ou une plage horaire.</p></div>
            </li>
            <li>
              <span className="step-number">02</span>
              <CarFront aria-hidden="true" />
              <div><h3>La place devient disponible</h3><p>Elle apparaît uniquement aux collègues de votre espace.</p></div>
            </li>
            <li>
              <span className="step-number">03</span>
              <Users aria-hidden="true" />
              <div><h3>Un collègue la réserve</h3><p>Vous êtes informé, sans échange manuel à organiser.</p></div>
            </li>
          </ol>
          <div className="process-visual" data-reveal="scale" role="img" aria-label="Parking vu du ciel avec une place disponible en vert et une place sélectionnée en bleu">
            <div className="process-visual-callout">
              <Sparkles aria-hidden="true" />
              <span><strong>Libre</strong> devient visible à l’équipe</span>
            </div>
          </div>
        </section>

        <section className="teams-section" id="equipes" aria-labelledby="teams-title">
          <div className="teams-kicker" data-reveal><Users aria-hidden="true" /> Communauté d’abord</div>
          <div className="teams-copy" data-reveal>
            <h2 id="teams-title">Commencez entre collègues.<br />Structurez quand vous en avez besoin.</h2>
            <p>
              Une adresse professionnelle vérifiée suffit pour rejoindre votre espace.
              Les administrateurs restent optionnels et peuvent être nommés plus tard.
            </p>
          </div>
          <div className="teams-list">
            <article data-reveal><span>01</span><h3>Sans déploiement</h3><p>Pas de projet IT préalable pour tester l’usage.</p></article>
            <article data-reveal><span>02</span><h3>Sans surveillance</h3><p>Chacun gère uniquement ses partages et réservations.</p></article>
            <article data-reveal><span>03</span><h3>Évolutif</h3><p>Sites, places personnalisées et plan arrivent quand ils deviennent utiles.</p></article>
          </div>
        </section>

        <section className="security-section" id="securite" aria-labelledby="security-title">
          <div className="security-visual" data-reveal="scale" aria-hidden="true">
            <ShieldCheck />
            <span className="security-line security-line-one" />
            <span className="security-line security-line-two" />
            <span className="security-dot security-dot-one" />
            <span className="security-dot security-dot-two" />
          </div>
          <div className="security-copy" data-reveal>
            <p className="section-index">02 / Confiance</p>
            <h2 id="security-title">Votre entreprise reste votre frontière.</h2>
            <p>
              L’adresse professionnelle sert à rejoindre le bon espace. Les disponibilités,
              membres et réservations ne traversent jamais les organisations.
            </p>
            <ul>
              <li><CheckCircle2 aria-hidden="true" /> Vérification de l’adresse avant toute adhésion</li>
              <li><CheckCircle2 aria-hidden="true" /> Données minimales, aucun motif d’absence collecté</li>
              <li><CheckCircle2 aria-hidden="true" /> Administration optionnelle et auditée</li>
            </ul>
          </div>
        </section>

        <section className="start-section" id="commencer" aria-labelledby="start-title">
          <div data-reveal>
            <p className="section-index">Prêt à partager ?</p>
            <h2 id="start-title">Votre prochaine place libre peut déjà aider quelqu’un.</h2>
          </div>
          {isOidcIdentity ? (
            <div className="registration-form" data-reveal>
              <a className="button button-primary" href={oidcLoginUrl}>
                Continuer par e-mail <ArrowUpRight aria-hidden="true" />
              </a>
              <p>Votre adresse professionnelle sera vérifiée avant l’accès.</p>
            </div>
          ) : <form className="registration-form" data-reveal onSubmit={handleRegistration} noValidate>
            <label htmlFor="professional-email">Adresse e-mail professionnelle</label>
            <div className="registration-control">
              <input
                id="professional-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@entreprise.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-describedby="registration-help registration-message"
                required
              />
              <button className="button button-primary" type="submit" disabled={registrationBusy}>
                {registrationBusy ? "Envoi du lien…" : "Rejoindre Parkventory"}
                {!registrationBusy && <ArrowUpRight aria-hidden="true" />}
              </button>
            </div>
            <p id="registration-help">
              {isPublicDemo
                ? `${demoLabel} : aucun e-mail ne sera envoyé.`
                : "Local : ouvrez l’e-mail capturé dans Mailpit sur http://127.0.0.1:8025."}
            </p>
            {registrationMessage && <p id="registration-message" className="registration-message" role="status">{registrationMessage}</p>}
          </form>}
        </section>
      </main>

      <footer className="landing-footer">
        <Logo />
        <p>Le parking partagé, simplement.</p>
        <div>
          <a href={appUrl}>Application</a>
          <a href={privacyUrl}>Confidentialité</a>
          <a href={legalUrl}>Mentions légales</a>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
