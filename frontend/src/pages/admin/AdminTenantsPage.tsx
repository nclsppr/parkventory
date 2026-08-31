import { Search } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { loadAdminTenants } from "../../api/client";
import { AppLink } from "../../components/AppLink";
import { AdminPager } from "../../components/admin/AdminPager";
import { AdminEmpty, AdminError, AdminLoading } from "../../components/admin/AdminState";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { formatDateTime, formatNumber } from "../../components/admin/adminFormat";
import { localizedUrls } from "../../config";
import { useAdminResource } from "../../hooks/useAdminResource";
import { useI18n } from "../../i18n/I18n";
import { adminMessages } from "../../i18n/admin";

function navigateToSearch(baseUrl: string, q: string) {
  const url = new URL(baseUrl, window.location.origin);
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
  const { locale, intlLocale } = useI18n();
  const copy = adminMessages[locale];
  const urls = localizedUrls(locale);
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
    navigateToSearch(urls.adminTenantsUrl, input.trim());
  };

  return (
    <section className="admin-page">
      <AdminPageHeader title={copy.organizations.title} description={copy.organizations.description} />
      <form className="admin-filter-bar" role="search" onSubmit={submit}>
        <label htmlFor="tenant-search">{copy.organizations.searchLabel}</label>
        <div>
          <Search aria-hidden="true" />
          <input id="tenant-search" type="search" value={input} onChange={(event) => setInput(event.target.value)} maxLength={100} placeholder={copy.organizations.searchPlaceholder} />
        </div>
        <button className="button button-secondary button-small" type="submit">{copy.common.search}</button>
        {query && <button className="admin-clear-filter" type="button" onClick={() => navigateToSearch(urls.adminTenantsUrl, "")}>{copy.common.clear}</button>}
      </form>
      {resource.loading && <AdminLoading label={copy.organizations.loading} />}
      {!resource.data && resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} />}
      {resource.data && resource.data.items.length === 0 && (
        <AdminEmpty
          title={query ? copy.organizations.noMatch : copy.organizations.none}
          action={query ? <button className="button button-secondary button-small" type="button" onClick={() => navigateToSearch(urls.adminTenantsUrl, "")}>{copy.common.reset}</button> : undefined}
        >{query ? copy.organizations.noMatchBody : copy.organizations.noneBody}</AdminEmpty>
      )}
      {resource.data && resource.data.items.length > 0 && (
        <>
          {resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title={copy.common.pageChangeFailed} />}
          <div className="admin-table-wrap" aria-busy={resource.refreshing} aria-label={copy.organizations.tableLabel} role="region" tabIndex={0}>
            <table className="admin-table">
              <caption>{query ? copy.organizations.matchingCaption(query) : copy.organizations.allCaption}</caption>
              <thead><tr><th>{copy.organizations.organization}</th><th>{copy.organizations.members}</th><th>{copy.organizations.parkingSpaces}</th><th>{copy.organizations.shares}</th><th>{copy.organizations.bookings}</th><th>{copy.organizations.sessions}</th><th>{copy.organizations.lastActivity}</th></tr></thead>
              <tbody>{resource.data.items.map((tenant) => (
                <tr key={tenant.id}>
                  <th scope="row"><AppLink href={urls.adminTenantUrl(tenant.id)}><strong>{tenant.name}</strong><span>{tenant.domain}</span></AppLink></th>
                  <td>{formatNumber(tenant.memberCount, intlLocale)}</td>
                  <td>{formatNumber(tenant.spotCount, intlLocale)}</td>
                  <td>{formatNumber(tenant.shareCount, intlLocale)}</td>
                  <td>{formatNumber(tenant.reservationCount, intlLocale)}</td>
                  <td>{formatNumber(tenant.activeSessionCount, intlLocale)}</td>
                  <td>{formatDateTime(tenant.lastActivityAt, intlLocale, copy.common.never)}</td>
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
