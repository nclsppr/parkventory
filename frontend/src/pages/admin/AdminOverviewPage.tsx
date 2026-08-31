import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useCallback } from "react";
import {
  loadAdminActivity,
  loadAdminDiagnostics,
  loadAdminOverview,
  loadAdminTenants,
} from "../../api/client";
import { AppLink } from "../../components/AppLink";
import { AdminActivityList } from "../../components/admin/AdminActivityList";
import { AdminEmpty, AdminError, AdminLoading } from "../../components/admin/AdminState";
import { AdminMetricBand, AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminTrend } from "../../components/admin/AdminTrend";
import { formatDateTime, formatNumber, formatPercent } from "../../components/admin/adminFormat";
import { localizedUrls } from "../../config";
import { useAdminResource } from "../../hooks/useAdminResource";
import { useI18n } from "../../i18n/I18n";
import { adminMessages } from "../../i18n/admin";

export function AdminOverviewPage({
  onSessionExpired,
  onForbidden,
}: {
  onSessionExpired: () => void;
  onForbidden: () => void;
}) {
  const { locale, intlLocale } = useI18n();
  const copy = adminMessages[locale];
  const urls = localizedUrls(locale);
  const loader = useCallback(async () => {
    const [overview, tenants, activity, diagnostics] = await Promise.all([
      loadAdminOverview(),
      loadAdminTenants({ limit: 5 }),
      loadAdminActivity({ limit: 8 }),
      loadAdminDiagnostics(),
    ]);
    return { overview, tenants, activity, diagnostics };
  }, []);
  const resource = useAdminResource(loader, [loader], onSessionExpired, onForbidden);

  return (
    <section className="admin-page admin-overview-page">
      <AdminPageHeader
        title={copy.overview.title}
        description={copy.overview.description}
        actions={resource.data && (
          <button className="button button-secondary button-small" type="button" onClick={() => void resource.reload()} disabled={resource.refreshing}>
            <RefreshCw className={resource.refreshing ? "spin" : ""} aria-hidden="true" /> {copy.common.refresh}
          </button>
        )}
      />
      {resource.loading && <AdminLoading label={copy.overview.loading} />}
      {!resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} />}
      {resource.data && (
        <>
          {resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title={copy.common.refreshFailed} />}
          <section className="admin-posture" aria-labelledby="network-posture-title">
            <div>
              <h2 id="network-posture-title">{copy.overview.networkPosture}</h2>
              <p>{copy.overview.statusAt(formatDateTime(resource.data.overview.generatedAt, intlLocale, copy.common.never))}</p>
            </div>
            <div className="admin-posture-signals">
              <span className="admin-signal admin-signal-ok">
                <CheckCircle2 aria-hidden="true" /> {copy.overview.databaseOperational}
              </span>
              <span className={resource.data.diagnostics.incidents.last24Hours ? "admin-signal admin-signal-alert" : "admin-signal admin-signal-ok"}>
                {resource.data.diagnostics.incidents.last24Hours ? <AlertTriangle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
                {copy.overview.incidents24h(resource.data.diagnostics.incidents.last24Hours, formatNumber(resource.data.diagnostics.incidents.last24Hours, intlLocale))}
              </span>
            </div>
          </section>

          <AdminMetricBand
            label={copy.overview.totalsLabel}
            items={[
              { label: copy.overview.organizations, value: formatNumber(resource.data.overview.totals.tenants, intlLocale), detail: copy.overview.addedOver30Days(formatNumber(resource.data.overview.period.newTenants, intlLocale)) },
              { label: copy.overview.users, value: formatNumber(resource.data.overview.totals.users, intlLocale), detail: copy.overview.addedOver30Days(formatNumber(resource.data.overview.period.newUsers, intlLocale)) },
              { label: copy.overview.parkingSpaces, value: formatNumber(resource.data.overview.totals.parkingSpots, intlLocale) },
              { label: copy.overview.shares, value: formatNumber(resource.data.overview.totals.shares, intlLocale), detail: copy.overview.over30Days(formatNumber(resource.data.overview.period.shares, intlLocale)) },
              { label: copy.overview.bookings, value: formatNumber(resource.data.overview.totals.reservations, intlLocale), detail: copy.overview.over30Days(formatNumber(resource.data.overview.period.reservations, intlLocale)) },
              { label: copy.overview.activeSessions, value: formatNumber(resource.data.overview.totals.activeSessions, intlLocale) },
            ]}
          />

          <dl className="admin-period-rail" aria-label={copy.overview.thirtyDayActivityLabel}>
            <div><dt>{copy.overview.activeUsers7d}</dt><dd>{formatNumber(resource.data.overview.period.activeUsers7d, intlLocale)}</dd></div>
            <div><dt>{copy.overview.activeUsers30d}</dt><dd>{formatNumber(resource.data.overview.period.activeUsers30d, intlLocale)}</dd></div>
            <div><dt>{copy.overview.bookingShareRate}</dt><dd>{resource.data.overview.period.reservationRate === null ? "—" : formatPercent(resource.data.overview.period.reservationRate, intlLocale)}</dd></div>
            <div><dt>{copy.overview.withdrawalsCancellations}</dt><dd>{formatNumber(resource.data.overview.period.withdrawals, intlLocale)} / {formatNumber(resource.data.overview.period.cancellations, intlLocale)}</dd></div>
            <div><dt>{copy.overview.incidents}</dt><dd>{formatNumber(resource.data.overview.period.incidents, intlLocale)}</dd></div>
          </dl>

          <div className="admin-overview-grid">
            <AdminTrend series={resource.data.overview.series} />
            <section className="admin-panel admin-tenant-pulse" aria-labelledby="tenant-pulse-title">
              <header>
                <div><h2 id="tenant-pulse-title">{copy.overview.recentOrganizations}</h2><p>{copy.overview.recentOrganizationsSubtitle}</p></div>
                <AppLink href={urls.adminTenantsUrl}>{copy.common.viewAll}</AppLink>
              </header>
              {resource.data.tenants.items.length ? <ol>
                {resource.data.tenants.items.map((tenant) => (
                  <li key={tenant.id}>
                    <AppLink href={urls.adminTenantUrl(tenant.id)}>
                      <strong>{tenant.name}</strong><span>{tenant.domain}</span>
                    </AppLink>
                    <time dateTime={tenant.lastActivityAt ? new Date(tenant.lastActivityAt * 1_000).toISOString() : undefined}>
                      {formatDateTime(tenant.lastActivityAt, intlLocale, copy.common.never)}
                    </time>
                    <span>{copy.overview.activeSessionCount(tenant.activeSessionCount, formatNumber(tenant.activeSessionCount, intlLocale))}</span>
                  </li>
                ))}
              </ol> : <AdminEmpty title={copy.overview.noOrganizations}>{copy.overview.noOrganizationsBody}</AdminEmpty>}
            </section>
          </div>

          <section className="admin-panel admin-events" aria-labelledby="recent-events-title">
            <header>
              <div><h2 id="recent-events-title">{copy.overview.recentActivity}</h2><p>{copy.overview.recentActivitySubtitle}</p></div>
              <AppLink href={urls.adminOperationsUrl}>{copy.overview.openOperations}</AppLink>
            </header>
            {resource.data.activity.items.length
              ? <AdminActivityList items={resource.data.activity.items} compact />
              : <AdminEmpty title={copy.overview.noRecentEvents}>{copy.overview.emptyActivity}</AdminEmpty>}
          </section>
        </>
      )}
    </section>
  );
}
