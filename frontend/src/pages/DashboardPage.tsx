import { useMemo } from "react";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  Search,
  Share2,
  Users,
} from "lucide-react";
import { AppLink } from "../components/AppLink";
import { findUrl, shareUrl } from "../config";
import type { AvailabilityItem, DashboardData } from "../types";

function statusLabel(item: AvailabilityItem) {
  if (item.viewerRelation === "RESERVED") return "Votre réservation";
  if (item.viewerRelation === "OFFERED") return "Votre partage";
  return item.status === "AVAILABLE" ? "Disponible" : "Réservée";
}

export function DashboardPage({ data }: {
  data: DashboardData;
  onNotify: (message: string, tone?: "success" | "error") => void;
  onSessionExpired: () => void;
}) {
  const availableItems = useMemo(
    () => data.availability.filter((item) => item.status === "AVAILABLE"),
    [data.availability],
  );

  return (
    <div className="app-page dashboard-page">
      <header className="app-page-header">
        <div>
          <p className="dashboard-eyebrow">Tableau de bord</p>
          <h1 tabIndex={-1}>Bonjour, {data.user.firstName}</h1>
          <p>Partagez votre place ou réservez celle d’un collègue pour les 7 prochains jours.</p>
        </div>
        <span className="live-data-label"><i /> Disponibilités · 7 jours</span>
      </header>

      <div className="community-banner">
        <span><Users aria-hidden="true" /></span>
        <p>Chez <strong>{data.organization.name}</strong>, <em>{data.organization.sharedTotal.toLocaleString("fr-FR")}</em> partage{data.organization.sharedTotal > 1 ? "s" : ""} publié{data.organization.sharedTotal > 1 ? "s" : ""}.</p>
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
            <span>Consultez les créneaux publiés par votre entreprise.</span>
          </span>
          <span className="task-entry-cta">Voir les disponibilités <ArrowRight aria-hidden="true" /></span>
        </AppLink>
      </section>

      <section className="dashboard-overview" aria-labelledby="week-title">
        <div className="section-heading-compact">
          <div><p className="section-kicker">Cette semaine</p><h2 id="week-title">Partages et réservations</h2></div>
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
                <span className={`status status-${item.status.toLowerCase()}`}><i />{statusLabel(item)}</span>
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
    </div>
  );
}
