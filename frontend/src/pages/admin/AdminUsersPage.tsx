import { Search, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { loadAdminUsers } from "../../api/client";
import { AppLink } from "../../components/AppLink";
import { AdminPager } from "../../components/admin/AdminPager";
import { AdminEmpty, AdminError, AdminLoading } from "../../components/admin/AdminState";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { formatDateTime, formatNumber, formatRole } from "../../components/admin/adminFormat";
import { adminOperationsUrl, adminTenantUrl, adminUsersUrl } from "../../config";
import { useAdminResource } from "../../hooks/useAdminResource";

function navigateToUsers(q: string, tenantId: string) {
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (tenantId) query.set("tenantId", tenantId);
  const serialized = query.toString();
  window.history.pushState({}, "", serialized ? `${adminUsersUrl}?${serialized}` : adminUsersUrl);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function AdminUsersPage({
  search,
  onSessionExpired,
  onForbidden,
}: {
  search: string;
  onSessionExpired: () => void;
  onForbidden: () => void;
}) {
  const parameters = new URLSearchParams(search);
  const query = parameters.get("q")?.trim() ?? "";
  const tenantId = parameters.get("tenantId")?.trim() ?? "";
  const [input, setInput] = useState(query);
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  useEffect(() => {
    setInput(query);
    setCursor(undefined);
    setCursorHistory([]);
  }, [query, tenantId]);
  const loader = useCallback(() => loadAdminUsers({ limit: 25, cursor, q: query || undefined, tenantId: tenantId || undefined }), [cursor, query, tenantId]);
  const resource = useAdminResource(loader, [loader], onSessionExpired, onForbidden);
  const activeTenant = resource.data?.items.find((item) => item.tenant.id === tenantId)?.tenant;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigateToUsers(input.trim(), tenantId);
  };

  return (
    <section className="admin-page">
      <AdminPageHeader title="Utilisateurs" description="Comptes clients, rattachements, activité et sessions en cours. Le compte système est exclu." />
      <form className="admin-filter-bar" role="search" onSubmit={submit}>
        <label htmlFor="user-search">Rechercher un utilisateur</label>
        <div><Search aria-hidden="true" /><input id="user-search" type="search" value={input} onChange={(event) => setInput(event.target.value)} maxLength={100} placeholder="Nom ou adresse e-mail" /></div>
        <button className="button button-secondary button-small" type="submit">Rechercher</button>
        {query && <button className="admin-clear-filter" type="button" onClick={() => navigateToUsers("", tenantId)}>Effacer</button>}
      </form>
      {tenantId && (
        <div className="admin-active-filter" role="status">
          Tenant : <strong>{activeTenant ? `${activeTenant.name} · ${activeTenant.domain}` : tenantId}</strong>
          <button type="button" onClick={() => navigateToUsers(query, "")} aria-label="Retirer le filtre tenant"><X aria-hidden="true" /></button>
        </div>
      )}
      {resource.loading && <AdminLoading label="Chargement des utilisateurs…" />}
      {!resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} />}
      {resource.data && resource.data.items.length === 0 && (
        <AdminEmpty
          title="Aucun utilisateur correspondant."
          action={(query || tenantId) ? <button className="button button-secondary button-small" type="button" onClick={() => navigateToUsers("", "")}>Réinitialiser</button> : undefined}
        >Modifiez la recherche ou retirez le filtre tenant.</AdminEmpty>
      )}
      {resource.data && resource.data.items.length > 0 && (
        <>
          {resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title="Le changement de page a échoué." />}
          <div className="admin-table-wrap" aria-busy={resource.refreshing} aria-label="Table des utilisateurs, défilement horizontal" role="region" tabIndex={0}>
            <table className="admin-table admin-users-table">
              <caption>Utilisateurs clients du réseau Parkventory</caption>
              <thead><tr><th>Utilisateur</th><th>Tenant</th><th>Rôle</th><th>Place</th><th>Sessions</th><th>Partages</th><th>Réservations</th><th>Dernière activité</th><th>Faits</th></tr></thead>
              <tbody>{resource.data.items.map((user) => (
                <tr key={user.membershipId}>
                  <th scope="row"><strong>{user.displayName}</strong><span>{user.email}</span></th>
                  <td><AppLink href={adminTenantUrl(user.tenant.id)}><strong>{user.tenant.name}</strong><span>{user.tenant.domain}</span></AppLink></td>
                  <td><span className="admin-role">{formatRole(user.role)}</span></td>
                  <td>{user.spot ? <><strong>{user.spot.label}</strong><span>{user.spot.level}</span></> : "—"}</td>
                  <td>{formatNumber(user.activeSessions)}</td>
                  <td>{formatNumber(user.shares)}</td>
                  <td>{formatNumber(user.reservations)}</td>
                  <td>{formatDateTime(user.lastActivityAt ?? user.lastSessionAt)}</td>
                  <td><AppLink href={`${adminOperationsUrl}?${new URLSearchParams({ userId: user.id })}`}>Activité</AppLink></td>
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
