import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  Heart,
  LoaderCircle,
  Search,
  Send,
  Share2,
  UserPlus,
  Users,
} from "lucide-react";
import { ApiError, inviteColleague } from "../api/client";
import { AppLink } from "../components/AppLink";
import type { NoticeTone } from "../components/AppShell";
import { demoContext, findUrl, isPublicDemo, shareUrl } from "../config";
import type { AvailabilityItem, DashboardData } from "../types";

const personalDomains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"];

function statusLabel(status: AvailabilityItem["status"]) {
  if (status === "AVAILABLE") return "Disponible";
  if (status === "RESERVED") return "Réservée";
  return "Votre partage";
}

interface DashboardPageProps {
  data: DashboardData;
  onNotify: (message: string, tone?: NoticeTone) => void;
  onSessionExpired: () => void;
}

export function DashboardPage({ data, onNotify, onSessionExpired }: DashboardPageProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const availableItems = useMemo(
    () => data.availability.filter((item) => item.status === "AVAILABLE"),
    [data.availability],
  );

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
        const message = error instanceof Error ? error.message : "L’invitation n’a pas pu être envoyée.";
        setInviteMessage(message);
        onNotify(message, "error");
      }
    } finally {
      setInviteBusy(false);
    }
  };

  return (
    <div className="app-page dashboard-page">
      <header className="app-page-header">
        <div>
          <p className="dashboard-eyebrow">Tableau de bord</p>
          <h1 tabIndex={-1}>Bonjour, {data.user.firstName} <span aria-hidden="true">👋</span></h1>
          <p>Choisissez votre prochaine action, puis gardez un œil sur la semaine.</p>
        </div>
        <span className="live-data-label"><i /> {isPublicDemo ? "Vue démo · 7 jours" : "PostgreSQL · 7 jours"}</span>
      </header>

      <div className="community-banner">
        <span><Users aria-hidden="true" /></span>
        <p>Chez <strong>{data.organization.name}</strong>, <em>{data.organization.sharedTotal.toLocaleString("fr-FR")}</em> partages ont déjà été publiés.</p>
      </div>

      <section className="task-entry-grid" aria-labelledby="quick-actions-title">
        <h2 className="sr-only" id="quick-actions-title">Actions principales</h2>
        <AppLink className="task-entry task-entry-share" href={shareUrl}>
          <span className="task-entry-icon"><CalendarDays aria-hidden="true" /></span>
          <span className="task-entry-copy">
            <small>{data.user.assignedSpot ? `Votre place · ${data.user.assignedSpot}` : "Première étape"}</small>
            <strong>{data.user.assignedSpot ? "Partager ma place" : "Déclarer ma place"}</strong>
            <span>Indiquez quand elle est libre. Aucun motif d’absence n’est demandé.</span>
          </span>
          <span className="task-entry-cta">Préparer le partage <ArrowRight aria-hidden="true" /></span>
        </AppLink>

        <AppLink className="task-entry task-entry-find" href={findUrl}>
          <span className="task-entry-icon"><Search aria-hidden="true" /></span>
          <span className="task-entry-copy">
            <small>{availableItems.length} place{availableItems.length > 1 ? "s" : ""} disponible{availableItems.length > 1 ? "s" : ""}</small>
            <strong>Trouver une place</strong>
            <span>Consultez les créneaux réels publiés pour les 7 prochains jours.</span>
          </span>
          <span className="task-entry-cta">Voir les disponibilités <ArrowRight aria-hidden="true" /></span>
        </AppLink>
      </section>

      <section className="dashboard-overview" aria-labelledby="week-title">
        <div className="section-heading-compact">
          <div>
            <p className="section-kicker">Cette semaine</p>
            <h2 id="week-title">Ce qui mérite votre attention</h2>
          </div>
          <AppLink href={`${findUrl}#disponibilites`}>Tout voir <ArrowRight aria-hidden="true" /></AppLink>
        </div>

        <div className="dashboard-overview-layout">
          <ol className="availability-preview-list">
            {data.availability.length === 0 ? (
              <li className="availability-preview-empty">
                <CarFront aria-hidden="true" />
                <p>Aucun créneau publié pour le moment.<span>Votre équipe peut commencer par partager une place.</span></p>
              </li>
            ) : data.availability.slice(0, 4).map((item) => (
              <li key={item.id}>
                <span className={`status status-${item.status.toLowerCase()}`}><i />{statusLabel(item.status)}</span>
                <p><strong>{item.dateLabel}</strong><span>{item.timeLabel}</span></p>
                <p><strong>{item.spot}</strong><span>{item.level}</span></p>
              </li>
            ))}
          </ol>

          <dl className="stats-strip" aria-label="Activité de la semaine">
            <div><dt>Partages</dt><dd><Share2 aria-hidden="true" />{data.stats.shares}</dd></div>
            <div><dt>Réservations</dt><dd><CalendarDays aria-hidden="true" />{data.stats.reservations}</dd></div>
            <div><dt>Places disponibles</dt><dd><CarFront aria-hidden="true" />{data.stats.availableSpots}</dd></div>
          </dl>
        </div>
      </section>

      <section className="dashboard-community-grid" aria-label="Vie de l’équipe">
        <form className="invite-card-refined" id="invite-card" onSubmit={handleInvite} noValidate>
          <div className="section-heading-compact">
            <div>
              <p className="section-kicker"><UserPlus aria-hidden="true" /> Équipe</p>
              <h2>Inviter un collègue</h2>
            </div>
          </div>
          <p>Une adresse professionnelle suffit. L’entreprise peut fonctionner sans administrateur au quotidien.</p>
          <label htmlFor="invite-email">Adresse e-mail professionnelle</label>
          <div className="invite-control">
            <input
              id="invite-email"
              type="email"
              placeholder="collegue@entreprise.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              aria-describedby="invite-message"
              required
            />
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

        <div className="thanks-summary">
          <p className="section-kicker"><Heart aria-hidden="true" /> Merci reçus</p>
          {data.thanks.length > 0 ? (
            <blockquote>
              “{data.thanks[0].message}”
              <cite>— {data.thanks[0].author} · {data.thanks[0].when}</cite>
            </blockquote>
          ) : (
            <p className="thanks-summary-empty">Les messages apparaîtront ici après vos premiers partages.</p>
          )}
        </div>
      </section>
    </div>
  );
}
