import { AlertTriangle, CheckCircle2, Filter, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { loadAdminActivity, loadAdminDiagnostics } from "../../api/client";
import { AppLink } from "../../components/AppLink";
import { AdminActivityList } from "../../components/admin/AdminActivityList";
import { AdminIntegrityDetails } from "../../components/admin/AdminIntegrityDetails";
import { AdminPager } from "../../components/admin/AdminPager";
import { AdminEmpty, AdminError, AdminLoading } from "../../components/admin/AdminState";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { formatDateTime, formatNumber } from "../../components/admin/adminFormat";
import { adminOperationsUrl } from "../../config";
import { useAdminResource } from "../../hooks/useAdminResource";
import type { AdminActivitySeverity } from "../../types";

interface ActivityFilters {
  tenantId: string;
  userId: string;
  type: string;
  severity: "" | AdminActivitySeverity;
  errorCode: string;
  reference: string;
}

type OperationsLocation = Partial<ActivityFilters> & {
  view?: "activity" | "diagnostics";
  check?: string;
};

const integritySeverityLabels = { WARNING: "Avertissement", ERROR: "Erreur" } as const;
const integrityStatusLabels = { ok: "Conforme", attention: "À examiner" } as const;

function operationsUrl(values: OperationsLocation) {
  const query = new URLSearchParams();
  if (values.view === "diagnostics") query.set("view", "diagnostics");
  if (values.check) query.set("check", values.check);
  if (values.tenantId) query.set("tenantId", values.tenantId);
  if (values.userId) query.set("userId", values.userId);
  if (values.type) query.set("type", values.type);
  if (values.severity) query.set("severity", values.severity);
  if (values.errorCode) query.set("errorCode", values.errorCode);
  if (values.reference) query.set("reference", values.reference);
  const serialized = query.toString();
  return serialized ? `${adminOperationsUrl}?${serialized}` : adminOperationsUrl;
}

function navigateOperations(values: OperationsLocation) {
  window.history.pushState({}, "", operationsUrl(values));
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function AdminOperationsPage({
  search,
  onSessionExpired,
  onForbidden,
}: {
  search: string;
  onSessionExpired: () => void;
  onForbidden: () => void;
}) {
  const parameters = new URLSearchParams(search);
  const view = parameters.get("view") === "diagnostics" ? "diagnostics" : "activity";
  return (
    <section className="admin-page">
      <AdminPageHeader title="Opérations" description="Événements de sécurité et de produit, incidents et intégrité du service." />
      <nav className="admin-tabs" aria-label="Vues des opérations">
        <AppLink href={adminOperationsUrl} aria-current={view === "activity" ? "page" : undefined}>Activité</AppLink>
        <AppLink href={`${adminOperationsUrl}?view=diagnostics`} aria-current={view === "diagnostics" ? "page" : undefined}>Diagnostics</AppLink>
      </nav>
      {view === "activity"
        ? <AdminActivityView search={search} onSessionExpired={onSessionExpired} onForbidden={onForbidden} />
        : <AdminDiagnosticsView search={search} onSessionExpired={onSessionExpired} onForbidden={onForbidden} />}
    </section>
  );
}

function AdminActivityView({
  search,
  onSessionExpired,
  onForbidden,
}: {
  search: string;
  onSessionExpired: () => void;
  onForbidden: () => void;
}) {
  const parameters = new URLSearchParams(search);
  const filters: ActivityFilters = {
    tenantId: parameters.get("tenantId")?.trim() ?? "",
    userId: parameters.get("userId")?.trim() ?? "",
    type: parameters.get("type")?.trim() ?? "",
    severity: (["INFO", "WARNING", "ERROR"] as const).find((value) => value === parameters.get("severity")) ?? "",
    errorCode: parameters.get("errorCode")?.trim() ?? "",
    reference: parameters.get("reference")?.trim() ?? "",
  };
  const [draft, setDraft] = useState(filters);
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    setDraft(filters);
    setCursor(undefined);
    setCursorHistory([]);
    // The serialized filter key prevents changes caused by a fresh URLSearchParams instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);
  const loader = useCallback(() => loadAdminActivity({
    limit: 50,
    cursor,
    tenantId: filters.tenantId || undefined,
    userId: filters.userId || undefined,
    type: filters.type || undefined,
    severity: filters.severity || undefined,
    errorCode: filters.errorCode || undefined,
    reference: filters.reference || undefined,
  }), [cursor, filterKey]);
  const resource = useAdminResource(loader, [loader], onSessionExpired, onForbidden);
  const filtered = Boolean(filters.tenantId || filters.userId || filters.type || filters.severity || filters.errorCode || filters.reference);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigateOperations(draft);
  };

  return (
    <section className="admin-operation-view" aria-labelledby="activity-view-title">
      <div className="admin-subsection-heading">
        <div><h2 id="activity-view-title">Journal d’activité</h2><p>Les plus récents événements sont affichés en premier.</p></div>
      </div>
      <form className="admin-operation-filters" onSubmit={submit}>
        <div><label htmlFor="activity-tenant">Tenant ID</label><input id="activity-tenant" value={draft.tenantId} onChange={(event) => setDraft({ ...draft, tenantId: event.target.value })} maxLength={160} /></div>
        <div><label htmlFor="activity-user">Utilisateur ID</label><input id="activity-user" value={draft.userId} onChange={(event) => setDraft({ ...draft, userId: event.target.value })} maxLength={160} /></div>
        <div><label htmlFor="activity-type">Type d’événement</label><input id="activity-type" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} maxLength={80} /></div>
        <div><label htmlFor="activity-error-code">Code d’erreur exact</label><input id="activity-error-code" value={draft.errorCode} onChange={(event) => setDraft({ ...draft, errorCode: event.target.value })} maxLength={80} /></div>
        <div><label htmlFor="activity-reference">Référence</label><input id="activity-reference" value={draft.reference} onChange={(event) => setDraft({ ...draft, reference: event.target.value })} maxLength={160} placeholder="Incident, requête ou entité" /></div>
        <div>
          <label htmlFor="activity-severity">Sévérité</label>
          <select id="activity-severity" value={draft.severity} onChange={(event) => setDraft({ ...draft, severity: event.target.value as ActivityFilters["severity"] })}>
            <option value="">Toutes</option><option value="INFO">Information</option><option value="WARNING">Avertissement</option><option value="ERROR">Erreur</option>
          </select>
        </div>
        <button className="button button-secondary button-small" type="submit"><Filter aria-hidden="true" /> Filtrer</button>
        {filtered && <button className="admin-clear-filter" type="button" onClick={() => navigateOperations({})}>Réinitialiser</button>}
      </form>
      {resource.loading && <AdminLoading label="Chargement du journal…" />}
      {!resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} />}
      {resource.data && resource.data.items.length === 0 && (
        <AdminEmpty title="Aucun événement correspondant." action={filtered ? <button className="button button-secondary button-small" type="button" onClick={() => navigateOperations({})}>Réinitialiser</button> : undefined}>
          {filtered ? "Retirez un filtre pour élargir la recherche." : "Les nouveaux événements apparaîtront ici."}
        </AdminEmpty>
      )}
      {resource.data && resource.data.items.length > 0 && (
        <>
          {resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title="Le changement de page a échoué." />}
          <AdminActivityList items={resource.data.items} />
          <AdminPager
            hasPrevious={cursorHistory.length > 0}
            hasNext={Boolean(resource.data.page.nextCursor)}
            busy={resource.refreshing}
            onPrevious={() => {
              const previous = cursorHistory[cursorHistory.length - 1];
              setCursorHistory((history) => history.slice(0, -1));
              setCursor(previous || undefined);
            }}
            onNext={() => {
              if (!resource.data?.page.nextCursor) return;
              setCursorHistory((history) => [...history, cursor ?? ""]);
              setCursor(resource.data.page.nextCursor ?? undefined);
            }}
          />
        </>
      )}
    </section>
  );
}

function AdminDiagnosticsView({
  search,
  onSessionExpired,
  onForbidden,
}: {
  search: string;
  onSessionExpired: () => void;
  onForbidden: () => void;
}) {
  const selectedCheckKey = new URLSearchParams(search).get("check")?.trim() ?? "";
  const [integrityRefreshVersion, setIntegrityRefreshVersion] = useState(0);
  const loader = useCallback(() => loadAdminDiagnostics(), []);
  const resource = useAdminResource(loader, [loader], onSessionExpired, onForbidden);
  const selectedCheck = resource.data?.integrity.checks.find((check) => check.key === selectedCheckKey);
  return (
    <section className="admin-operation-view" aria-labelledby="diagnostics-view-title">
      <div className="admin-subsection-heading">
        <div><h2 id="diagnostics-view-title">Diagnostics</h2><p>Intégrité, télémétrie, authentification et incidents récents.</p></div>
        {resource.data && <button className="button button-secondary button-small" type="button" onClick={() => {
          setIntegrityRefreshVersion((version) => version + 1);
          void resource.reload();
        }} disabled={resource.refreshing}><RefreshCw className={resource.refreshing ? "spin" : ""} aria-hidden="true" /> Actualiser</button>}
      </div>
      {resource.loading && <AdminLoading label="Exécution des diagnostics…" />}
      {!resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} />}
      {resource.data && (
        <>
          {resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title="L’actualisation a échoué." />}
          <div className="admin-diagnostic-summary">
            <span className="admin-signal admin-signal-ok"><CheckCircle2 aria-hidden="true" /> Base de données opérationnelle</span>
            <span className={resource.data.incidents.last24Hours ? "admin-signal admin-signal-alert" : "admin-signal admin-signal-ok"}>
              {resource.data.incidents.last24Hours ? <AlertTriangle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
              {formatNumber(resource.data.incidents.last24Hours)} incident{resource.data.incidents.last24Hours === 1 ? "" : "s"} · 24 h
            </span>
            <time dateTime={new Date(resource.data.generatedAt * 1_000).toISOString()}>Généré {formatDateTime(resource.data.generatedAt)}</time>
          </div>
          {resource.data.integrity && (
            <section className="admin-integrity" aria-labelledby="integrity-title">
              <header><div><h3 id="integrity-title">Contrôles d’intégrité</h3><p>{resource.data.integrity.issueCount === 0 ? "Aucune anomalie détectée" : `${formatNumber(resource.data.integrity.issueCount)} anomalie${resource.data.integrity.issueCount === 1 ? "" : "s"} à examiner`}</p></div></header>
              <ul>{resource.data.integrity.checks.map((check) => {
                const requiresAttention = check.status === "attention";
                return (
                  <li key={check.key}>
                    <span className={requiresAttention ? `admin-severity admin-severity-${check.severity.toLowerCase()}` : "admin-severity admin-severity-ok"}>
                      {requiresAttention ? integritySeverityLabels[check.severity] : integrityStatusLabels.ok}
                    </span>
                    <div><strong>{check.label}</strong><p>{check.detail}</p></div>
                    <span>{formatNumber(check.count)}</span>
                    {requiresAttention && (
                      <div className="admin-integrity-actions">
                        <span className="admin-integrity-status">{integrityStatusLabels.attention}</span>
                        <AppLink
                          href={operationsUrl({ view: "diagnostics", check: check.key })}
                          aria-current={selectedCheckKey === check.key ? "location" : undefined}
                        >Voir les lignes</AppLink>
                      </div>
                    )}
                  </li>
                );
              })}</ul>
            </section>
          )}
          {selectedCheckKey && selectedCheck && (
            <AdminIntegrityDetails
              key={selectedCheckKey}
              checkKey={selectedCheckKey}
              checkLabel={selectedCheck.label}
              refreshVersion={integrityRefreshVersion}
              onSessionExpired={onSessionExpired}
              onForbidden={onForbidden}
            />
          )}
          {selectedCheckKey && !selectedCheck && (
            <AdminEmpty
              title="Contrôle introuvable."
              action={<AppLink className="button button-secondary button-small" href={operationsUrl({ view: "diagnostics" })}>Revenir aux diagnostics</AppLink>}
            >Ce contrôle n’est pas proposé par les diagnostics actuels.</AdminEmpty>
          )}
          <div className="admin-diagnostics-grid">
            <section className="admin-panel" aria-labelledby="telemetry-title">
              <header><div><h3 id="telemetry-title">Télémétrie</h3><p>Profondeur du journal</p></div></header>
              <dl>
                <div><dt>Événements</dt><dd>{formatNumber(resource.data.telemetry.events)}</dd></div>
                <div><dt>Plus ancien</dt><dd>{formatDateTime(resource.data.telemetry.oldestEventAt)}</dd></div>
                <div><dt>Plus récent</dt><dd>{formatDateTime(resource.data.telemetry.latestEventAt)}</dd></div>
              </dl>
            </section>
            <section className="admin-panel" aria-labelledby="authentication-title">
              <header><div><h3 id="authentication-title">Authentification</h3><p>Liens et sessions</p></div></header>
              <dl>
                <div><dt>Liens en attente</dt><dd>{formatNumber(resource.data.authentication.pendingMagicLinks)}</dd></div>
                <div><dt>Liens expirés</dt><dd>{formatNumber(resource.data.authentication.expiredMagicLinks)}</dd></div>
                <div><dt>Sessions tenant</dt><dd>{formatNumber(resource.data.authentication.activeTenantSessions)}</dd></div>
                <div><dt>Sessions système</dt><dd>{formatNumber(resource.data.authentication.activeSystemSessions)}</dd></div>
                <div><dt>Sessions révoquées</dt><dd>{formatNumber(resource.data.authentication.revokedSessions)}</dd></div>
              </dl>
            </section>
          </div>
          <section className="admin-panel admin-incidents" aria-labelledby="incidents-title">
            <header><div><h3 id="incidents-title">Incidents récents</h3><p>{formatNumber(resource.data.incidents.last7Days)} sur les sept derniers jours</p></div></header>
            {resource.data.incidents.latest.length ? (
              <ol>{resource.data.incidents.latest.map((incident) => (
                <li key={incident.id}>
                  <time dateTime={new Date(incident.occurredAt * 1_000).toISOString()}>{formatDateTime(incident.occurredAt)}</time>
                  {incident.errorCode ? (
                    <AppLink
                      className="admin-incident-code"
                      href={operationsUrl({ errorCode: incident.errorCode })}
                      title={`Filtrer le journal sur le code ${incident.errorCode}`}
                    ><strong>{incident.errorCode}</strong></AppLink>
                  ) : <strong>Incident sans code</strong>}
                  <span>{incident.route ?? "Route inconnue"}</span>
                  <div className="admin-incident-references">
                    {incident.incidentId && <AppLink href={operationsUrl({ reference: incident.incidentId })}><code title={incident.incidentId}>Incident · {incident.incidentId}</code></AppLink>}
                    {incident.requestId && incident.requestId !== incident.incidentId && <AppLink href={operationsUrl({ reference: incident.requestId })}><code title={incident.requestId}>Requête · {incident.requestId}</code></AppLink>}
                  </div>
                </li>
              ))}</ol>
            ) : <AdminEmpty title="Aucun incident récent.">Aucun incident n’est enregistré sur la période.</AdminEmpty>}
          </section>
        </>
      )}
    </section>
  );
}
