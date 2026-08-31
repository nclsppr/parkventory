import { Search, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { loadAdminUsers } from "../../api/client";
import { AppLink } from "../../components/AppLink";
import { AdminPager } from "../../components/admin/AdminPager";
import { AdminEmpty, AdminError, AdminLoading } from "../../components/admin/AdminState";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { formatDateTime, formatNumber, formatRole } from "../../components/admin/adminFormat";
import { localizedUrls } from "../../config";
import { useAdminResource } from "../../hooks/useAdminResource";
import { useI18n } from "../../i18n/I18n";
import { adminMessages } from "../../i18n/admin";

function navigateToUsers(baseUrl: string, q: string, tenantId: string) {
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (tenantId) query.set("tenantId", tenantId);
  const serialized = query.toString();
  window.history.pushState({}, "", serialized ? `${baseUrl}?${serialized}` : baseUrl);
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
  const { locale, intlLocale } = useI18n();
  const copy = adminMessages[locale];
  const urls = localizedUrls(locale);
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
    navigateToUsers(urls.adminUsersUrl, input.trim(), tenantId);
  };

  return (
    <section className="admin-page">
      <AdminPageHeader title={copy.users.title} description={copy.users.description} />
      <form className="admin-filter-bar" role="search" onSubmit={submit}>
        <label htmlFor="user-search">{copy.users.searchLabel}</label>
        <div><Search aria-hidden="true" /><input id="user-search" type="search" value={input} onChange={(event) => setInput(event.target.value)} maxLength={100} placeholder={copy.users.searchPlaceholder} /></div>
        <button className="button button-secondary button-small" type="submit">{copy.common.search}</button>
        {query && <button className="admin-clear-filter" type="button" onClick={() => navigateToUsers(urls.adminUsersUrl, "", tenantId)}>{copy.common.clear}</button>}
      </form>
      {tenantId && (
        <div className="admin-active-filter" role="status">
          {copy.users.activeOrganization} : <strong>{activeTenant ? `${activeTenant.name} · ${activeTenant.domain}` : tenantId}</strong>
          <button type="button" onClick={() => navigateToUsers(urls.adminUsersUrl, query, "")} aria-label={copy.users.removeOrganizationFilter}><X aria-hidden="true" /></button>
        </div>
      )}
      {resource.loading && <AdminLoading label={copy.users.loading} />}
      {!resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} />}
      {resource.data && resource.data.items.length === 0 && (
        <AdminEmpty
          title={copy.users.noMatch}
          action={(query || tenantId) ? <button className="button button-secondary button-small" type="button" onClick={() => navigateToUsers(urls.adminUsersUrl, "", "")}>{copy.common.reset}</button> : undefined}
        >{copy.users.noMatchBody}</AdminEmpty>
      )}
      {resource.data && resource.data.items.length > 0 && (
        <>
          {resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title={copy.common.pageChangeFailed} />}
          <div className="admin-table-wrap" aria-busy={resource.refreshing} aria-label={copy.users.tableLabel} role="region" tabIndex={0}>
            <table className="admin-table admin-users-table">
              <caption>{copy.users.caption}</caption>
              <thead><tr><th>{copy.users.user}</th><th>{copy.users.organization}</th><th>{copy.users.role}</th><th>{copy.users.parkingSpace}</th><th>{copy.users.sessions}</th><th>{copy.users.shares}</th><th>{copy.users.bookings}</th><th>{copy.users.lastActivity}</th><th>{copy.users.facts}</th></tr></thead>
              <tbody>{resource.data.items.map((user) => (
                <tr key={user.membershipId}>
                  <th scope="row"><strong>{user.displayName}</strong><span>{user.email ?? copy.common.erasedEmail}</span></th>
                  <td><AppLink href={urls.adminTenantUrl(user.tenant.id)}><strong>{user.tenant.name}</strong><span>{user.tenant.domain}</span></AppLink></td>
                  <td><span className="admin-role">{formatRole(user.role, copy.common.role)}</span></td>
                  <td>{user.spot ? <><strong>{user.spot.label}</strong><span>{user.spot.level}</span></> : "—"}</td>
                  <td>{formatNumber(user.activeSessions, intlLocale)}</td>
                  <td>{formatNumber(user.shares, intlLocale)}</td>
                  <td>{formatNumber(user.reservations, intlLocale)}</td>
                  <td>{formatDateTime(user.lastActivityAt ?? user.lastSessionAt, intlLocale, copy.common.never)}</td>
                  <td><AppLink href={`${urls.adminOperationsUrl}?${new URLSearchParams({ userId: user.id })}`}>{copy.common.activity}</AppLink></td>
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
