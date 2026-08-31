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
import { localizedUrls } from "../../config";
import { useAdminResource } from "../../hooks/useAdminResource";
import { useI18n } from "../../i18n/I18n";
import { adminMessages } from "../../i18n/admin";
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

function operationsUrl(baseUrl: string, values: OperationsLocation) {
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
  return serialized ? `${baseUrl}?${serialized}` : baseUrl;
}

function navigateOperations(baseUrl: string, values: OperationsLocation) {
  window.history.pushState({}, "", operationsUrl(baseUrl, values));
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
  const { locale } = useI18n();
  const copy = adminMessages[locale].operations;
  const urls = localizedUrls(locale);
  const parameters = new URLSearchParams(search);
  const view = parameters.get("view") === "diagnostics" ? "diagnostics" : "activity";
  return (
    <section className="admin-page">
      <AdminPageHeader title={copy.title} description={copy.description} />
      <nav className="admin-tabs" aria-label={copy.viewsLabel}>
        <AppLink href={urls.adminOperationsUrl} aria-current={view === "activity" ? "page" : undefined}>{copy.activityTab}</AppLink>
        <AppLink href={`${urls.adminOperationsUrl}?view=diagnostics`} aria-current={view === "diagnostics" ? "page" : undefined}>{copy.diagnosticsTab}</AppLink>
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
  const { locale } = useI18n();
  const copy = adminMessages[locale];
  const operationsBaseUrl = localizedUrls(locale).adminOperationsUrl;
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
    navigateOperations(operationsBaseUrl, draft);
  };

  return (
    <section className="admin-operation-view" aria-labelledby="activity-view-title">
      <div className="admin-subsection-heading">
        <div><h2 id="activity-view-title">{copy.operations.activityTitle}</h2><p>{copy.operations.activitySubtitle}</p></div>
      </div>
      <form className="admin-operation-filters" onSubmit={submit}>
        <div><label htmlFor="activity-tenant">{copy.operations.organizationId}</label><input id="activity-tenant" value={draft.tenantId} onChange={(event) => setDraft({ ...draft, tenantId: event.target.value })} maxLength={160} /></div>
        <div><label htmlFor="activity-user">{copy.operations.userId}</label><input id="activity-user" value={draft.userId} onChange={(event) => setDraft({ ...draft, userId: event.target.value })} maxLength={160} /></div>
        <div><label htmlFor="activity-type">{copy.operations.eventType}</label><input id="activity-type" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} maxLength={80} /></div>
        <div><label htmlFor="activity-error-code">{copy.operations.exactErrorCode}</label><input id="activity-error-code" value={draft.errorCode} onChange={(event) => setDraft({ ...draft, errorCode: event.target.value })} maxLength={80} /></div>
        <div><label htmlFor="activity-reference">{copy.operations.reference}</label><input id="activity-reference" value={draft.reference} onChange={(event) => setDraft({ ...draft, reference: event.target.value })} maxLength={160} placeholder={copy.operations.referencePlaceholder} /></div>
        <div>
          <label htmlFor="activity-severity">{copy.operations.severity}</label>
          <select id="activity-severity" value={draft.severity} onChange={(event) => setDraft({ ...draft, severity: event.target.value as ActivityFilters["severity"] })}>
            <option value="">{copy.operations.allSeverities}</option><option value="INFO">{copy.common.severity.INFO}</option><option value="WARNING">{copy.common.severity.WARNING}</option><option value="ERROR">{copy.common.severity.ERROR}</option>
          </select>
        </div>
        <button className="button button-secondary button-small" type="submit"><Filter aria-hidden="true" /> {copy.operations.filter}</button>
        {filtered && <button className="admin-clear-filter" type="button" onClick={() => navigateOperations(operationsBaseUrl, {})}>{copy.common.reset}</button>}
      </form>
      {resource.loading && <AdminLoading label={copy.operations.loadingJournal} />}
      {!resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} />}
      {resource.data && resource.data.items.length === 0 && (
        <AdminEmpty title={copy.operations.noMatchingEvent} action={filtered ? <button className="button button-secondary button-small" type="button" onClick={() => navigateOperations(operationsBaseUrl, {})}>{copy.common.reset}</button> : undefined}>
          {filtered ? copy.operations.removeFilter : copy.operations.newEventsHere}
        </AdminEmpty>
      )}
      {resource.data && resource.data.items.length > 0 && (
        <>
          {resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title={copy.common.pageChangeFailed} />}
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
  const { locale, intlLocale } = useI18n();
  const copy = adminMessages[locale];
  const operationsBaseUrl = localizedUrls(locale).adminOperationsUrl;
  const selectedCheckKey = new URLSearchParams(search).get("check")?.trim() ?? "";
  const [integrityRefreshVersion, setIntegrityRefreshVersion] = useState(0);
  const loader = useCallback(() => loadAdminDiagnostics(), []);
  const resource = useAdminResource(loader, [loader], onSessionExpired, onForbidden);
  const selectedCheck = resource.data?.integrity.checks.find((check) => check.key === selectedCheckKey);
  const selectedCheckCopy = selectedCheck
    ? (copy.integrityChecks[selectedCheck.key] ?? { label: selectedCheck.label, detail: selectedCheck.detail })
    : null;
  return (
    <section className="admin-operation-view" aria-labelledby="diagnostics-view-title">
      <div className="admin-subsection-heading">
        <div><h2 id="diagnostics-view-title">{copy.operations.diagnosticsTitle}</h2><p>{copy.operations.diagnosticsSubtitle}</p></div>
        {resource.data && <button className="button button-secondary button-small" type="button" onClick={() => {
          setIntegrityRefreshVersion((version) => version + 1);
          void resource.reload();
        }} disabled={resource.refreshing}><RefreshCw className={resource.refreshing ? "spin" : ""} aria-hidden="true" /> {copy.common.refresh}</button>}
      </div>
      {resource.loading && <AdminLoading label={copy.operations.runningDiagnostics} />}
      {!resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} />}
      {resource.data && (
        <>
          {resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title={copy.common.refreshFailed} />}
          <div className="admin-diagnostic-summary">
            <span className="admin-signal admin-signal-ok"><CheckCircle2 aria-hidden="true" /> {copy.operations.databaseOperational}</span>
            <span className={resource.data.incidents.last24Hours ? "admin-signal admin-signal-alert" : "admin-signal admin-signal-ok"}>
              {resource.data.incidents.last24Hours ? <AlertTriangle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
              {copy.operations.incidents24h(resource.data.incidents.last24Hours, formatNumber(resource.data.incidents.last24Hours, intlLocale))}
            </span>
            <time dateTime={new Date(resource.data.generatedAt * 1_000).toISOString()}>{copy.operations.generatedAt(formatDateTime(resource.data.generatedAt, intlLocale, copy.common.never))}</time>
          </div>
          {resource.data.integrity && (
            <section className="admin-integrity" aria-labelledby="integrity-title">
              <header><div><h3 id="integrity-title">{copy.operations.integrityTitle}</h3><p>{resource.data.integrity.issueCount === 0 ? copy.operations.noIssues : copy.operations.issuesToReview(resource.data.integrity.issueCount, formatNumber(resource.data.integrity.issueCount, intlLocale))}</p></div></header>
              <ul>{resource.data.integrity.checks.map((check) => {
                const requiresAttention = check.status === "attention";
                const checkCopy = copy.integrityChecks[check.key] ?? { label: check.label, detail: check.detail };
                return (
                  <li key={check.key}>
                    <span className={requiresAttention ? `admin-severity admin-severity-${check.severity.toLowerCase()}` : "admin-severity admin-severity-ok"}>
                      {requiresAttention ? copy.operations.integritySeverity[check.severity] : copy.operations.integrityStatus.ok}
                    </span>
                    <div><strong>{checkCopy.label}</strong><p>{checkCopy.detail}</p></div>
                    <span>{formatNumber(check.count, intlLocale)}</span>
                    {requiresAttention && (
                      <div className="admin-integrity-actions">
                        <span className="admin-integrity-status">{copy.operations.integrityStatus.attention}</span>
                        <AppLink
                          href={operationsUrl(operationsBaseUrl, { view: "diagnostics", check: check.key })}
                          aria-current={selectedCheckKey === check.key ? "location" : undefined}
                        >{copy.operations.viewRows}</AppLink>
                      </div>
                    )}
                  </li>
                );
              })}</ul>
            </section>
          )}
          {selectedCheckKey && selectedCheck && selectedCheckCopy && (
            <AdminIntegrityDetails
              key={selectedCheckKey}
              checkKey={selectedCheckKey}
              checkLabel={selectedCheckCopy.label}
              refreshVersion={integrityRefreshVersion}
              onSessionExpired={onSessionExpired}
              onForbidden={onForbidden}
            />
          )}
          {selectedCheckKey && !selectedCheck && (
            <AdminEmpty
              title={copy.operations.checkNotFound}
              action={<AppLink className="button button-secondary button-small" href={operationsUrl(operationsBaseUrl, { view: "diagnostics" })}>{copy.operations.backToDiagnostics}</AppLink>}
            >{copy.operations.checkNotFoundBody}</AdminEmpty>
          )}
          <div className="admin-diagnostics-grid">
            <section className="admin-panel" aria-labelledby="telemetry-title">
              <header><div><h3 id="telemetry-title">{copy.operations.telemetry}</h3><p>{copy.operations.journalDepth}</p></div></header>
              <dl>
                <div><dt>{copy.operations.events}</dt><dd>{formatNumber(resource.data.telemetry.events, intlLocale)}</dd></div>
                <div><dt>{copy.operations.oldest}</dt><dd>{formatDateTime(resource.data.telemetry.oldestEventAt, intlLocale, copy.common.never)}</dd></div>
                <div><dt>{copy.operations.latest}</dt><dd>{formatDateTime(resource.data.telemetry.latestEventAt, intlLocale, copy.common.never)}</dd></div>
              </dl>
            </section>
            <section className="admin-panel" aria-labelledby="authentication-title">
              <header><div><h3 id="authentication-title">{copy.operations.authentication}</h3><p>{copy.operations.linksAndSessions}</p></div></header>
              <dl>
                <div><dt>{copy.operations.pendingLinks}</dt><dd>{formatNumber(resource.data.authentication.pendingMagicLinks, intlLocale)}</dd></div>
                <div><dt>{copy.operations.expiredLinks}</dt><dd>{formatNumber(resource.data.authentication.expiredMagicLinks, intlLocale)}</dd></div>
                <div><dt>{copy.operations.organizationSessions}</dt><dd>{formatNumber(resource.data.authentication.activeTenantSessions, intlLocale)}</dd></div>
                <div><dt>{copy.operations.systemSessions}</dt><dd>{formatNumber(resource.data.authentication.activeSystemSessions, intlLocale)}</dd></div>
                <div><dt>{copy.operations.revokedSessions}</dt><dd>{formatNumber(resource.data.authentication.revokedSessions, intlLocale)}</dd></div>
              </dl>
            </section>
          </div>
          <section className="admin-panel admin-incidents" aria-labelledby="incidents-title">
            <header><div><h3 id="incidents-title">{copy.operations.recentIncidents}</h3><p>{copy.operations.incidents7d(formatNumber(resource.data.incidents.last7Days, intlLocale))}</p></div></header>
            {resource.data.incidents.latest.length ? (
              <ol>{resource.data.incidents.latest.map((incident) => (
                <li key={incident.id}>
                  <time dateTime={new Date(incident.occurredAt * 1_000).toISOString()}>{formatDateTime(incident.occurredAt, intlLocale, copy.common.never)}</time>
                  {incident.errorCode ? (
                    <AppLink
                      className="admin-incident-code"
                      href={operationsUrl(operationsBaseUrl, { errorCode: incident.errorCode })}
                      title={copy.operations.filterByErrorCode(incident.errorCode)}
                    ><strong>{incident.errorCode}</strong></AppLink>
                  ) : <strong>{copy.operations.incidentWithoutCode}</strong>}
                  <span>{incident.route ?? copy.operations.unknownRoute}</span>
                  <div className="admin-incident-references">
                    {incident.incidentId && <AppLink href={operationsUrl(operationsBaseUrl, { reference: incident.incidentId })}><code title={incident.incidentId}>{copy.common.incident} · {incident.incidentId}</code></AppLink>}
                    {incident.requestId && incident.requestId !== incident.incidentId && <AppLink href={operationsUrl(operationsBaseUrl, { reference: incident.requestId })}><code title={incident.requestId}>{copy.common.request} · {incident.requestId}</code></AppLink>}
                  </div>
                </li>
              ))}</ol>
            ) : <AdminEmpty title={copy.operations.noRecentIncident}>{copy.operations.noRecentIncidentBody}</AdminEmpty>}
          </section>
        </>
      )}
    </section>
  );
}
