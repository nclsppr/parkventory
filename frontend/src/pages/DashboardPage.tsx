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
import { localizedUrls } from "../config";
import { applicationMessages } from "../i18n/application";
import { useI18n } from "../i18n/I18n";
import { formatAvailabilityDate, formatAvailabilityTime } from "../lib/dates";
import type { AvailabilityItem, DashboardData } from "../types";

export function DashboardPage({ data }: {
  data: DashboardData;
  onNotify: (message: string, tone?: "success" | "error") => void;
  onSessionExpired: () => void;
}) {
  const { locale, intlLocale } = useI18n();
  const copy = applicationMessages[locale].dashboard;
  const availabilityCopy = applicationMessages[locale].availability;
  const { findUrl, shareUrl } = localizedUrls(locale);
  const numberFormat = useMemo(() => new Intl.NumberFormat(intlLocale), [intlLocale]);
  const availableItems = useMemo(
    () => data.availability.filter((item) => item.status === "AVAILABLE"),
    [data.availability],
  );
  const statusLabel = (item: AvailabilityItem) => {
    if (item.viewerRelation === "RESERVED") return availabilityCopy.viewerReservation;
    if (item.viewerRelation === "OFFERED") return availabilityCopy.viewerAvailability;
    if (item.status === "AVAILABLE") return availabilityCopy.available;
    if (item.status === "RESERVED") return availabilityCopy.reserved;
    return availabilityCopy.unavailable;
  };

  return (
    <div className="app-page dashboard-page">
      <header className="app-page-header">
        <div>
          <p className="dashboard-eyebrow">{copy.eyebrow}</p>
          <h1 tabIndex={-1}>{copy.greeting(data.user.firstName)}</h1>
          <p>{copy.introduction}</p>
        </div>
        <span className="live-data-label"><i /> {copy.liveAvailability}</span>
      </header>

      <div className="community-banner">
        <span><Users aria-hidden="true" /></span>
        <p>{copy.communitySummary(
          data.organization.name,
          data.organization.sharedTotal,
          numberFormat.format(data.organization.sharedTotal),
        )}</p>
      </div>

      <section className="task-entry-grid" aria-labelledby="quick-actions-title">
        <h2 className="sr-only" id="quick-actions-title">{copy.quickActions}</h2>
        <AppLink className="task-entry task-entry-share" href={shareUrl}>
          <span className="task-entry-icon"><CalendarDays aria-hidden="true" /></span>
          <span className="task-entry-copy">
            <small>{data.user.assignedSpot ? copy.assignedSpace(data.user.assignedSpot) : copy.firstStep}</small>
            <strong>{data.user.assignedSpot ? copy.shareSpace : copy.declareSpace}</strong>
            <span>{copy.shareDescription}</span>
          </span>
          <span className="task-entry-cta">{copy.prepareAvailability} <ArrowRight aria-hidden="true" /></span>
        </AppLink>

        <AppLink className="task-entry task-entry-find" href={findUrl}>
          <span className="task-entry-icon"><Search aria-hidden="true" /></span>
          <span className="task-entry-copy">
            <small>{copy.availableSpaces(availableItems.length, numberFormat.format(availableItems.length))}</small>
            <strong>{copy.findSpace}</strong>
            <span>{copy.findDescription}</span>
          </span>
          <span className="task-entry-cta">{copy.viewAvailability} <ArrowRight aria-hidden="true" /></span>
        </AppLink>
      </section>

      <section className="dashboard-overview" aria-labelledby="week-title">
        <div className="section-heading-compact">
          <div><p className="section-kicker">{copy.weekKicker}</p><h2 id="week-title">{copy.weekTitle}</h2></div>
          <AppLink href={`${findUrl}#disponibilites`}>{copy.viewAll} <ArrowRight aria-hidden="true" /></AppLink>
        </div>
        <div className="dashboard-overview-layout">
          <ol className="availability-preview-list">
            {data.availability.length === 0 ? (
              <li className="availability-preview-empty">
                <CarFront aria-hidden="true" />
                <p>{copy.emptyTitle}<span>{copy.emptyBody}</span></p>
              </li>
            ) : data.availability.slice(0, 4).map((item) => (
              <li key={item.id}>
                <span className={`status status-${item.status.toLowerCase()}`}><i />{statusLabel(item)}</span>
                <p>
                  <strong>{formatAvailabilityDate(item, intlLocale, availabilityCopy.dateUnknown)}</strong>
                  <span>{formatAvailabilityTime(item, intlLocale, availabilityCopy.timeUnknown)}</span>
                </p>
                <p><strong>{item.spot}</strong><span>{item.level || availabilityCopy.levelUnknown}</span></p>
              </li>
            ))}
          </ol>
          <dl className="stats-strip" aria-label={copy.weekActivity}>
            <div><dt>{copy.shares}</dt><dd><Share2 aria-hidden="true" />{numberFormat.format(data.stats.shares)}</dd></div>
            <div><dt>{copy.bookings}</dt><dd><CalendarDays aria-hidden="true" />{numberFormat.format(data.stats.reservations)}</dd></div>
            <div><dt>{copy.availableSpacesStat}</dt><dd><CarFront aria-hidden="true" />{numberFormat.format(data.stats.availableSpots)}</dd></div>
          </dl>
        </div>
      </section>
    </div>
  );
}
