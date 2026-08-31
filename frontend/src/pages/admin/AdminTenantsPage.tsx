import { Search } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { loadAdminTenants } from "../../api/client";
import { AppLink } from "../../components/AppLink";
import { AdminPager } from "../../components/admin/AdminPager";
import { AdminEmpty, AdminError, AdminLoading } from "../../components/admin/AdminState";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { formatDateTime, formatNumber } from "../../components/admin/adminFormat";
import { adminTenantUrl, adminTenantsUrl } from "../../config";
import { useAdminResource } from "../../hooks/useAdminResource";

function navigateToSearch(q: string) {
  const url = new URL(adminTenantsUrl, window.location.origin);
  if (q) url.searchParams.set("q", q);
  window.history.pushState({}, "", `${url.pathname}${url.search}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function AdminTenantsPage({
  search,
  onSessionExpired,
  onForbidden,
}: {
  search: string;
  onSessionExpired: () => void;
  onForbidden: () => void;
}) {
  const query = new URLSearchParams(search).get("q")?.trim() ?? "";
  const [input, setInput] = useState(query);
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  useEffect(() => {
    setInput(query);
    setCursor(undefined);
    setCursorHistory([]);
  }, [query]);
  const loader = useCallback(() => loadAdminTenants({ limit: 25, cursor, q: query || undefined }), [cursor, query]);
  const resource = useAdminResource(loader, [loader], onSessionExpired, onForbidden);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigateToSearch(input.trim());
  };

  return (
    <section className="admin-page">
      <AdminPageHeader title="Tenants" description="Organisations clientes, adoption et activité opérationnelle." />
      <form className="admin-filter-bar" role="search" onSubmit={submit}>
        <label htmlFor="tenant-search">Rechercher un tenant</label>
        <div>
          <Search aria-hidden="true" />
          <input id="tenant-search" type="search" value={input} onChange={(event) => setInput(event.target.value)} maxLength={100} placeholder="Nom ou domaine" />
        </div>
        <button className="button button-secondary button-small" type="submit">Rechercher</button>
        {query && <button className="admin-clear-filter" type="button" onClick={() => navigateToSearch("")}>Effacer</button>}
      </form>
      {resource.loading && <AdminLoading label="Chargement des tenants…" />}
      {!resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} />}
      {resource.data && resource.data.items.length === 0 && (
        <AdminEmpty
          title={query ? "Aucun tenant correspondant." : "Aucun tenant enregistré."}
          action={query ? <button className="button button-secondary button-small" type="button" onClick={() => navigateToSearch("")}>Réinitialiser</button> : undefined}
        >{query ? "Essayez un nom ou un domaine différent." : "Les nouveaux tenants apparaîtront ici."}</AdminEmpty>
      )}
      {resource.data && resource.data.items.length > 0 && (
        <>
          {resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title="Le changement de page a échoué." />}
          <div className="admin-table-wrap" aria-busy={resource.refreshing} aria-label="Table des tenants, défilement horizontal" role="region" tabIndex={0}>
            <table className="admin-table">
              <caption>{query ? `Tenants correspondant à « ${query} »` : "Tous les tenants clients"}</caption>
              <thead><tr><th>Tenant</th><th>Membres</th><th>Places</th><th>Partages</th><th>Réservations</th><th>Sessions</th><th>Dernière activité</th></tr></thead>
              <tbody>{resource.data.items.map((tenant) => (
                <tr key={tenant.id}>
                  <th scope="row"><AppLink href={adminTenantUrl(tenant.id)}><strong>{tenant.name}</strong><span>{tenant.domain}</span></AppLink></th>
                  <td>{formatNumber(tenant.memberCount)}</td>
                  <td>{formatNumber(tenant.spotCount)}</td>
                  <td>{formatNumber(tenant.shareCount)}</td>
                  <td>{formatNumber(tenant.reservationCount)}</td>
                  <td>{formatNumber(tenant.activeSessionCount)}</td>
                  <td>{formatDateTime(tenant.lastActivityAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
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
