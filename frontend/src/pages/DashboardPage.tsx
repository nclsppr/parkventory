import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CarFront,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Heart,
  Home,
  LayoutGrid,
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
import { inviteColleague, loadDashboard, reserveSpot, shareSpot } from "../api/client";
import { Logo } from "../components/Logo";
import { Toast } from "../components/Toast";
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

function DemoStatus({ loading }: { loading: boolean }) {
  return (
    <span className="demo-status" title="Les données affichées servent uniquement à la démonstration locale">
      <i /> {loading ? "Connexion…" : "Démo locale"}
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
  return (
    <div className="availability-visual">
      <div className="availability-visual-overlay">
        <span className="visual-spot visual-spot-green">A-24</span>
        <span className="visual-spot visual-spot-cyan">B-18</span>
        <span className="visual-spot visual-spot-green visual-spot-third">C-07</span>
      </div>
      <div className="availability-visual-caption">
        <div><strong>{items.filter((item) => item.status === "AVAILABLE").length}</strong><span>prochaines disponibilités</span></div>
        <div className="visual-arrows" aria-hidden="true"><ArrowLeft /><ArrowRight /></div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData>(() => structuredClone(demoDashboard));
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [reserveBusy, setReserveBusy] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [shareForm, setShareForm] = useState({
    spot: "A-24",
    date: "2026-07-31",
    from: "08:00",
    to: "18:00",
  });
  const [findForm, setFindForm] = useState({ site: "Siège Victor Buck", date: "2026-07-31" });
  const [inviteEmail, setInviteEmail] = useState("");
  const firstIntentHandled = useRef(false);

  useEffect(() => {
    let active = true;
    loadDashboard().then((dashboard) => {
      if (active) {
        setData(dashboard);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (firstIntentHandled.current) return;
    const intent = new URLSearchParams(window.location.search).get("intent");
    if (intent === "share") scrollToTarget("share-card");
    if (intent === "find") scrollToTarget("find-card");
    firstIntentHandled.current = true;
  }, []);

  const availableCount = useMemo(
    () => data.availability.filter((item) => item.status === "AVAILABLE").length,
    [data.availability],
  );

  const handleShare = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (shareForm.from >= shareForm.to) {
      setToast("L’heure de fin doit être postérieure à l’heure de début.");
      return;
    }
    setShareBusy(true);
    const response = await shareSpot(shareForm);
    setShareBusy(false);
    if (response.accepted) {
      setData((current) => ({
        ...current,
        stats: { ...current.stats, shares: current.stats.shares + 1, availableSpots: current.stats.availableSpots + 1 },
      }));
      setToast(response.message);
    }
  };

  const handleFind = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    scrollToTarget("availability");
    setToast(`${availableCount} places sont visibles pour cette recherche.`);
  };

  const handleReserve = async (item: AvailabilityItem) => {
    if (item.status !== "AVAILABLE") return;
    setReserveBusy(item.id);
    const response = await reserveSpot(item.id);
    setReserveBusy(null);
    if (response.accepted) {
      setData((current) => ({
        ...current,
        stats: {
          ...current.stats,
          reservations: current.stats.reservations + 1,
          availableSpots: Math.max(0, current.stats.availableSpots - 1),
        },
        availability: current.availability.map((availability) =>
          availability.id === item.id ? { ...availability, status: "RESERVED" } : availability,
        ),
      }));
      setToast(`${item.spot} est réservée. Retrouvez-la dans Mes réservations.`);
    }
  };

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = inviteEmail.trim().toLowerCase();
    const domain = normalized.split("@")[1];
    if (!domain || personalDomains.includes(domain)) {
      setInviteMessage("Saisissez une adresse professionnelle valide.");
      return;
    }
    setInviteBusy(true);
    const response = await inviteColleague({ email: normalized });
    setInviteBusy(false);
    setInviteMessage(response.message);
    if (response.accepted) setInviteEmail("");
  };

  const navigate = (target: string) => {
    setSidebarOpen(false);
    scrollToTarget(target);
  };

  return (
    <div className="app-shell" id="dashboard-top">
      <a className="skip-link" href="#dashboard-content">Aller au contenu</a>
      <aside className={`app-sidebar ${sidebarOpen ? "app-sidebar-open" : ""}`} aria-label="Navigation de l’application">
        <div className="sidebar-heading">
          <a href="/" aria-label="Revenir au site Parkventory"><Logo /></a>
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
        <button className="sidebar-settings" type="button" onClick={() => setToast("Les paramètres arrivent dans la prochaine tranche produit.")}>
          <Settings aria-hidden="true" /> Paramètres
        </button>
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
          <a className="mobile-app-logo" href="/"><Logo compact /></a>
          <DemoStatus loading={loading} />
        </div>

        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Tableau de bord</p>
            <h1>Bonjour, {data.user.firstName} <span aria-hidden="true">👋</span></h1>
            <p>Voici votre aperçu parking de la semaine.</p>
          </div>
          <div className="dashboard-period" role="group" aria-label="Période affichée">
            <button type="button" className={view === "day" ? "active" : ""} onClick={() => setView("day")}>Jour</button>
            <button type="button" className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Semaine</button>
            <button type="button" className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Mois</button>
          </div>
        </header>

        <button className="community-banner" type="button" onClick={() => setToast("Chaque partage confirmé alimente ce compteur communautaire.")}>
          <span><Users aria-hidden="true" /></span>
          <p>Chez <strong>{data.organization.name}</strong>, <em>{data.organization.sharedTotal.toLocaleString("fr-FR")}</em> partages ont déjà aidé un collègue.</p>
          <ChevronRight aria-hidden="true" />
        </button>

        <section className="dashboard-actions-grid" aria-label="Actions principales">
          <form className="dashboard-card share-card" id="share-card" aria-label="Formulaire de partage" onSubmit={handleShare}>
            <div className="card-title"><span><CalendarDays /></span><div><h2>Partager ma place</h2><p>Rendez votre place disponible pendant votre absence.</p></div></div>
            <div className="form-grid form-grid-share">
              <label>Place<select value={shareForm.spot} onChange={(event) => setShareForm({ ...shareForm, spot: event.target.value })}><option>A-24</option><option>A-25</option></select></label>
              <label>Date<input type="date" value={shareForm.date} onChange={(event) => setShareForm({ ...shareForm, date: event.target.value })} /></label>
              <label>De<input type="time" value={shareForm.from} onChange={(event) => setShareForm({ ...shareForm, from: event.target.value })} /></label>
              <label>À<input type="time" value={shareForm.to} onChange={(event) => setShareForm({ ...shareForm, to: event.target.value })} /></label>
            </div>
            <button className="button button-primary card-submit" type="submit" disabled={shareBusy}>
              <Share2 aria-hidden="true" /> {shareBusy ? "Partage…" : "Partager ma place"}
            </button>
          </form>

          <form className="dashboard-card find-card" id="find-card" onSubmit={handleFind}>
            <div className="card-title card-title-cyan"><span><Search /></span><div><h2>Trouver une place</h2><p>Consultez les disponibilités près de vous.</p></div></div>
            <div className="form-grid">
              <label>Site<select value={findForm.site} onChange={(event) => setFindForm({ ...findForm, site: event.target.value })}><option>Siège Victor Buck</option><option>Annexe Kirchberg</option></select></label>
              <label>Date<input type="date" value={findForm.date} onChange={(event) => setFindForm({ ...findForm, date: event.target.value })} /></label>
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
            <div className="card-title"><span><CalendarDays /></span><div><h2 id="availability-title">Disponibilités à venir</h2><p>Places partagées disponibles au cours des 7 prochains jours.</p></div></div>
            <span className="availability-count"><i /> {availableCount} disponibles</span>
          </div>
          <div className="availability-layout">
            <AvailabilityVisual items={data.availability} />
            <div className="availability-table-wrap">
              <table className="availability-table">
                <thead><tr><th>Quand</th><th>Place</th><th>Niveau</th><th>Statut</th><th><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {data.availability.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.dateLabel}</strong><span>{item.timeLabel}</span></td>
                      <td>{item.spot}</td>
                      <td>{item.level}</td>
                      <td><span className={`status status-${item.status.toLowerCase()}`}><i />{item.status === "AVAILABLE" ? "Disponible" : "Réservée"}</span></td>
                      <td><button type="button" disabled={item.status !== "AVAILABLE" || reserveBusy === item.id} onClick={() => handleReserve(item)}>{item.status === "AVAILABLE" ? (reserveBusy === item.id ? "…" : "Réserver") : <Check aria-label="Réservée" />}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="table-link" type="button" onClick={() => setToast("Le calendrier complet sera relié à la future vue Réservations.")}>Voir le calendrier complet <ArrowRight /></button>
            </div>
          </div>
        </section>

        <section className="dashboard-bottom-grid">
          <article className="dashboard-card thanks-card">
            <div className="card-title"><span><Heart /></span><div><h2>Merci reçus</h2><p>Vos collègues apprécient vos partages.</p></div></div>
            <div className="thanks-list">
              {data.thanks.map((thanks) => (
                <div className="thanks-item" key={thanks.id}>
                  <span className="avatar avatar-small">{thanks.initials}</span>
                  <p>{thanks.message}<small>— {thanks.author} · {thanks.when}</small></p>
                </div>
              ))}
            </div>
          </article>

          <form className="dashboard-card invite-card" id="invite-card" onSubmit={handleInvite} noValidate>
            <div className="card-title"><span><UserPlus /></span><div><h2>Inviter un collègue</h2><p>Plus on partage, plus le parking est simple.</p></div></div>
            <label htmlFor="invite-email">Adresse e-mail professionnelle</label>
            <div className="invite-control">
              <input id="invite-email" type="email" placeholder="collegue@entreprise.com" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} aria-describedby="invite-message" required />
              <button className="button button-primary" type="submit" disabled={inviteBusy}>{inviteBusy ? "Envoi…" : "Envoyer"}<Send aria-hidden="true" /></button>
            </div>
            <p id="invite-message" className="invite-message" role={inviteMessage ? "status" : undefined}>{inviteMessage ?? "Aucun e-mail réel n’est envoyé depuis la démo locale."}</p>
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
