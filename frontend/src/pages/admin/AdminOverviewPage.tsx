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
import { formatDateTime, formatNumber } from "../../components/admin/adminFormat";
import { adminOperationsUrl, adminTenantUrl, adminTenantsUrl } from "../../config";
import { useAdminResource } from "../../hooks/useAdminResource";

export function AdminOverviewPage({
  onSessionExpired,
  onForbidden,
}: {
  onSessionExpired: () => void;
  onForbidden: () => void;
}) {
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
        title="Vue d’ensemble"
        description="État du réseau Parkventory, activité récente et signaux à investiguer. Le tenant système est exclu des métriques."
        actions={resource.data && (
          <button className="button button-secondary button-small" type="button" onClick={() => void resource.reload()} disabled={resource.refreshing}>
            <RefreshCw className={resource.refreshing ? "spin" : ""} aria-hidden="true" /> Actualiser
          </button>
        )}
      />
      {resource.loading && <AdminLoading label="Construction de la vue réseau…" />}
      {!resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} />}
      {resource.data && (
        <>
          {resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title="L’actualisation a échoué." />}
          <section className="admin-posture" aria-labelledby="network-posture-title">
            <div>
              <h2 id="network-posture-title">Posture du réseau</h2>
              <p>État au {formatDateTime(resource.data.overview.generatedAt)}</p>
            </div>
            <div className="admin-posture-signals">
              <span className="admin-signal admin-signal-ok">
                <CheckCircle2 aria-hidden="true" /> Base de données opérationnelle
              </span>
              <span className={resource.data.diagnostics.incidents.last24Hours ? "admin-signal admin-signal-alert" : "admin-signal admin-signal-ok"}>
                {resource.data.diagnostics.incidents.last24Hours ? <AlertTriangle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
                {formatNumber(resource.data.diagnostics.incidents.last24Hours)} incident{resource.data.diagnostics.incidents.last24Hours === 1 ? "" : "s"} · 24 h
              </span>
            </div>
          </section>

          <AdminMetricBand
            label="Totaux du réseau"
            items={[
              { label: "Tenants", value: formatNumber(resource.data.overview.totals.tenants), detail: `+${formatNumber(resource.data.overview.period.newTenants)} sur 30 j` },
              { label: "Utilisateurs", value: formatNumber(resource.data.overview.totals.users), detail: `+${formatNumber(resource.data.overview.period.newUsers)} sur 30 j` },
              { label: "Places", value: formatNumber(resource.data.overview.totals.parkingSpots) },
              { label: "Partages", value: formatNumber(resource.data.overview.totals.shares), detail: `${formatNumber(resource.data.overview.period.shares)} sur 30 j` },
              { label: "Réservations", value: formatNumber(resource.data.overview.totals.reservations), detail: `${formatNumber(resource.data.overview.period.reservations)} sur 30 j` },
              { label: "Sessions actives", value: formatNumber(resource.data.overview.totals.activeSessions) },
            ]}
          />

          <dl className="admin-period-rail" aria-label="Activité sur la fenêtre de trente jours">
            <div><dt>Utilisateurs actifs · 7 j</dt><dd>{formatNumber(resource.data.overview.period.activeUsers7d)}</dd></div>
            <div><dt>Utilisateurs actifs · 30 j</dt><dd>{formatNumber(resource.data.overview.period.activeUsers30d)}</dd></div>
            <div><dt>Réservations / partages</dt><dd>{resource.data.overview.period.reservationRate === null ? "—" : `${new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 }).format(resource.data.overview.period.reservationRate)}`}</dd></div>
            <div><dt>Retraits / annulations</dt><dd>{formatNumber(resource.data.overview.period.withdrawals)} / {formatNumber(resource.data.overview.period.cancellations)}</dd></div>
            <div><dt>Incidents</dt><dd>{formatNumber(resource.data.overview.period.incidents)}</dd></div>
          </dl>

          <div className="admin-overview-grid">
            <AdminTrend series={resource.data.overview.series} />
            <section className="admin-panel admin-tenant-pulse" aria-labelledby="tenant-pulse-title">
              <header>
                <div><h2 id="tenant-pulse-title">Tenants les plus récents</h2><p>Adoption et dernière activité observée</p></div>
                <AppLink href={adminTenantsUrl}>Tout voir</AppLink>
              </header>
              {resource.data.tenants.items.length ? <ol>
                {resource.data.tenants.items.map((tenant) => (
                  <li key={tenant.id}>
                    <AppLink href={adminTenantUrl(tenant.id)}>
                      <strong>{tenant.name}</strong><span>{tenant.domain}</span>
                    </AppLink>
                    <time dateTime={tenant.lastActivityAt ? new Date(tenant.lastActivityAt * 1_000).toISOString() : undefined}>
                      {formatDateTime(tenant.lastActivityAt)}
                    </time>
                    <span>{formatNumber(tenant.activeSessionCount)} session{tenant.activeSessionCount === 1 ? "" : "s"}</span>
                  </li>
                ))}
              </ol> : <AdminEmpty title="Aucun tenant client.">Les premiers tenants apparaîtront ici.</AdminEmpty>}
            </section>
          </div>

          <section className="admin-panel admin-events" aria-labelledby="recent-events-title">
            <header>
              <div><h2 id="recent-events-title">Activité récente</h2><p>Derniers événements du réseau</p></div>
              <AppLink href={adminOperationsUrl}>Ouvrir les opérations</AppLink>
            </header>
            {resource.data.activity.items.length
              ? <AdminActivityList items={resource.data.activity.items} compact />
              : <AdminEmpty title="Aucun événement récent.">Le journal d’activité est vide pour le moment.</AdminEmpty>}
          </section>
        </>
      )}
    </section>
  );
}
