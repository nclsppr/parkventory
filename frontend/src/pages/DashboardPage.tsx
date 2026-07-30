import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CarFront,
  Check,
  ChevronDown,
  ChevronRight,
  Heart,
  Home,
  LoaderCircle,
  LogOut,
  Menu,
  Search,
  Send,
  Settings,
  Share2,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  ApiError,
  declareSpot,
  inviteColleague,
  loadDashboard,
  logout,
  reserveSpot,
  shareSpot,
} from "../api/client";
import { Logo } from "../components/Logo";
import { Toast } from "../components/Toast";
import { demoContext, demoLabel, homeUrl, isPublicDemo } from "../config";
import { demoDashboard } from "../data/demo";
import type { AvailabilityItem, DashboardData } from "../types";

const personalDomains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"];

const navItems = [
  { label: "Accueil", icon: Home, target: "dashboard-top" },
  { label: "Partager ma place", icon: CalendarDays, target: "share-card" },
  { label: "Trouver une place", icon: Search, target: "find-card" },
  { label: "Mes réservations", icon: CarFront, target: "availability" },
  { label: "Mes partages", icon: Share2, target: "share-card" },
  { label: "Collègues", icon: Users, target: "invite-card" },
];

function scrollToTarget(target: string) {
  document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function dateInputValue(daysFromToday = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function EnvironmentStatus({ loading }: { loading: boolean }) {
  return (
    <span
      className="demo-status"
      title={isPublicDemo ? "Les données sont fictives." : "Les données viennent de PostgreSQL local."}
    >
      <i /> {loading ? "Actualisation…" : demoLabel}
    </span>
  );
}

function StatCard({
  accent,
  icon: Icon,
  value,
  label,
}: {
  accent?: "cyan";
  icon: typeof Share2;
  value: number;
  label: string;
}) {
  return (
    <article className={`stat-card ${accent === "cyan" ? "stat-card-cyan" : ""}`}>
      <Icon aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
      <small>cette semaine</small>
    </article>
  );
}

function AvailabilityVisual({ items }: { items: AvailabilityItem[] }) {
  const visibleItems = items.slice(0, 3);
  return (
    <div className="availability-visual">
      <div className="availability-visual-overlay">
        {visibleItems.map((item, index) => (
          <span
            className={[
              "visual-spot",
              item.status === "RESERVED" ? "visual-spot-cyan" : "visual-spot-green",
              index === 2 ? "visual-spot-third" : "",
              index === 1 && item.status !== "RESERVED" ? "visual-spot-second" : "",
            ].filter(Boolean).join(" ")}
            key={item.id}
          >
            {item.spot}
          </span>
        ))}
      </div>
      <div className="availability-visual-caption">
        <div>
          <strong>{items.filter((item) => item.status === "AVAILABLE").length}</strong>
          <span>prochaines disponibilités</span>
        </div>
        <div className="visual-arrows" aria-hidden="true"><ArrowLeft /><ArrowRight /></div>
      </div>
    </div>
  );
}

function statusLabel(status: AvailabilityItem["status"]) {
  if (status === "AVAILABLE") return "Disponible";
  if (status === "RESERVED") return "Réservée";
  return "Votre partage";
}

export function DashboardPage({
  onSessionExpired,
}: {
  onSessionExpired: () => void;
}) {
  const [data, setData] = useState<DashboardData | null>(
    isPublicDemo ? structuredClone(demoDashboard) : null,
  );
  const [loading, setLoading] = useState(!isPublicDemo);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [spotBusy, setSpotBusy] = useState(false);
  const [reserveBusy, setReserveBusy] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [shareForm, setShareForm] = useState({
    spot: isPublicDemo ? "A-24" : "",
    date: dateInputValue(1),
    from: "08:00",
    to: "18:00",
  });
  const [spotForm, setSpotForm] = useState({ label: "", level: "" });
  const [findForm, setFindForm] = useState({
    site: "Parking principal",
    date: dateInputValue(1),
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const firstIntentHandled = useRef(false);

  const reportError = (error: unknown, fallback: string) => {
    if (error instanceof ApiError && error.status === 401) {
      onSessionExpired();
      return;
    }
    setToast(error instanceof Error ? error.message : fallback);
  };

  const refreshDashboard = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setLoadError(null);
    try {
      const dashboard = await loadDashboard();
      setData(dashboard);
      if (dashboard.user.assignedSpot) {
        setShareForm((current) => ({ ...current, spot: dashboard.user.assignedSpot ?? "" }));
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
      setLoadError(error instanceof Error ? error.message : "Le tableau de bord n’a pas pu être chargé.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPublicDemo) void refreshDashboard();
    // La session est vérifiée par le parent avant le montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading || !data || firstIntentHandled.current) return;
    const intent = new URLSearchParams(window.location.search).get("intent");
    if (intent === "share") scrollToTarget("share-card");
    if (intent === "find") scrollToTarget("find-card");
    firstIntentHandled.current = true;
  }, [data, loading]);

  const availableCount = useMemo(
    () => data?.availability.filter((item) => item.status === "AVAILABLE").length ?? 0,
    [data?.availability],
  );

  const handleDeclareSpot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (spotBusy) return;
    setSpotBusy(true);
    try {
      const response = await declareSpot({
        label: spotForm.label,
        level: spotForm.level || undefined,
      });
      await refreshDashboard(false);
      setToast(response.message);
    } catch (error) {
      reportError(error, "La place n’a pas pu être déclarée.");
    } finally {
      setSpotBusy(false);
    }
  };

  const handleShare = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (shareBusy) return;
    if (shareForm.from >= shareForm.to) {
      setToast("L’heure de fin doit être postérieure à l’heure de début.");
      return;
    }
    setShareBusy(true);
    try {
      const response = await shareSpot(shareForm);
      await refreshDashboard(false);
      setToast(response.message);
    } catch (error) {
      reportError(error, "La disponibilité n’a pas pu être publiée.");
    } finally {
      setShareBusy(false);
    }
  };

  const handleFind = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    scrollToTarget("availability");
    setToast(
      availableCount === 0
        ? "Aucune place n’est disponible dans les 7 prochains jours."
        : `${availableCount} place${availableCount > 1 ? "s" : ""} disponible${availableCount > 1 ? "s" : ""} dans les 7 prochains jours.`,
    );
  };

  const handleReserve = async (item: AvailabilityItem) => {
    if (item.status !== "AVAILABLE" || reserveBusy) return;
    setReserveBusy(item.id);
    try {
      const response = await reserveSpot(item.id);
      await refreshDashboard(false);
      setToast(response.message);
    } catch (error) {
      reportError(error, "La place n’a pas pu être réservée.");
      await refreshDashboard(false);
    } finally {
      setReserveBusy(null);
    }
  };

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inviteBusy) return;
    const normalized = inviteEmail.trim().toLowerCase();
    const domain = normalized.split("@")[1];
    if (!domain || personalDomains.includes(domain)) {
      setInviteMessage("Saisissez une adresse professionnelle valide.");
      return;
    }
    setInviteBusy(true);
    setInviteMessage(null);
    try {
      const response = await inviteColleague({ email: normalized });
      setInviteMessage(response.message);
      if (response.accepted) setInviteEmail("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
      } else {
        setInviteMessage(error instanceof Error ? error.message : "L’invitation n’a pas pu être envoyée.");
      }
    } finally {
      setInviteBusy(false);
    }
  };

  const handleLogout = async () => {
    if (logoutBusy || isPublicDemo) return;
    setLogoutBusy(true);
    try {
      await logout();
      onSessionExpired();
    } catch (error) {
      reportError(error, "La déconnexion a échoué.");
    } finally {
      setLogoutBusy(false);
    }
  };

  const navigate = (target: string) => {
    setSidebarOpen(false);
    scrollToTarget(target);
  };

  if (!data) {
    return (
      <main className="dashboard-state">
        <Logo />
        {loadError ? <AlertTriangle aria-hidden="true" /> : <LoaderCircle className="spin" aria-hidden="true" />}
        <h1>{loadError ? "Le parking local ne répond pas." : "Chargement de votre espace…"}</h1>
        <p role="status">{loadError ?? "Lecture de votre session et des données PostgreSQL."}</p>
        {loadError && (
          <button className="button button-primary" type="button" onClick={() => void refreshDashboard()}>
            Réessayer
          </button>
        )}
      </main>
    );
  }

  return (
    <div className="app-shell" id="dashboard-top">
      <a className="skip-link" href="#dashboard-content">Aller au contenu</a>
      <aside className={`app-sidebar ${sidebarOpen ? "app-sidebar-open" : ""}`} aria-label="Navigation de l’application">
        <div className="sidebar-heading">
          <a href={homeUrl} aria-label="Revenir au site Parkventory"><Logo /></a>
          <button type="button" className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Fermer la navigation"><X /></button>
        </div>
        <nav>
          {navItems.map(({ label, icon: Icon, target }, index) => (
            <button
              type="button"
              className={index === 0 ? "active" : ""}
              key={label}
              onClick={() => navigate(target)}
            >
              <Icon aria-hidden="true" /> <span>{label}</span>
            </button>
          ))}
        </nav>
        <button className="sidebar-settings" type="button" onClick={() => setToast("Les paramètres seront ajoutés avec l’administration optionnelle.")}>
          <Settings aria-hidden="true" /> Paramètres
        </button>
        {!isPublicDemo && (
          <button className="sidebar-logout" type="button" onClick={handleLogout} disabled={logoutBusy}>
            <LogOut aria-hidden="true" /> {logoutBusy ? "Déconnexion…" : "Se déconnecter"}
          </button>
        )}
        <div className="sidebar-profile">
          <span className="avatar">{data.user.initials}</span>
          <div><strong>{data.user.fullName}</strong><small>{data.organization.name}</small></div>
          <ChevronDown aria-hidden="true" />
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-backdrop" type="button" aria-label="Fermer la navigation" onClick={() => setSidebarOpen(false)} />}

      <main className="app-main" id="dashboard-content">
        <div className="app-topbar">
          <button className="mobile-sidebar-trigger" type="button" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir la navigation"><Menu /></button>
          <a className="mobile-app-logo" href={homeUrl}><Logo compact /></a>
          <EnvironmentStatus loading={loading} />
        </div>

        {loadError && (
          <div className="dashboard-error" role="alert">
            <AlertTriangle aria-hidden="true" />
            <span>{loadError}</span>
            <button type="button" onClick={() => void refreshDashboard()}>Réessayer</button>
          </div>
        )}

        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Tableau de bord</p>
            <h1>Bonjour, {data.user.firstName} <span aria-hidden="true">👋</span></h1>
            <p>Voici votre aperçu parking des 7 prochains jours.</p>
          </div>
          {isPublicDemo ? (
            <div className="dashboard-period" role="group" aria-label="Période affichée">
              <button type="button" className={view === "day" ? "active" : ""} onClick={() => setView("day")}>Jour</button>
              <button type="button" className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Semaine</button>
              <button type="button" className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Mois</button>
            </div>
          ) : (
            <span className="live-data-label"><i /> PostgreSQL · 7 jours</span>
          )}
        </header>

        <div className="community-banner">
          <span><Users aria-hidden="true" /></span>
          <p>Chez <strong>{data.organization.name}</strong>, <em>{data.organization.sharedTotal.toLocaleString("fr-FR")}</em> partages ont déjà été publiés.</p>
          <ChevronRight aria-hidden="true" />
        </div>

        <section className="dashboard-actions-grid" aria-label="Actions principales">
          {data.user.assignedSpot ? (
            <form className="dashboard-card share-card" id="share-card" aria-label="Formulaire de partage" onSubmit={handleShare}>
              <div className="card-title"><span><CalendarDays /></span><div><h2>Partager ma place</h2><p>Rendez votre place disponible pendant votre absence.</p></div></div>
              <div className="form-grid form-grid-share">
                <label>Place<input value={shareForm.spot} readOnly /></label>
                <label>Date<input type="date" min={dateInputValue()} value={shareForm.date} onChange={(event) => setShareForm({ ...shareForm, date: event.target.value })} required /></label>
                <label>De<input type="time" value={shareForm.from} onChange={(event) => setShareForm({ ...shareForm, from: event.target.value })} required /></label>
                <label>À<input type="time" value={shareForm.to} onChange={(event) => setShareForm({ ...shareForm, to: event.target.value })} required /></label>
              </div>
              <button className="button button-primary card-submit" type="submit" disabled={shareBusy}>
                {shareBusy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Share2 aria-hidden="true" />}
                {shareBusy ? "Publication…" : "Partager ma place"}
              </button>
            </form>
          ) : (
            <form className="dashboard-card share-card spot-onboarding-card" id="share-card" aria-label="Déclarer ma place" onSubmit={handleDeclareSpot}>
              <div className="card-title"><span><CarFront /></span><div><h2>Déclarer ma place</h2><p>Cette étape suffit avant votre premier partage.</p></div></div>
              <div className="form-grid">
                <label>Libellé de la place<input placeholder="A-24" maxLength={32} value={spotForm.label} onChange={(event) => setSpotForm({ ...spotForm, label: event.target.value })} required /></label>
                <label>Niveau ou zone <span className="optional-label">optionnel</span><input placeholder="Niveau A" maxLength={64} value={spotForm.level} onChange={(event) => setSpotForm({ ...spotForm, level: event.target.value })} /></label>
              </div>
              <button className="button button-primary card-submit" type="submit" disabled={spotBusy}>
                {spotBusy ? <LoaderCircle className="spin" aria-hidden="true" /> : <CarFront aria-hidden="true" />}
                {spotBusy ? "Enregistrement…" : "Affecter cette place"}
              </button>
            </form>
          )}

          <form className="dashboard-card find-card" id="find-card" onSubmit={handleFind}>
            <div className="card-title card-title-cyan"><span><Search /></span><div><h2>Trouver une place</h2><p>Consultez les disponibilités de votre espace.</p></div></div>
            <div className="form-grid">
              <label>Site<select value={findForm.site} onChange={(event) => setFindForm({ ...findForm, site: event.target.value })}><option>Parking principal</option></select></label>
              <label>Date<input type="date" min={dateInputValue()} value={findForm.date} onChange={(event) => setFindForm({ ...findForm, date: event.target.value })} /></label>
            </div>
            <button className="button button-cyan-outline card-submit" type="submit"><Search aria-hidden="true" /> Voir les disponibilités</button>
          </form>

          <div className="stats-grid">
            <StatCard icon={Share2} value={data.stats.shares} label="partages" />
            <StatCard icon={CalendarDays} value={data.stats.reservations} label="réservations" accent="cyan" />
            <StatCard icon={CarFront} value={data.stats.availableSpots} label="places disponibles" />
          </div>
        </section>

        <section className="dashboard-card availability-card" id="availability" aria-labelledby="availability-title">
          <div className="availability-heading">
            <div className="card-title"><span><CalendarDays /></span><div><h2 id="availability-title">Disponibilités à venir</h2><p>Places partagées au cours des 7 prochains jours.</p></div></div>
            <span className="availability-count"><i /> {availableCount} disponible{availableCount > 1 ? "s" : ""}</span>
          </div>
          <div className="availability-layout">
            <AvailabilityVisual items={data.availability} />
            <div className="availability-table-wrap">
              <table className="availability-table">
                <thead><tr><th>Quand</th><th>Place</th><th>Niveau</th><th>Statut</th><th><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {data.availability.length === 0 ? (
                    <tr className="availability-empty-row">
                      <td colSpan={5}>Aucune place partagée pour le moment. Invitez un collègue ou publiez votre première disponibilité.</td>
                    </tr>
                  ) : data.availability.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.dateLabel}</strong><span>{item.timeLabel}</span></td>
                      <td>{item.spot}</td>
                      <td>{item.level}</td>
                      <td><span className={`status status-${item.status.toLowerCase()}`}><i />{statusLabel(item.status)}</span></td>
                      <td>
                        <button type="button" disabled={item.status !== "AVAILABLE" || reserveBusy !== null} onClick={() => void handleReserve(item)}>
                          {item.status === "AVAILABLE"
                            ? reserveBusy === item.id
                              ? <LoaderCircle className="spin" aria-label="Réservation en cours" />
                              : "Réserver"
                            : item.status === "RESERVED"
                              ? <Check aria-label="Réservée" />
                              : <Share2 aria-label="Votre partage" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="table-link" type="button" onClick={() => setToast("La vue calendrier détaillée n’est pas encore livrée.")}>Voir le calendrier complet <ArrowRight /></button>
            </div>
          </div>
        </section>

        <section className="dashboard-bottom-grid">
          <article className="dashboard-card thanks-card">
            <div className="card-title"><span><Heart /></span><div><h2>Merci reçus</h2><p>Les messages viendront après le flux cœur.</p></div></div>
            {data.thanks.length === 0 ? (
              <div className="thanks-empty">
                <Heart aria-hidden="true" />
                <p>Aucun message pour le moment.<span>Les partages et réservations fonctionnent déjà sans gamification.</span></p>
              </div>
            ) : (
              <div className="thanks-list">
                {data.thanks.map((thanks) => (
                  <div className="thanks-item" key={thanks.id}>
                    <span className="avatar avatar-small">{thanks.initials}</span>
                    <p>{thanks.message}<small>— {thanks.author} · {thanks.when}</small></p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <form className="dashboard-card invite-card" id="invite-card" onSubmit={handleInvite} noValidate>
            <div className="card-title"><span><UserPlus /></span><div><h2>Inviter un collègue</h2><p>Plus on partage, plus le parking est simple.</p></div></div>
            <label htmlFor="invite-email">Adresse e-mail professionnelle</label>
            <div className="invite-control">
              <input id="invite-email" type="email" placeholder="collegue@entreprise.com" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} aria-describedby="invite-message" required />
              <button className="button button-primary" type="submit" disabled={inviteBusy}>
                {inviteBusy ? "Envoi…" : "Envoyer"}
                {inviteBusy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              </button>
            </div>
            <p id="invite-message" className="invite-message" role={inviteMessage ? "status" : undefined}>
              {inviteMessage ?? (isPublicDemo
                ? `Aucun e-mail réel n’est envoyé depuis la ${demoContext}.`
                : "L’invitation sera capturée dans Mailpit.")}
            </p>
          </form>
        </section>

        <section className="sharing-note" aria-label="Message communautaire">
          <Sparkles aria-hidden="true" />
          <p><strong>Partager change le quotidien.</strong><span>Merci de faire partie du mouvement.</span></p>
          <button type="button" onClick={() => scrollToTarget("share-card")}>Partager à nouveau <ArrowRight /></button>
        </section>
      </main>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
