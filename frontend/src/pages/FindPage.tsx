import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  Check,
  Clock3,
  Info,
  LoaderCircle,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { ApiError, cancelReservation, reserveSpot } from "../api/client";
import { AppLink } from "../components/AppLink";
import { localizedUrls } from "../config";
import { applicationMessages } from "../i18n/application";
import { useI18n } from "../i18n/I18n";
import {
  formatAvailabilityDate,
  formatAvailabilityTime,
  formatAvailabilityTimePhrase,
  formatTimeZone,
} from "../lib/dates";
import type { AvailabilityItem, DashboardData } from "../types";

interface FindPageProps {
  data: DashboardData;
  onRefresh: (showLoading?: boolean) => Promise<void>;
  onSessionExpired: () => void;
}

export function FindPage({
  data,
  onRefresh,
  onSessionExpired,
}: FindPageProps) {
  const { locale, intlLocale } = useI18n();
  const copy = applicationMessages[locale].find;
  const availabilityCopy = applicationMessages[locale].availability;
  const { appUrl } = localizedUrls(locale);
  const numberFormat = useMemo(() => new Intl.NumberFormat(intlLocale), [intlLocale]);
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
  const sentenceTime = (item: AvailabilityItem) => formatAvailabilityTimePhrase(
    item,
    intlLocale,
    availabilityCopy.timeUnknown,
  );
  const displayTimeZone = (timeZone?: string | null, localDate?: string, localFrom?: string) => formatTimeZone(
    timeZone,
    intlLocale,
    availabilityCopy.timeZoneUnknown,
    availabilityCopy.localTime,
    localDate && localFrom ? `${localDate}T${localFrom}` : localDate,
  );
  const statusLabel = (item: AvailabilityItem) => {
    if (item.viewerRelation === "RESERVED") return availabilityCopy.viewerReservation;
    if (item.viewerRelation === "OFFERED") return availabilityCopy.viewerAvailability;
    if (item.status === "AVAILABLE") return availabilityCopy.available;
    if (item.status === "RESERVED") return availabilityCopy.reserved;
    return availabilityCopy.unavailable;
  };

  useEffect(() => {
    setResultMessage(null);
    setSelectedId(null);
    reservationAttempt.current = null;
  }, [locale]);

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
      await onRefresh(false);
      const message = copy.bookedSuccess(
        selected.spot,
        displayDate(selected),
        sentenceTime(selected),
      );
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
        ? copy.bookingConflict
        : error instanceof Error
          ? error.message
          : copy.bookingFailed;
      setResultTone("error");
      setResultMessage(message);
      if (conflict) {
        setSelectedId(null);
        reservationAttempt.current = null;
        await onRefresh(false);
      }
    } finally {
      reserveLock.current = false;
      setReserveBusy(false);
    }
  };

  const handleCancel = async (item: AvailabilityItem) => {
    if (!item.reservationId || !item.canCancel || cancelLock.current) return;
    const date = displayDate(item);
    const time = sentenceTime(item);
    if (!window.confirm(copy.cancellationConfirmation(item.spot, date, time))) return;

    cancelLock.current = item.reservationId;
    setCancelBusyId(item.reservationId);
    setResultMessage(null);
    try {
      await cancelReservation(item.reservationId);
      await onRefresh(false);
      setResultTone("success");
      setResultMessage(copy.cancellationSuccess(item.spot, date, time));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
      setResultTone("error");
      setResultMessage(
        error instanceof Error
          ? error.message
          : copy.cancellationFailed,
      );
      if (error instanceof ApiError && error.status === 409) {
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
          <p className="dashboard-eyebrow">{copy.eyebrow}</p>
          <h1 tabIndex={-1}>{copy.title}</h1>
          <p>{copy.introduction}</p>
        </div>
        <span className="route-safety-note route-safety-note-cyan"><ShieldCheck aria-hidden="true" /> {copy.oneSpaceOneBooking}</span>
      </header>

      <section className="availability-scope" aria-labelledby="scope-title">
        <div className="workflow-section-heading workflow-section-heading-cyan">
          <span><Search aria-hidden="true" /></span>
          <div><h2 id="scope-title">{copy.scopeTitle}</h2><p>{copy.scopeIntroduction}</p></div>
        </div>
        <dl>
          <div><dt>{copy.schedules}</dt><dd><Clock3 aria-hidden="true" /> {copy.localTime}</dd></div>
          <div><dt>{copy.available}</dt><dd className="scope-available"><CarFront aria-hidden="true" /> {numberFormat.format(availableCount)}</dd></div>
        </dl>
        <p><Info aria-hidden="true" /> {copy.timeZoneNote}</p>
      </section>

      {resultMessage && (
        <div className={`inline-feedback ${resultTone === "error" ? "inline-feedback-error" : "inline-feedback-success"}`} role={resultTone === "error" ? "alert" : "status"}>
          {resultTone === "error" ? <Info aria-hidden="true" /> : <Check aria-hidden="true" />}
          <p>{resultMessage}</p>
          {resultTone === "success" && <AppLink href={appUrl}>{copy.backToDashboard} <ArrowRight aria-hidden="true" /></AppLink>}
        </div>
      )}

      <div className="find-workflow-layout" id="disponibilites">
        <section className="availability-results" aria-labelledby="results-title">
          <div className="section-heading-compact">
            <div>
              <p className="section-kicker">{copy.publishedSlots}</p>
              <h2 id="results-title">{copy.choicesCount(availableCount, numberFormat.format(availableCount))}</h2>
            </div>
          </div>

          {data.availability.length === 0 ? (
            <div className="route-empty-state">
              <CalendarDays aria-hidden="true" />
              <h3>{copy.emptyTitle}</h3>
              <p>{copy.emptyBody}</p>
            </div>
          ) : (
            <ol className="availability-agenda">
              {data.availability.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <li className={isSelected ? "selected" : undefined} key={item.id}>
                    <div className="availability-agenda-status">
                      <span className={`status status-${item.status.toLowerCase()}`}><i />{statusLabel(item)}</span>
                      <span>{displayDate(item)}</span>
                    </div>
                    <div className="availability-agenda-place">
                      <CarFront aria-hidden="true" />
                      <p><strong>{item.spot}</strong><span>{item.level || availabilityCopy.levelUnknown}</span></p>
                    </div>
                    <p className="availability-agenda-time"><Clock3 aria-hidden="true" />{displayTime(item)} · {displayTimeZone(item.timeZone, item.localDate, item.localFrom)}</p>
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
                        {isSelected ? copy.selected : copy.choose}<ArrowRight aria-hidden="true" />
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
                            {cancelBusyId === item.reservationId ? copy.canceling : copy.cancel}
                          </button>
                        ) : (
                          <span className="availability-agenda-static">{copy.cancellationClosed}</span>
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
              }} aria-label={copy.closeSelection}><X aria-hidden="true" /></button>
              <p className="section-kicker">{copy.yourSelection}</p>
              <h2>{selected.spot}</h2>
              <dl>
                <div><dt>{copy.level}</dt><dd>{selected.level || availabilityCopy.levelUnknown}</dd></div>
                <div><dt>{copy.date}</dt><dd>{displayDate(selected)}</dd></div>
                <div><dt>{copy.schedule}</dt><dd>{displayTime(selected)}</dd></div>
                <div><dt>{copy.localTime}</dt><dd>{displayTimeZone(selected.timeZone, selected.localDate, selected.localFrom)}</dd></div>
              </dl>
              <p><ShieldCheck aria-hidden="true" /> {copy.confirmationNote}</p>
              <button className="button button-primary workflow-primary-action" type="button" onClick={() => void handleReserve()} disabled={reserveBusy} aria-busy={reserveBusy}>
                {reserveBusy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                {reserveBusy ? copy.confirming : copy.confirmBooking}
              </button>
            </>
          ) : (
            <div className="reservation-summary-empty">
              <CarFront aria-hidden="true" />
              <h2>{copy.selectSpace}</h2>
              <p>{copy.selectSpaceBody}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
