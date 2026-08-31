import { useCallback, useEffect, useRef, useState } from "react";
import { loadAdminDiagnosticsIntegrity } from "../../api/client";
import { localizedUrls } from "../../config";
import { useAdminResource } from "../../hooks/useAdminResource";
import { useI18n } from "../../i18n/I18n";
import { adminMessages } from "../../i18n/admin";
import { AppLink } from "../AppLink";
import { AdminPager } from "./AdminPager";
import { AdminEmpty, AdminError, AdminLoading } from "./AdminState";
import { formatNumber } from "./adminFormat";

function activityReferenceUrl(baseUrl: string, reference: string) {
  return `${baseUrl}?${new URLSearchParams({ reference })}`;
}

export function AdminIntegrityDetails({
  checkKey,
  checkLabel,
  refreshVersion,
  onSessionExpired,
  onForbidden,
}: {
  checkKey: string;
  checkLabel: string;
  refreshVersion: number;
  onSessionExpired: () => void;
  onForbidden: () => void;
}) {
  const { locale, intlLocale } = useI18n();
  const copy = adminMessages[locale];
  const urls = localizedUrls(locale);
  const diagnosticsUrl = `${urls.adminOperationsUrl}?view=diagnostics`;
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const loader = useCallback(() => loadAdminDiagnosticsIntegrity({
    check: checkKey,
    limit: 25,
    cursor,
  }), [checkKey, cursor]);
  const resource = useAdminResource(loader, [loader, refreshVersion], onSessionExpired, onForbidden);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      titleRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [checkKey]);

  return (
    <section className="admin-panel admin-integrity-details" aria-labelledby="integrity-details-title">
      <header>
        <div><h3 id="integrity-details-title" ref={titleRef} tabIndex={-1}>{copy.integrityDetails.title}</h3><p>{checkLabel}</p></div>
        <AppLink href={diagnosticsUrl}>{copy.integrityDetails.close}</AppLink>
      </header>
      {resource.loading && <AdminLoading label={copy.integrityDetails.loading} />}
      {!resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} />}
      {resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title={copy.common.pageChangeFailed} />}
      {resource.data && resource.data.items.length === 0 && (
        <AdminEmpty title={cursorHistory.length > 0 ? copy.integrityDetails.emptyPage : copy.integrityDetails.none}>
          {cursorHistory.length > 0
            ? copy.integrityDetails.previousPageBody
            : copy.integrityDetails.resolvedBody}
        </AdminEmpty>
      )}
      {resource.data && resource.data.items.length > 0 && (
        <ol className="admin-integrity-results">
          {resource.data.items.map((issue, index) => (
            <li key={`${issue.issueKind}:${issue.organizationId ?? "system"}:${index}`}>
              <span className={`admin-severity ${issue.issueKind === "MISSING" ? "admin-severity-error" : "admin-severity-warning"}`}>
                {issue.issueKind === "MISSING" ? copy.integrityDetails.missing : copy.integrityDetails.row}
              </span>
              <div className="admin-integrity-scope">
                {issue.organizationId ? (
                  <AppLink
                    href={urls.adminTenantUrl(issue.organizationId)}
                    aria-label={copy.integrityDetails.openOrganization(issue.organizationId)}
                    title={copy.integrityDetails.openOrganization(issue.organizationId)}
                  >
                    <strong>{copy.integrityDetails.organization}</strong>
                    <code>{issue.organizationId}</code>
                  </AppLink>
                ) : (
                  <span><strong>{copy.integrityDetails.systemScope}</strong><small>{copy.integrityDetails.noOrganization}</small></span>
                )}
              </div>
              <div className="admin-integrity-references">
                {issue.references.length > 0 ? issue.references.map((reference, referenceIndex) => (
                  <AppLink
                    key={`${reference.type}:${reference.id}:${referenceIndex}`}
                    href={activityReferenceUrl(urls.adminOperationsUrl, reference.id)}
                    aria-label={copy.integrityDetails.searchReference(reference.type, reference.id)}
                    title={copy.integrityDetails.searchReferenceTitle(reference.id)}
                  >
                    <span>{copy.entityTypes[reference.type] ?? `${copy.common.entity} · ${reference.type}`}</span>
                    <code>{reference.id}</code>
                  </AppLink>
                )) : <span>{copy.integrityDetails.noReference}</span>}
              </div>
              <div className="admin-integrity-occurrences">
                <strong>{formatNumber(issue.occurrences, intlLocale)}</strong>
                <span>{copy.integrityDetails.occurrences(issue.occurrences)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
      {resource.data && (resource.data.items.length > 0 || cursorHistory.length > 0) && (
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
      )}
    </section>
  );
}
