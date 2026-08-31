import { useCallback, useEffect, useRef, useState } from "react";
import { loadAdminDiagnosticsIntegrity } from "../../api/client";
import { adminOperationsUrl, adminTenantUrl } from "../../config";
import { useAdminResource } from "../../hooks/useAdminResource";
import { AppLink } from "../AppLink";
import { AdminPager } from "./AdminPager";
import { AdminEmpty, AdminError, AdminLoading } from "./AdminState";
import { formatNumber } from "./adminFormat";

function activityReferenceUrl(reference: string) {
  return `${adminOperationsUrl}?${new URLSearchParams({ reference })}`;
}

const diagnosticsUrl = `${adminOperationsUrl}?view=diagnostics`;

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
        <div><h3 id="integrity-details-title" ref={titleRef} tabIndex={-1}>Lignes à examiner</h3><p>{checkLabel}</p></div>
        <AppLink href={diagnosticsUrl}>Fermer le détail</AppLink>
      </header>
      {resource.loading && <AdminLoading label="Chargement des lignes concernées…" />}
      {!resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} />}
      {resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title="Le changement de page a échoué." />}
      {resource.data && resource.data.items.length === 0 && (
        <AdminEmpty title={cursorHistory.length > 0 ? "Cette page ne contient plus de ligne." : "Aucune ligne concernée."}>
          {cursorHistory.length > 0
            ? "Revenez à la page précédente pour poursuivre l’examen."
            : "Le contrôle ne remonte plus d’anomalie à examiner."}
        </AdminEmpty>
      )}
      {resource.data && resource.data.items.length > 0 && (
        <ol className="admin-integrity-results">
          {resource.data.items.map((issue, index) => (
            <li key={`${issue.issueKind}:${issue.organizationId ?? "system"}:${index}`}>
              <span className={`admin-severity ${issue.issueKind === "MISSING" ? "admin-severity-error" : "admin-severity-warning"}`}>
                {issue.issueKind === "MISSING" ? "Manquante" : "Ligne"}
              </span>
              <div className="admin-integrity-scope">
                {issue.organizationId ? (
                  <AppLink
                    href={adminTenantUrl(issue.organizationId)}
                    aria-label={`Ouvrir le tenant ${issue.organizationId}`}
                    title={`Ouvrir le tenant ${issue.organizationId}`}
                  >
                    <strong>Tenant</strong>
                    <code>{issue.organizationId}</code>
                  </AppLink>
                ) : (
                  <span><strong>Portée système</strong><small>Aucun tenant associé</small></span>
                )}
              </div>
              <div className="admin-integrity-references">
                {issue.references.length > 0 ? issue.references.map((reference, referenceIndex) => (
                  <AppLink
                    key={`${reference.type}:${reference.id}:${referenceIndex}`}
                    href={activityReferenceUrl(reference.id)}
                    aria-label={`Rechercher la référence ${reference.type} ${reference.id} dans le journal`}
                    title={`Rechercher la référence ${reference.id} dans le journal`}
                  >
                    <span>{reference.type}</span>
                    <code>{reference.id}</code>
                  </AppLink>
                )) : <span>Aucune référence associée</span>}
              </div>
              <div className="admin-integrity-occurrences">
                <strong>{formatNumber(issue.occurrences)}</strong>
                <span>occurrence{issue.occurrences === 1 ? "" : "s"}</span>
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
