import { useRef, useState } from "react";
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
  Trash2,
  X,
} from "lucide-react";
import { ApiError, cancelReservation, reserveSpot } from "../api/client";
import { AppLink } from "../components/AppLink";
import { appUrl, isPublicDemo } from "../config";
import type { AvailabilityItem, DashboardData } from "../types";

interface FindPageProps {
  data: DashboardData;
  onDemoMutation: (mutation: (current: DashboardData) => DashboardData) => void;
  onRefresh: (showLoading?: boolean) => Promise<void>;
  onSessionExpired: () => void;
}

function statusLabel(item: AvailabilityItem) {
  if (item.viewerRelation === "RESERVED") return "Votre réservation";
  if (item.viewerRelation === "OFFERED") return "Votre partage";
  if (item.status === "AVAILABLE") return "Disponible";
  if (item.status === "RESERVED") return "Réservée";
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
  const [cancelBusyId, setCancelBusyId] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultTone, setResultTone] = useState<"success" | "error">("success");
  const reserveLock = useRef(false);
  const cancelLock = useRef<string | null>(null);
  const reservationAttempt = useRef<{ availabilityId: string; key: string } | null>(null);
  const selected = data.availability.find((item) => item.id === selectedId) ?? null;
  const availableCount = data.availability.filter((item) => item.status === "AVAILABLE").length;

  const handleReserve = async () => {
    if (!selected || selected.status !== "AVAILABLE" || reserveLock.current) return;
    reserveLock.current = true;
    setReserveBusy(true);
    setResultMessage(null);
    const attempt = reservationAttempt.current?.availabilityId === selected.id
      ? reservationAttempt.current
      : { availabilityId: selected.id, key: crypto.randomUUID() };
    reservationAttempt.current = attempt;
    try {
      await reserveSpot(selected.id, attempt.key);
      if (isPublicDemo) {
        onDemoMutation((current) => ({
          ...current,
          availability: current.availability.map((item) => (
            item.id === selected.id
              ? {
                  ...item,
                  status: "RESERVED" as const,
                  viewerRelation: "RESERVED" as const,
                  reservationId: `demo-reservation-${item.id}`,
                  canCancel: true,
                  canWithdraw: false,
                }
              : item
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
      reservationAttempt.current = null;
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
      if (conflict) {
        setSelectedId(null);
        reservationAttempt.current = null;
        if (!isPublicDemo) await onRefresh(false);
      }
    } finally {
      reserveLock.current = false;
      setReserveBusy(false);
    }
  };

  const handleCancel = async (item: AvailabilityItem) => {
    if (!item.reservationId || !item.canCancel || cancelLock.current) return;
    if (!window.confirm(
      `Annuler votre réservation de ${item.spot}, ${item.dateLabel}, ${item.timeLabel} ?`,
    )) return;

    cancelLock.current = item.reservationId;
    setCancelBusyId(item.reservationId);
    setResultMessage(null);
    try {
      const response = await cancelReservation(item.reservationId);
      if (isPublicDemo) {
        onDemoMutation((current) => ({
          ...current,
          availability: current.availability.map((currentItem) => (
            currentItem.id === item.id
              ? {
                  ...currentItem,
                  status: "AVAILABLE" as const,
                  viewerRelation: "NONE" as const,
                  reservationId: null,
                  canCancel: false,
                  canWithdraw: false,
                }
              : currentItem
          )),
          stats: {
            ...current.stats,
            reservations: Math.max(0, current.stats.reservations - 1),
            availableSpots: current.stats.availableSpots + 1,
          },
        }));
      } else {
        await onRefresh(false);
      }
      setResultTone("success");
      setResultMessage(response.message);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
      setResultTone("error");
      setResultMessage(
        error instanceof Error
          ? error.message
          : "La réservation n’a pas pu être annulée.",
      );
      if (error instanceof ApiError && error.status === 409 && !isPublicDemo) {
        await onRefresh(false);
      }
    } finally {
      cancelLock.current = null;
      setCancelBusyId(null);
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
          <div><dt>Sites</dt><dd><MapPin aria-hidden="true" /> Tous les parkings</dd></div>
          <div><dt>Fuseaux</dt><dd><Clock3 aria-hidden="true" /> Par créneau</dd></div>
          <div><dt>Disponibles</dt><dd className="scope-available"><CarFront aria-hidden="true" /> {availableCount}</dd></div>
        </dl>
        <p><Info aria-hidden="true" /> Chaque créneau est affiché dans le fuseau de son parking.</p>
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
                      <span className={`status status-${item.status.toLowerCase()}`}><i />{statusLabel(item)}</span>
                      <span>{item.dateLabel}</span>
                    </div>
                    <div className="availability-agenda-place">
                      <CarFront aria-hidden="true" />
                      <p><strong>{item.spot}</strong><span>{item.level}</span></p>
                    </div>
                    <p className="availability-agenda-time"><Clock3 aria-hidden="true" />{item.timeLabel} · {item.timeZone}</p>
                    {item.status === "AVAILABLE" ? (
                      <button
                        className="choose-spot-button"
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedId(item.id);
                          reservationAttempt.current = null;
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
                    ) : item.viewerRelation === "RESERVED" && item.reservationId ? (
                      <div className="availability-agenda-actions">
                        {item.canCancel ? (
                          <button
                            className="button button-danger button-small"
                            type="button"
                            onClick={() => void handleCancel(item)}
                            disabled={cancelBusyId === item.reservationId}
                            aria-busy={cancelBusyId === item.reservationId}
                          >
                            {cancelBusyId === item.reservationId
                              ? <LoaderCircle className="spin" aria-hidden="true" />
                              : <Trash2 aria-hidden="true" />}
                            {cancelBusyId === item.reservationId ? "Annulation…" : "Annuler"}
                          </button>
                        ) : (
                          <span className="availability-agenda-static">Annulation fermée</span>
                        )}
                      </div>
                    ) : (
                      <span className="availability-agenda-static">
                        {item.status === "RESERVED" ? <Check aria-hidden="true" /> : <CalendarDays aria-hidden="true" />}
                        {statusLabel(item)}
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
              <button className="reservation-summary-close" type="button" onClick={() => {
                setSelectedId(null);
                reservationAttempt.current = null;
              }} aria-label="Annuler la sélection"><X aria-hidden="true" /></button>
              <p className="section-kicker">Votre sélection</p>
              <h2>{selected.spot}</h2>
              <dl>
                <div><dt>Niveau</dt><dd>{selected.level}</dd></div>
                <div><dt>Date</dt><dd>{selected.dateLabel}</dd></div>
                <div><dt>Horaire</dt><dd>{selected.timeLabel}</dd></div>
                <div><dt>Fuseau</dt><dd>{selected.timeZone}</dd></div>
              </dl>
              <p><ShieldCheck aria-hidden="true" /> La confirmation attribuera ce créneau uniquement à votre compte.</p>
              <button className="button button-primary workflow-primary-action" type="button" onClick={() => void handleReserve()} disabled={reserveBusy} aria-busy={reserveBusy}>
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
