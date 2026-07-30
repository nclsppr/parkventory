import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  Check,
  Clock3,
  Info,
  LoaderCircle,
  MapPin,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { ApiError, reserveSpot } from "../api/client";
import { AppLink } from "../components/AppLink";
import { appUrl, isPublicDemo } from "../config";
import { browserTimeZone } from "../lib/dates";
import type { AvailabilityItem, DashboardData } from "../types";

interface FindPageProps {
  data: DashboardData;
  onDemoMutation: (mutation: (current: DashboardData) => DashboardData) => void;
  onRefresh: (showLoading?: boolean) => Promise<void>;
  onSessionExpired: () => void;
}

function statusLabel(status: AvailabilityItem["status"]) {
  if (status === "AVAILABLE") return "Disponible";
  if (status === "RESERVED") return "Réservée";
  return "Votre partage";
}

export function FindPage({
  data,
  onDemoMutation,
  onRefresh,
  onSessionExpired,
}: FindPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reserveBusy, setReserveBusy] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultTone, setResultTone] = useState<"success" | "error">("success");
  const timeZone = useMemo(browserTimeZone, []);
  const selected = data.availability.find((item) => item.id === selectedId) ?? null;
  const availableCount = data.availability.filter((item) => item.status === "AVAILABLE").length;

  const handleReserve = async () => {
    if (!selected || selected.status !== "AVAILABLE" || reserveBusy) return;
    setReserveBusy(true);
    setResultMessage(null);
    try {
      await reserveSpot(selected.id);
      if (isPublicDemo) {
        onDemoMutation((current) => ({
          ...current,
          availability: current.availability.map((item) => (
            item.id === selected.id ? { ...item, status: "RESERVED" as const } : item
          )),
          stats: {
            ...current.stats,
            reservations: current.stats.reservations + 1,
            availableSpots: Math.max(0, current.stats.availableSpots - 1),
          },
        }));
      } else {
        await onRefresh(false);
      }
      const message = `${selected.spot} est réservée pour ${selected.dateLabel}, ${selected.timeLabel}.`;
      setResultTone("success");
      setResultMessage(message);
      setSelectedId(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
      const conflict = error instanceof ApiError && error.status === 409;
      const message = conflict
        ? "Cette place vient d’être prise par un collègue. La liste a été actualisée."
        : error instanceof Error
          ? error.message
          : "La place n’a pas pu être réservée.";
      setResultTone("error");
      setResultMessage(message);
      setSelectedId(null);
      if (!isPublicDemo) await onRefresh(false);
    } finally {
      setReserveBusy(false);
    }
  };

  return (
    <div className="app-page route-page find-route-page">
      <header className="app-page-header route-page-header">
        <div>
          <p className="dashboard-eyebrow">Réserver</p>
          <h1 tabIndex={-1}>Trouver une place</h1>
          <p>Choisissez une disponibilité publiée, puis confirmez votre réservation.</p>
        </div>
        <span className="route-safety-note route-safety-note-cyan"><ShieldCheck aria-hidden="true" /> Une place, une réservation</span>
      </header>

      <section className="availability-scope" aria-labelledby="scope-title">
        <div className="workflow-section-heading workflow-section-heading-cyan">
          <span><Search aria-hidden="true" /></span>
          <div><h2 id="scope-title">Disponibilités des 7 prochains jours</h2><p>Créneaux publiés par les collègues de votre entreprise.</p></div>
        </div>
        <dl>
          <div><dt>Site</dt><dd><MapPin aria-hidden="true" /> Parking principal</dd></div>
          <div><dt>Fuseau</dt><dd><Clock3 aria-hidden="true" /> {timeZone}</dd></div>
          <div><dt>Disponibles</dt><dd className="scope-available"><CarFront aria-hidden="true" /> {availableCount}</dd></div>
        </dl>
        <p><Info aria-hidden="true" /> Tous les créneaux sont affichés dans le fuseau du parking.</p>
      </section>

      {resultMessage && (
        <div className={`inline-feedback ${resultTone === "error" ? "inline-feedback-error" : "inline-feedback-success"}`} role={resultTone === "error" ? "alert" : "status"}>
          {resultTone === "error" ? <Info aria-hidden="true" /> : <Check aria-hidden="true" />}
          <p>{resultMessage}</p>
          {resultTone === "success" && <AppLink href={appUrl}>Revenir au tableau de bord <ArrowRight aria-hidden="true" /></AppLink>}
        </div>
      )}

      <div className="find-workflow-layout" id="disponibilites">
        <section className="availability-results" aria-labelledby="results-title">
          <div className="section-heading-compact">
            <div>
              <p className="section-kicker">Créneaux publiés</p>
              <h2 id="results-title">{availableCount} place{availableCount > 1 ? "s" : ""} à choisir</h2>
            </div>
          </div>

          {data.availability.length === 0 ? (
            <div className="route-empty-state">
              <CalendarDays aria-hidden="true" />
              <h3>Aucune place n’est encore partagée.</h3>
              <p>Revenez plus tard ou invitez un collègue à publier son premier créneau.</p>
            </div>
          ) : (
            <ol className="availability-agenda">
              {data.availability.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <li className={isSelected ? "selected" : undefined} key={item.id}>
                    <div className="availability-agenda-status">
                      <span className={`status status-${item.status.toLowerCase()}`}><i />{statusLabel(item.status)}</span>
                      <span>{item.dateLabel}</span>
                    </div>
                    <div className="availability-agenda-place">
                      <CarFront aria-hidden="true" />
                      <p><strong>{item.spot}</strong><span>{item.level}</span></p>
                    </div>
                    <p className="availability-agenda-time"><Clock3 aria-hidden="true" />{item.timeLabel}</p>
                    {item.status === "AVAILABLE" ? (
                      <button
                        className="choose-spot-button"
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedId(item.id);
                          setResultMessage(null);
                          window.requestAnimationFrame(() => {
                            const summary = document.querySelector(".reservation-summary");
                            if (typeof summary?.scrollIntoView === "function") {
                              summary.scrollIntoView({ block: "nearest" });
                            }
                          });
                        }}
                      >
                        {isSelected ? "Sélectionnée" : "Choisir"}<ArrowRight aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="availability-agenda-static">
                        {item.status === "RESERVED" ? <Check aria-hidden="true" /> : <CalendarDays aria-hidden="true" />}
                        {statusLabel(item.status)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <aside className={`reservation-summary ${selected ? "reservation-summary-active" : ""}`} aria-live="polite">
          {selected ? (
            <>
              <button className="reservation-summary-close" type="button" onClick={() => setSelectedId(null)} aria-label="Annuler la sélection"><X aria-hidden="true" /></button>
              <p className="section-kicker">Votre sélection</p>
              <h2>{selected.spot}</h2>
              <dl>
                <div><dt>Niveau</dt><dd>{selected.level}</dd></div>
                <div><dt>Date</dt><dd>{selected.dateLabel}</dd></div>
                <div><dt>Horaire</dt><dd>{selected.timeLabel}</dd></div>
                <div><dt>Fuseau</dt><dd>{timeZone}</dd></div>
              </dl>
              <p><ShieldCheck aria-hidden="true" /> La confirmation attribuera ce créneau uniquement à votre compte.</p>
              <button className="button button-primary workflow-primary-action" type="button" onClick={() => void handleReserve()} disabled={reserveBusy}>
                {reserveBusy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                {reserveBusy ? "Confirmation…" : "Confirmer la réservation"}
              </button>
            </>
          ) : (
            <div className="reservation-summary-empty">
              <CarFront aria-hidden="true" />
              <h2>Sélectionnez une place</h2>
              <p>Le récapitulatif apparaîtra ici avant toute réservation.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
