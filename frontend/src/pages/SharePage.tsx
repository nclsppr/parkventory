import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CarFront,
  Check,
  Clock3,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Share2,
  Trash2,
} from "lucide-react";
import { ApiError, declareSpot, shareSpot, withdrawAvailability } from "../api/client";
import { dateInputValue, formatInputDate } from "../lib/dates";
import type { DashboardData } from "../types";

interface SharePageProps {
  data: DashboardData;
  onRefresh: (showLoading?: boolean) => Promise<void>;
  onSessionExpired: () => void;
}

export function SharePage({
  data,
  onRefresh,
  onSessionExpired,
}: SharePageProps) {
  const [shareBusy, setShareBusy] = useState(false);
  const [spotBusy, setSpotBusy] = useState(false);
  const [withdrawBusyId, setWithdrawBusyId] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [spotForm, setSpotForm] = useState({ label: "", level: "" });
  const [shareForm, setShareForm] = useState({
    spot: data.user.assignedSpot ?? "",
    date: dateInputValue(1),
    from: "08:00",
    to: "18:00",
  });
  const shareLock = useRef(false);
  const spotLock = useRef(false);
  const withdrawLock = useRef<string | null>(null);
  const timeZone = data.user.assignedSiteTimeZone;
  const ownShares = useMemo(() => data.activeShares, [data.activeShares]);
  const timeOrderInvalid = Boolean(shareForm.from && shareForm.to && shareForm.from >= shareForm.to);
  const timeOrderMessage = "L’heure de fin doit être postérieure à l’heure de début.";

  useEffect(() => {
    setShareForm((current) => ({ ...current, spot: data.user.assignedSpot ?? "" }));
  }, [data.user.assignedSpot]);

  const reportError = (error: unknown, fallback: string) => {
    if (error instanceof ApiError && error.status === 401) {
      onSessionExpired();
      return;
    }
    const message = error instanceof Error ? error.message : fallback;
    setInlineError(message);
  };

  const handleDeclareSpot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (spotLock.current) return;
    spotLock.current = true;
    setSpotBusy(true);
    setInlineError(null);
    setSuccessMessage(null);
    try {
      const response = await declareSpot({
        label: spotForm.label.trim(),
        level: spotForm.level.trim() || undefined,
      });
      await onRefresh(false);
      setSuccessMessage(response.message);
    } catch (error) {
      reportError(error, "La place n’a pas pu être déclarée.");
    } finally {
      spotLock.current = false;
      setSpotBusy(false);
    }
  };

  const handleShare = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (shareLock.current) return;
    setInlineError(null);
    setSuccessMessage(null);
    if (timeOrderInvalid) {
      return;
    }

    shareLock.current = true;
    setShareBusy(true);
    try {
      const response = await shareSpot(shareForm);
      await onRefresh(false);
      const summary = `${response.message} ${formatInputDate(shareForm.date)}, de ${shareForm.from} à ${shareForm.to}.`;
      setSuccessMessage(summary);
    } catch (error) {
      reportError(error, "La disponibilité n’a pas pu être publiée.");
    } finally {
      shareLock.current = false;
      setShareBusy(false);
    }
  };

  const handleWithdraw = async (availabilityId: string, spot: string, dateLabel: string) => {
    if (withdrawLock.current) return;
    if (!window.confirm(`Retirer le partage de ${spot} pour ${dateLabel} ?`)) return;

    withdrawLock.current = availabilityId;
    setWithdrawBusyId(availabilityId);
    setInlineError(null);
    setSuccessMessage(null);
    try {
      const response = await withdrawAvailability(availabilityId);
      await onRefresh(false);
      setSuccessMessage(response.message);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
      setInlineError(
        error instanceof Error
          ? error.message
          : "La disponibilité n’a pas pu être retirée.",
      );
      if (error instanceof ApiError && error.status === 409) {
        await onRefresh(false);
      }
    } finally {
      withdrawLock.current = null;
      setWithdrawBusyId(null);
    }
  };

  const readyToShare = Boolean(
    shareForm.spot && shareForm.date && shareForm.from && shareForm.to && timeZone,
  );
  return (
    <div className="app-page route-page share-route-page">
      <header className="app-page-header route-page-header">
        <div>
          <p className="dashboard-eyebrow">Partager</p>
          <h1 tabIndex={-1}>{data.user.assignedSpot ? "Partager ma place" : "Déclarer ma place"}</h1>
          <p>
            {data.user.assignedSpot
              ? `Indiquez quand ${data.user.assignedSpot} est libre. Aucun motif d’absence n’est demandé.`
              : "Affectez d’abord la place que vous utilisez habituellement."}
          </p>
        </div>
        <span className="route-safety-note"><ShieldCheck aria-hidden="true" /> Visible seulement par votre entreprise</span>
      </header>

      {successMessage && (
        <div className="inline-feedback inline-feedback-success" role="status">
          <Check aria-hidden="true" /><p>{successMessage}</p>
        </div>
      )}

      {inlineError && (
        <div className="inline-feedback inline-feedback-error" role="alert">
          <AlertTriangle aria-hidden="true" /><p>{inlineError}</p>
        </div>
      )}

      {data.user.assignedSpot ? (
        <div className="workflow-layout">
          <form
            className="workflow-surface workflow-form"
            id="share-workflow-form"
            aria-label="Formulaire de partage"
            onSubmit={handleShare}
          >
            <div className="workflow-section-heading">
              <span><CalendarCheck aria-hidden="true" /></span>
              <div><h2>Créneau de disponibilité</h2><p>Les heures sont interprétées dans le fuseau affiché ci-dessous.</p></div>
            </div>

            <div className="field-group">
              <span>Votre place</span>
              <span className="assigned-spot-field"><CarFront aria-hidden="true" /><strong>{shareForm.spot}</strong><small>{data.user.assignedLevel ?? "Niveau non renseigné"}</small></span>
            </div>

            <label className="field-group">
              <span>Date</span>
              <input
                type="date"
                min={dateInputValue()}
                value={shareForm.date}
                onChange={(event) => setShareForm({ ...shareForm, date: event.target.value })}
                required
              />
            </label>

            <div className="time-fields">
              <label className="field-group">
                <span>Début</span>
                <input
                  type="time"
                  value={shareForm.from}
                  onChange={(event) => setShareForm({ ...shareForm, from: event.target.value })}
                  aria-describedby={timeOrderInvalid ? "share-time-error" : undefined}
                  aria-invalid={timeOrderInvalid || undefined}
                  required
                />
              </label>
              <label className="field-group">
                <span>Fin</span>
                <input
                  type="time"
                  value={shareForm.to}
                  onChange={(event) => setShareForm({ ...shareForm, to: event.target.value })}
                  aria-describedby={timeOrderInvalid ? "share-time-error" : undefined}
                  aria-invalid={timeOrderInvalid || undefined}
                  required
                />
              </label>
            </div>

            <p className="timezone-note"><Clock3 aria-hidden="true" /> Fuseau : <strong>{timeZone ?? "Non renseigné"}</strong></p>
            {timeOrderInvalid && <p className="field-error" id="share-time-error" role="alert">{timeOrderMessage}</p>}
          </form>

          <aside className="workflow-surface workflow-summary" aria-labelledby="share-summary-title">
            <p className="section-kicker">Récapitulatif</p>
            <h2 id="share-summary-title">{shareForm.spot}</h2>
            <dl>
              <div><dt>Emplacement</dt><dd><MapPin aria-hidden="true" />{data.user.assignedLevel ?? "Niveau non renseigné"}</dd></div>
              <div><dt>Date</dt><dd>{formatInputDate(shareForm.date)}</dd></div>
              <div><dt>Horaire</dt><dd>{shareForm.from || "—"} – {shareForm.to || "—"}</dd></div>
              <div><dt>Fuseau</dt><dd>{timeZone ?? "Non renseigné"}</dd></div>
            </dl>
            <p className="workflow-trust"><ShieldCheck aria-hidden="true" /> Votre absence et son motif ne sont jamais demandés.</p>
            <button
              className="button button-primary workflow-primary-action"
              type="submit"
              form="share-workflow-form"
              disabled={!readyToShare || shareBusy}
              aria-busy={shareBusy}
            >
              {shareBusy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Share2 aria-hidden="true" />}
              {shareBusy ? "Publication…" : "Partager ma place"}
            </button>
          </aside>
        </div>
      ) : (
        <div className="workflow-layout workflow-layout-onboarding">
          <form className="workflow-surface workflow-form" aria-label="Déclarer ma place" onSubmit={handleDeclareSpot}>
            <div className="workflow-section-heading">
              <span><CarFront aria-hidden="true" /></span>
              <div><h2>Votre place habituelle</h2><p>Vous pourrez la partager dès cette étape terminée.</p></div>
            </div>
            <label className="field-group">
              <span>Libellé de la place</span>
              <input
                placeholder="A-24"
                maxLength={32}
                value={spotForm.label}
                onChange={(event) => setSpotForm({ ...spotForm, label: event.target.value })}
                required
              />
            </label>
            <label className="field-group">
              <span>Niveau ou zone <small>optionnel</small></span>
              <input
                placeholder="Niveau A"
                maxLength={64}
                value={spotForm.level}
                onChange={(event) => setSpotForm({ ...spotForm, level: event.target.value })}
              />
            </label>
            <button className="button button-primary workflow-primary-action" type="submit" disabled={spotBusy || !spotForm.label.trim()} aria-busy={spotBusy}>
              {spotBusy ? <LoaderCircle className="spin" aria-hidden="true" /> : <CarFront aria-hidden="true" />}
              {spotBusy ? "Enregistrement…" : "Affecter cette place"}
            </button>
          </form>
          <aside className="workflow-side-note">
            <p className="section-kicker">Pourquoi cette étape ?</p>
            <h2>Une place stable, des créneaux flexibles.</h2>
            <p>Parkventory rattache chaque disponibilité à une place précise pour éviter les conflits de réservation.</p>
          </aside>
        </div>
      )}

      {data.user.assignedSpot && (
        <section className="availability-results managed-availability" aria-labelledby="my-shares-title">
          <div className="section-heading-compact">
            <div>
              <p className="section-kicker">Suivi</p>
              <h2 id="my-shares-title">Mes partages actifs</h2>
            </div>
          </div>
          {ownShares.length === 0 ? (
            <div className="route-empty-state route-empty-state-compact">
              <CalendarCheck aria-hidden="true" />
              <h3>Aucun partage actif.</h3>
              <p>Le prochain créneau publié apparaîtra ici et pourra être retiré tant qu’il n’est pas réservé.</p>
            </div>
          ) : (
            <ol className="availability-agenda">
              {ownShares.map((item) => (
                <li key={item.id}>
                  <div className="availability-agenda-status">
                    <span className={`status status-${item.status.toLowerCase()}`}><i />{item.status === "RESERVED" ? "Réservée" : "Publiée"}</span>
                    <span>{item.dateLabel}</span>
                  </div>
                  <div className="availability-agenda-place">
                    <CarFront aria-hidden="true" />
                    <p><strong>{item.spot}</strong><span>{item.level}</span></p>
                  </div>
                  <p className="availability-agenda-time"><Clock3 aria-hidden="true" />{item.timeLabel} · {item.timeZone}</p>
                  {item.canWithdraw ? (
                    <button
                      className="button button-danger button-small"
                      type="button"
                      onClick={() => void handleWithdraw(item.id, item.spot, item.dateLabel)}
                      disabled={withdrawBusyId === item.id}
                      aria-busy={withdrawBusyId === item.id}
                    >
                      {withdrawBusyId === item.id
                        ? <LoaderCircle className="spin" aria-hidden="true" />
                        : <Trash2 aria-hidden="true" />}
                      {withdrawBusyId === item.id ? "Retrait…" : "Retirer"}
                    </button>
                  ) : (
                    <span className="availability-agenda-static"><ShieldCheck aria-hidden="true" />Réservation active</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
