import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CarFront,
  Check,
  Clock3,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Share2,
} from "lucide-react";
import { ApiError, declareSpot, shareSpot } from "../api/client";
import { isPublicDemo } from "../config";
import { browserTimeZone, dateInputValue, formatInputDate } from "../lib/dates";
import type { DashboardData } from "../types";

interface SharePageProps {
  data: DashboardData;
  onDemoMutation: (mutation: (current: DashboardData) => DashboardData) => void;
  onRefresh: (showLoading?: boolean) => Promise<void>;
  onSessionExpired: () => void;
}

export function SharePage({
  data,
  onDemoMutation,
  onRefresh,
  onSessionExpired,
}: SharePageProps) {
  const [shareBusy, setShareBusy] = useState(false);
  const [spotBusy, setSpotBusy] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [spotForm, setSpotForm] = useState({ label: "", level: "" });
  const [shareForm, setShareForm] = useState({
    spot: data.user.assignedSpot ?? "",
    date: dateInputValue(1),
    from: "08:00",
    to: "18:00",
  });
  const timeZone = useMemo(browserTimeZone, []);
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
    if (spotBusy) return;
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
      setSpotBusy(false);
    }
  };

  const handleShare = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (shareBusy) return;
    setInlineError(null);
    setSuccessMessage(null);
    if (timeOrderInvalid) {
      return;
    }

    setShareBusy(true);
    try {
      const response = await shareSpot(shareForm);
      if (isPublicDemo) {
        onDemoMutation((current) => ({
          ...current,
          organization: {
            ...current.organization,
            sharedTotal: current.organization.sharedTotal + 1,
          },
          stats: { ...current.stats, shares: current.stats.shares + 1 },
        }));
      } else {
        await onRefresh(false);
      }
      const summary = `${response.message} ${formatInputDate(shareForm.date)}, de ${shareForm.from} à ${shareForm.to}.`;
      setSuccessMessage(summary);
    } catch (error) {
      reportError(error, "La disponibilité n’a pas pu être publiée.");
    } finally {
      setShareBusy(false);
    }
  };

  const readyToShare = Boolean(
    shareForm.spot && shareForm.date && shareForm.from && shareForm.to,
  );
  const shareError = timeOrderInvalid ? timeOrderMessage : inlineError;

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

            <p className="timezone-note"><Clock3 aria-hidden="true" /> Fuseau : <strong>{timeZone}</strong></p>
            {shareError && <p className="field-error" id="share-time-error" role="alert">{shareError}</p>}
          </form>

          <aside className="workflow-surface workflow-summary" aria-labelledby="share-summary-title">
            <p className="section-kicker">Récapitulatif</p>
            <h2 id="share-summary-title">{shareForm.spot}</h2>
            <dl>
              <div><dt>Emplacement</dt><dd><MapPin aria-hidden="true" />{data.user.assignedLevel ?? "Niveau non renseigné"}</dd></div>
              <div><dt>Date</dt><dd>{formatInputDate(shareForm.date)}</dd></div>
              <div><dt>Horaire</dt><dd>{shareForm.from || "—"} – {shareForm.to || "—"}</dd></div>
              <div><dt>Fuseau</dt><dd>{timeZone}</dd></div>
            </dl>
            <p className="workflow-trust"><ShieldCheck aria-hidden="true" /> Votre absence et son motif ne sont jamais demandés.</p>
            <button
              className="button button-primary workflow-primary-action"
              type="submit"
              form="share-workflow-form"
              disabled={!readyToShare || shareBusy}
            >
              {shareBusy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Share2 aria-hidden="true" />}
              {shareBusy ? "Publication…" : "Partager ma place"}
            </button>
            {isPublicDemo && <small className="demo-persistence-note">Cette action reste locale à la page de démonstration.</small>}
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
            {inlineError && <p className="field-error" role="alert">{inlineError}</p>}
            <button className="button button-primary workflow-primary-action" type="submit" disabled={spotBusy || !spotForm.label.trim()}>
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
    </div>
  );
}
