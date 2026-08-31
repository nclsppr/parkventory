import { PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
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
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/Theme";
import { localizedUrls } from "../config";
import { useLandingMotion } from "../hooks/useLandingMotion";
import { commonMessages } from "../i18n/common";
import { useI18n } from "../i18n/I18n";
import { landingMessages } from "../i18n/landing";

export function LandingPage({
  showLanguageSwitcher = true,
}: {
  showLanguageSwitcher?: boolean;
}) {
  const landingRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale } = useI18n();
  const commonCopy = commonMessages[locale];
  const copy = landingMessages[locale];
  const { appUrl, findUrl, homeUrl, legalUrl, privacyUrl, shareUrl } = localizedUrls(locale);

  useLandingMotion(landingRef);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const closeMenuAtSection = (id: string) => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => {
      const section = document.getElementById(id);
      const labelledBy = section?.getAttribute("aria-labelledby");
      const focusTarget = (labelledBy ? document.getElementById(labelledBy) : null) ?? section;
      if (!focusTarget) return;
      if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
      focusTarget.focus({ preventScroll: true });
    });
  };

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

  return (
    <div className="landing-page" ref={landingRef}>
      <a className="skip-link" href="#contenu">{commonCopy.skipToContent}</a>
      <header className="landing-header">
        <a className="landing-brand" href={homeUrl} aria-label={copy.header.brandLabel}>
          <Logo />
        </a>
        <nav className="landing-nav" aria-label={copy.header.mainNavigationLabel}>
          <a href="#fonctionnement">{copy.header.howItWorks}</a>
          <a href="#equipes">{copy.header.teams}</a>
          <a href="#securite">{copy.header.security}</a>
        </nav>
        <div className="landing-actions">
          {showLanguageSwitcher && <LanguageSwitcher />}
          <ThemeToggle />
          <a className="text-link" href={appUrl}>{copy.header.signIn}</a>
          <a className="button button-primary button-small" href="#commencer">
            {copy.header.getStarted} <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
        <button
          ref={menuButtonRef}
          className="mobile-menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? copy.header.closeMenu : copy.header.openMenu}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        {menuOpen && (
          <nav id="mobile-navigation" className="mobile-navigation" aria-label={copy.header.mobileNavigationLabel}>
            <a href="#fonctionnement" onClick={() => closeMenuAtSection("fonctionnement")}>{copy.header.howItWorks}</a>
            <a href="#equipes" onClick={() => closeMenuAtSection("equipes")}>{copy.header.teams}</a>
            <a href="#securite" onClick={() => closeMenuAtSection("securite")}>{copy.header.security}</a>
            {showLanguageSwitcher && (
              <div className="mobile-theme-choice">
                <span>{commonCopy.language}</span>
                <LanguageSwitcher />
              </div>
            )}
            <div className="mobile-theme-choice">
              <span>{commonCopy.appearance}</span>
              <ThemeToggle />
            </div>
            <a href={appUrl}>{copy.header.openApp}</a>
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
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1 id="hero-title">
              {copy.hero.title}<br />
              <span>{copy.hero.titleAccent}</span>
            </h1>
            <p className="hero-summary">{copy.hero.summary}</p>
            <div className="hero-actions">
              <a className="button button-primary" href={shareUrl}>
                <CalendarCheck aria-hidden="true" /> {copy.hero.shareSpace}
              </a>
              <a className="button button-secondary" href={findUrl}>
                <Search aria-hidden="true" /> {copy.hero.viewAvailability}
              </a>
            </div>
            <p className="hero-note">
              <CheckCircle2 aria-hidden="true" /> {copy.hero.note}
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

        <section className="benefit-strip" aria-label={copy.benefits.label}>
          <article data-reveal>
            <CalendarCheck aria-hidden="true" />
            <div><h2>{copy.benefits.items[0].title}</h2><p>{copy.benefits.items[0].body}</p></div>
          </article>
          <article data-reveal>
            <ShieldCheck aria-hidden="true" />
            <div><h2>{copy.benefits.items[1].title}</h2><p>{copy.benefits.items[1].body}</p></div>
          </article>
          <article data-reveal>
            <Users aria-hidden="true" />
            <div><h2>{copy.benefits.items[2].title}</h2><p>{copy.benefits.items[2].body}</p></div>
          </article>
        </section>

        <div className="landing-signal" aria-hidden="true">
          <div className="landing-signal-track">
            {[0, 1].map((group) => (
              <div className="landing-signal-group" key={group}>
                <span>{copy.signal[0]}</span><i />
                <span>{copy.signal[1]}</span><i />
                <span>{copy.signal[2]}</span><i />
                <span>{copy.signal[3]}</span><i />
              </div>
            ))}
          </div>
        </div>

        <section className="process-section" id="fonctionnement" aria-labelledby="process-title">
          <div className="section-heading process-heading" data-reveal>
            <div>
              <p className="section-index">{copy.process.index}</p>
              <h2 id="process-title">{copy.process.title}<br />{copy.process.titleSecondLine}</h2>
              <p>{copy.process.introduction}</p>
            </div>
            <a className="special-link" href={appUrl}>
              {copy.process.discoverApp} <ArrowRight aria-hidden="true" />
            </a>
          </div>
          <ol className="process-steps" data-reveal>
            <li>
              <span className="step-number">01</span>
              <CalendarCheck aria-hidden="true" />
              <div><h3>{copy.process.steps[0].title}</h3><p>{copy.process.steps[0].body}</p></div>
            </li>
            <li>
              <span className="step-number">02</span>
              <CarFront aria-hidden="true" />
              <div><h3>{copy.process.steps[1].title}</h3><p>{copy.process.steps[1].body}</p></div>
            </li>
            <li>
              <span className="step-number">03</span>
              <Users aria-hidden="true" />
              <div><h3>{copy.process.steps[2].title}</h3><p>{copy.process.steps[2].body}</p></div>
            </li>
          </ol>
          <div className="process-visual" data-reveal="scale" role="img" aria-label={copy.process.visualLabel}>
            <div className="process-visual-callout">
              <Sparkles aria-hidden="true" />
              <span><strong>{copy.process.visualCalloutStrong}</strong> {copy.process.visualCalloutRest}</span>
            </div>
          </div>
        </section>

        <section className="teams-section" id="equipes" aria-labelledby="teams-title">
          <div className="teams-kicker" data-reveal><Users aria-hidden="true" /> {copy.teams.kicker}</div>
          <div className="teams-copy" data-reveal>
            <h2 id="teams-title">{copy.teams.title}<br />{copy.teams.titleSecondLine}</h2>
            <p>{copy.teams.introduction}</p>
          </div>
          <div className="teams-list">
            <article data-reveal><span>01</span><h3>{copy.teams.items[0].title}</h3><p>{copy.teams.items[0].body}</p></article>
            <article data-reveal><span>02</span><h3>{copy.teams.items[1].title}</h3><p>{copy.teams.items[1].body}</p></article>
            <article data-reveal><span>03</span><h3>{copy.teams.items[2].title}</h3><p>{copy.teams.items[2].body}</p></article>
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
            <p className="section-index">{copy.security.index}</p>
            <h2 id="security-title">{copy.security.title}</h2>
            <p>{copy.security.introduction}</p>
            <ul>
              <li><CheckCircle2 aria-hidden="true" /> {copy.security.points[0]}</li>
              <li><CheckCircle2 aria-hidden="true" /> {copy.security.points[1]}</li>
              <li><CheckCircle2 aria-hidden="true" /> {copy.security.points[2]}</li>
            </ul>
          </div>
        </section>

        <section className="start-section" id="commencer" aria-labelledby="start-title">
          <div data-reveal>
            <p className="section-index">{copy.start.kicker}</p>
            <h2 id="start-title">{copy.start.title}</h2>
          </div>
          <div className="registration-form" data-reveal>
            <a className="button button-primary" href={appUrl}>
              {copy.start.continueByEmail} <ArrowUpRight aria-hidden="true" />
            </a>
            <p>{copy.start.note}</p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <Logo />
        <p>{copy.footer.tagline}</p>
        <div>
          <a href={appUrl}>{copy.footer.app}</a>
          <a href={privacyUrl}>{copy.footer.privacy}</a>
          <a href={legalUrl}>{copy.footer.legal}</a>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
