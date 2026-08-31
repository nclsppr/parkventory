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
import { applicationMessages } from "../i18n/application";
import { useI18n } from "../i18n/I18n";
import {
  DEFAULT_SITE_TIME_ZONE,
  dateInputValue,
  formatAvailabilityDate,
  formatAvailabilityTime,
  formatInputDate,
  formatInputTime,
  formatTimeRange,
  formatTimeZone,
} from "../lib/dates";
import type { AvailabilityItem, DashboardData } from "../types";

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
  const { locale, intlLocale } = useI18n();
  const copy = applicationMessages[locale].share;
  const availabilityCopy = applicationMessages[locale].availability;
  const [shareBusy, setShareBusy] = useState(false);
  const [spotBusy, setSpotBusy] = useState(false);
  const [withdrawBusyId, setWithdrawBusyId] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [spotForm, setSpotForm] = useState({ label: "", level: "" });
  const siteTimeZone = data.user.assignedSiteTimeZone ?? DEFAULT_SITE_TIME_ZONE;
  const [shareForm, setShareForm] = useState({
    spot: data.user.assignedSpot ?? "",
    date: dateInputValue(1, siteTimeZone),
    from: "08:00",
    to: "18:00",
  });
  const shareLock = useRef(false);
  const spotLock = useRef(false);
  const withdrawLock = useRef<string | null>(null);
  const timeZone = data.user.assignedSiteTimeZone;
  const ownShares = useMemo(() => data.activeShares, [data.activeShares]);
  const timeOrderInvalid = Boolean(shareForm.from && shareForm.to && shareForm.from >= shareForm.to);
  const displayDate = (item: AvailabilityItem) => formatAvailabilityDate(
    item,
    intlLocale,
    availabilityCopy.dateUnknown,
  );
  const displayTime = (item: AvailabilityItem) => formatAvailabilityTime(
    item,
    intlLocale,
    availabilityCopy.timeUnknown,
  );
  const displayTimeZone = (timeZoneValue?: string | null, localDate?: string, localFrom?: string) => formatTimeZone(
    timeZoneValue,
    intlLocale,
    availabilityCopy.timeZoneUnknown,
    availabilityCopy.localTime,
    localDate && localFrom ? `${localDate}T${localFrom}` : localDate,
  );

  useEffect(() => {
    setShareForm((current) => ({ ...current, spot: data.user.assignedSpot ?? "" }));
  }, [data.user.assignedSpot]);

  useEffect(() => {
    setInlineError(null);
    setSuccessMessage(null);
  }, [locale]);

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
      await declareSpot({
        label: spotForm.label.trim(),
        level: spotForm.level.trim() || undefined,
      });
      await onRefresh(false);
      setSuccessMessage(copy.spotAssigned(spotForm.label.trim()));
    } catch (error) {
      reportError(error, copy.declareError);
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
      await shareSpot(shareForm);
      await onRefresh(false);
      setSuccessMessage(copy.publishedSuccess(
        shareForm.spot,
        formatInputDate(shareForm.date, intlLocale, availabilityCopy.dateUnknown),
        formatInputTime(shareForm.from, intlLocale, availabilityCopy.timeUnknown),
        formatInputTime(shareForm.to, intlLocale, availabilityCopy.timeUnknown),
      ));
    } catch (error) {
      reportError(error, copy.publishError);
    } finally {
      shareLock.current = false;
      setShareBusy(false);
    }
  };

  const handleWithdraw = async (item: AvailabilityItem) => {
    if (withdrawLock.current) return;
    const date = displayDate(item);
    if (!window.confirm(copy.withdrawConfirmation(item.spot, date))) return;

    withdrawLock.current = item.id;
    setWithdrawBusyId(item.id);
    setInlineError(null);
    setSuccessMessage(null);
    try {
      await withdrawAvailability(item.id);
      await onRefresh(false);
      setSuccessMessage(copy.withdrawnSuccess(item.spot, date));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
      setInlineError(
        error instanceof Error
          ? error.message
          : copy.withdrawError,
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
          <p className="dashboard-eyebrow">{copy.eyebrow}</p>
          <h1 tabIndex={-1}>{data.user.assignedSpot ? copy.titleAssigned : copy.titleUnassigned}</h1>
          <p>
            {data.user.assignedSpot
              ? copy.assignedIntroduction(data.user.assignedSpot)
              : copy.unassignedIntroduction}
          </p>
        </div>
        <span className="route-safety-note"><ShieldCheck aria-hidden="true" /> {copy.companyOnly}</span>
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
            aria-label={copy.formLabel}
            onSubmit={handleShare}
          >
            <div className="workflow-section-heading">
              <span><CalendarCheck aria-hidden="true" /></span>
              <div><h2>{copy.availabilitySlot}</h2><p>{copy.parkingLocalTime}</p></div>
            </div>

            <div className="field-group">
              <span>{copy.yourSpace}</span>
              <span className="assigned-spot-field"><CarFront aria-hidden="true" /><strong>{shareForm.spot}</strong><small>{data.user.assignedLevel ?? availabilityCopy.levelUnknown}</small></span>
            </div>

            <label className="field-group">
              <span>{copy.date}</span>
              <input
                type="date"
                min={dateInputValue(0, siteTimeZone)}
                value={shareForm.date}
                onChange={(event) => setShareForm({ ...shareForm, date: event.target.value })}
                required
              />
            </label>

            <div className="time-fields">
              <label className="field-group">
                <span>{copy.start}</span>
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
                <span>{copy.end}</span>
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

            <p className="timezone-note"><Clock3 aria-hidden="true" /> {copy.localTime} : <strong>{displayTimeZone(timeZone, shareForm.date, shareForm.from)}</strong></p>
            {timeOrderInvalid && <p className="field-error" id="share-time-error" role="alert">{copy.timeOrderError}</p>}
          </form>

          <aside className="workflow-surface workflow-summary" aria-labelledby="share-summary-title">
            <p className="section-kicker">{copy.summary}</p>
            <h2 id="share-summary-title">{shareForm.spot}</h2>
            <dl>
              <div><dt>{copy.location}</dt><dd><MapPin aria-hidden="true" />{data.user.assignedLevel ?? availabilityCopy.levelUnknown}</dd></div>
              <div><dt>{copy.date}</dt><dd>{formatInputDate(shareForm.date, intlLocale, availabilityCopy.dateUnknown)}</dd></div>
              <div><dt>{copy.schedule}</dt><dd>{formatTimeRange(shareForm.from, shareForm.to, intlLocale, availabilityCopy.timeUnknown)}</dd></div>
              <div><dt>{copy.localTime}</dt><dd>{displayTimeZone(timeZone, shareForm.date, shareForm.from)}</dd></div>
            </dl>
            <p className="workflow-trust"><ShieldCheck aria-hidden="true" /> {copy.privacyNote}</p>
            <button
              className="button button-primary workflow-primary-action"
              type="submit"
              form="share-workflow-form"
              disabled={!readyToShare || shareBusy}
              aria-busy={shareBusy}
            >
              {shareBusy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Share2 aria-hidden="true" />}
              {shareBusy ? copy.publishing : copy.publish}
            </button>
          </aside>
        </div>
      ) : (
        <div className="workflow-layout workflow-layout-onboarding">
          <form className="workflow-surface workflow-form" aria-label={copy.declareFormLabel} onSubmit={handleDeclareSpot}>
            <div className="workflow-section-heading">
              <span><CarFront aria-hidden="true" /></span>
              <div><h2>{copy.regularSpace}</h2><p>{copy.regularSpaceIntroduction}</p></div>
            </div>
            <label className="field-group">
              <span>{copy.spotLabel}</span>
              <input
                placeholder="A-24"
                maxLength={32}
                value={spotForm.label}
                onChange={(event) => setSpotForm({ ...spotForm, label: event.target.value })}
                required
              />
            </label>
            <label className="field-group">
              <span>{copy.levelOrZone} <small>{copy.optional}</small></span>
              <input
                placeholder={copy.levelPlaceholder}
                maxLength={64}
                value={spotForm.level}
                onChange={(event) => setSpotForm({ ...spotForm, level: event.target.value })}
              />
            </label>
            <button className="button button-primary workflow-primary-action" type="submit" disabled={spotBusy || !spotForm.label.trim()} aria-busy={spotBusy}>
              {spotBusy ? <LoaderCircle className="spin" aria-hidden="true" /> : <CarFront aria-hidden="true" />}
              {spotBusy ? copy.saving : copy.assignSpace}
            </button>
          </form>
          <aside className="workflow-side-note">
            <p className="section-kicker">{copy.whyStep}</p>
            <h2>{copy.stableSpaceTitle}</h2>
            <p>{copy.stableSpaceBody}</p>
          </aside>
        </div>
      )}

      {data.user.assignedSpot && (
        <section className="availability-results managed-availability" aria-labelledby="my-shares-title">
          <div className="section-heading-compact">
            <div>
              <p className="section-kicker">{copy.tracking}</p>
              <h2 id="my-shares-title">{copy.activeShares}</h2>
            </div>
          </div>
          {ownShares.length === 0 ? (
            <div className="route-empty-state route-empty-state-compact">
              <CalendarCheck aria-hidden="true" />
              <h3>{copy.noActiveShares}</h3>
              <p>{copy.noActiveSharesBody}</p>
            </div>
          ) : (
            <ol className="availability-agenda">
              {ownShares.map((item) => (
                <li key={item.id}>
                  <div className="availability-agenda-status">
                    <span className={`status status-${item.status.toLowerCase()}`}><i />{item.status === "RESERVED" ? availabilityCopy.reserved : availabilityCopy.published}</span>
                    <span>{displayDate(item)}</span>
                  </div>
                  <div className="availability-agenda-place">
                    <CarFront aria-hidden="true" />
                    <p><strong>{item.spot}</strong><span>{item.level || availabilityCopy.levelUnknown}</span></p>
                  </div>
                  <p className="availability-agenda-time"><Clock3 aria-hidden="true" />{displayTime(item)} · {displayTimeZone(item.timeZone, item.localDate, item.localFrom)}</p>
                  {item.canWithdraw ? (
                    <button
                      className="button button-danger button-small"
                      type="button"
                      onClick={() => void handleWithdraw(item)}
                      disabled={withdrawBusyId === item.id}
                      aria-busy={withdrawBusyId === item.id}
                    >
                      {withdrawBusyId === item.id
                        ? <LoaderCircle className="spin" aria-hidden="true" />
                        : <Trash2 aria-hidden="true" />}
                      {withdrawBusyId === item.id ? copy.withdrawing : copy.withdraw}
                    </button>
                  ) : (
                    <span className="availability-agenda-static">
                      <ShieldCheck aria-hidden="true" />
                      {item.status === "RESERVED" ? availabilityCopy.reservationActive : availabilityCopy.withdrawalUnavailable}
                    </span>
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
