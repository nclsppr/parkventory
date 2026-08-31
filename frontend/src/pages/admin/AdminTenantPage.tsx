import { ArrowLeft, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError, loadAdminTenant, updateAdminTenantMemberRole } from "../../api/client";
import { AppLink } from "../../components/AppLink";
import { AdminActivityList } from "../../components/admin/AdminActivityList";
import { AdminEmpty, AdminError, AdminLoading } from "../../components/admin/AdminState";
import { AdminMetricBand, AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { formatDateTime, formatNumber, formatRole } from "../../components/admin/adminFormat";
import { localizedUrls } from "../../config";
import { useAdminResource } from "../../hooks/useAdminResource";
import { useI18n } from "../../i18n/I18n";
import { adminMessages } from "../../i18n/admin";

function filteredUrl(path: string, key: string, value: string) {
  const query = new URLSearchParams({ [key]: value });
  return `${path}?${query}`;
}

export function AdminTenantPage({
  tenantId,
  onSessionExpired,
  onForbidden,
}: {
  tenantId: string;
  onSessionExpired: () => void;
  onForbidden: () => void;
}) {
  const { locale, intlLocale } = useI18n();
  const copy = adminMessages[locale];
  const urls = localizedUrls(locale);
  const loader = useCallback(() => loadAdminTenant(tenantId), [tenantId]);
  const resource = useAdminResource(loader, [loader], onSessionExpired, onForbidden);
  const usersUrl = filteredUrl(urls.adminUsersUrl, "tenantId", tenantId);
  const activityUrl = filteredUrl(urls.adminOperationsUrl, "tenantId", tenantId);
  const [roleTarget, setRoleTarget] = useState<{ membershipId: string; role: "MEMBER" | "ADMIN" } | null>(null);
  const [roleBusy, setRoleBusy] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const confirmRole = async () => {
    if (!roleTarget || roleBusy) return;
    setRoleBusy(true);
    setRoleError(null);
    try {
      await updateAdminTenantMemberRole(tenantId, roleTarget.membershipId, roleTarget.role);
      setRoleTarget(null);
      await resource.reload();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onSessionExpired();
      else if (error instanceof ApiError && error.status === 403) onForbidden();
      else setRoleError(error instanceof Error ? error.message : copy.organization.roleUpdateFailed);
    } finally {
      setRoleBusy(false);
    }
  };

  useEffect(() => {
    if (!resource.data) return;
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("#admin-content h1")?.focus({ preventScroll: true });
    });
  }, [resource.data]);

  return (
    <section className="admin-page">
      <AppLink className="admin-back-link" href={urls.adminTenantsUrl}><ArrowLeft aria-hidden="true" /> {copy.organization.back}</AppLink>
      {resource.loading && <AdminLoading label={copy.organization.loading} />}
      {!resource.data && resource.error && (
        resource.error instanceof ApiError && resource.error.status === 404
          ? <AdminEmpty title={copy.organization.notFound}>{copy.organization.notFoundBody}</AdminEmpty>
          : <AdminError error={resource.error} onRetry={() => void resource.reload()} />
      )}
      {resource.data && (
        <>
          <AdminPageHeader
            title={resource.data.tenant.name}
            description={copy.organization.created(resource.data.tenant.domain, formatDateTime(resource.data.tenant.createdAt, intlLocale, copy.common.never))}
            actions={<AppLink className="button button-secondary button-small" href={activityUrl}>{copy.organization.viewActivity} <ExternalLink aria-hidden="true" /></AppLink>}
          />
          {resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title={copy.common.refreshFailed} />}
          <AdminMetricBand
            label={copy.organization.metricsLabel(resource.data.tenant.name)}
            items={[
              { label: copy.organization.users, value: formatNumber(resource.data.stats.users, intlLocale), href: usersUrl, detail: copy.organization.openFilteredUsers },
              { label: copy.organization.parkingSpaces, value: formatNumber(resource.data.stats.parkingSpots, intlLocale) },
              { label: copy.organization.shares, value: formatNumber(resource.data.stats.shares, intlLocale), href: activityUrl, detail: copy.organization.viewOrganizationEvents },
              { label: copy.organization.bookings, value: formatNumber(resource.data.stats.reservations, intlLocale), href: activityUrl, detail: copy.organization.viewOrganizationEvents },
              { label: copy.organization.activeSessions, value: formatNumber(resource.data.stats.activeSessions, intlLocale), href: usersUrl },
            ]}
          />
          <div className="admin-tenant-grid">
            <section className="admin-panel admin-tenant-identity" aria-labelledby="tenant-identity-title">
              <header><div><h2 id="tenant-identity-title">{copy.organization.configuration}</h2><p>{copy.organization.configurationSubtitle}</p></div></header>
              <dl>
                <div><dt>{copy.organization.name}</dt><dd>{resource.data.tenant.name}</dd></div>
                <div><dt>{copy.organization.domain}</dt><dd>{resource.data.tenant.domain}</dd></div>
                <div><dt>{copy.organization.cobranded}</dt><dd>{resource.data.tenant.branding?.enabled ? copy.organization.enabled : copy.organization.parkventoryDefault}</dd></div>
                {resource.data.tenant.branding?.enabled && <div><dt>{copy.organization.displayName}</dt><dd>{resource.data.tenant.branding.companyName}</dd></div>}
              </dl>
            </section>
            <section className="admin-panel" aria-labelledby="tenant-activity-title">
              <header>
                <div><h2 id="tenant-activity-title">{copy.organization.recentActivity}</h2><p>{copy.organization.organizationEvents}</p></div>
                <AppLink href={activityUrl}>{copy.common.viewAll}</AppLink>
              </header>
              {resource.data.recentActivity.length
                ? <AdminActivityList items={resource.data.recentActivity} compact />
                : <AdminEmpty title={copy.organization.noRecentEvent}>{copy.organization.noRecentEventBody}</AdminEmpty>}
            </section>
          </div>
          <section className="admin-panel admin-tenant-facts" aria-labelledby="tenant-members-title">
            <header>
              <div><h2 id="tenant-members-title">{copy.organization.recentMembers}</h2><p>{copy.organization.recentMembersSubtitle}</p></div>
              <AppLink href={usersUrl}>{copy.organization.filteredList}</AppLink>
            </header>
            {roleError && <div className="admin-inline-error" role="alert">{roleError}</div>}
            {resource.data.recentMembers.length ? (
              <div className="admin-table-wrap" aria-label={copy.organization.membersTableLabel} role="region" tabIndex={0}>
                <table className="admin-table">
                  <caption>{copy.organization.membersCaption(resource.data.tenant.name)}</caption>
                  <thead><tr><th>{copy.organization.member}</th><th>{copy.organization.role}</th><th>{copy.organization.registered}</th><th>{copy.organization.sessions}</th><th>{copy.organization.lastActivity}</th><th>{copy.organization.facts}</th></tr></thead>
                  <tbody>{resource.data.recentMembers.map((member) => (
                    <tr key={member.membershipId}>
                      <th scope="row"><strong>{member.displayName}</strong><span>{member.email ?? copy.common.erasedEmail}</span></th>
                      <td>
                        <span className="admin-role">{formatRole(member.role, copy.common.role)}</span>
                        {member.emailErasedAt === null && (
                          roleTarget?.membershipId === member.membershipId ? (
                            <span className="admin-role-confirm">
                              <button type="button" onClick={() => void confirmRole()} disabled={roleBusy}>{copy.organization.confirm}</button>
                              <button type="button" onClick={() => setRoleTarget(null)} disabled={roleBusy}>{copy.organization.cancel}</button>
                            </span>
                          ) : (
                            <button
                              className="admin-role-action"
                              type="button"
                              onClick={() => setRoleTarget({
                                membershipId: member.membershipId,
                                role: member.role === "ADMIN" ? "MEMBER" : "ADMIN",
                              })}
                            >
                              {member.role === "ADMIN" ? copy.organization.removeAdmin : copy.organization.appointAdmin}
                            </button>
                          )
                        )}
                      </td>
                      <td>{formatDateTime(member.createdAt, intlLocale, copy.common.never)}</td>
                      <td>{formatNumber(member.activeSessions, intlLocale)}</td>
                      <td>{formatDateTime(member.lastActivityAt, intlLocale, copy.common.never)}</td>
                      <td><AppLink href={filteredUrl(urls.adminOperationsUrl, "userId", member.userId)}>{copy.common.activity}</AppLink></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <AdminEmpty title={copy.organization.noRecentMember}>{copy.organization.noRecentMemberBody}</AdminEmpty>}
          </section>
          <section className="admin-panel admin-tenant-facts" aria-labelledby="tenant-spots-title">
            <header><div><h2 id="tenant-spots-title">{copy.organization.recentSpaces}</h2><p>{copy.organization.recentSpacesSubtitle}</p></div><AppLink href={usersUrl}>{copy.organization.fullInventory}</AppLink></header>
            {resource.data.recentSpots.length ? (
              <div className="admin-table-wrap" aria-label={copy.organization.spacesTableLabel} role="region" tabIndex={0}>
                <table className="admin-table">
                  <caption>{copy.organization.spacesCaption(resource.data.tenant.name)}</caption>
                  <thead><tr><th>{copy.organization.parkingSpace}</th><th>{copy.organization.owner}</th><th>{copy.organization.createdAt}</th><th>{copy.organization.shares}</th><th>{copy.organization.bookings}</th></tr></thead>
                  <tbody>{resource.data.recentSpots.map((spot) => (
                    <tr key={spot.id}>
                      <th scope="row"><strong>{spot.label}</strong><span>{spot.level} · {spot.timeZone}</span></th>
                      <td><strong>{spot.owner.displayName}</strong><span>{spot.owner.email ?? copy.common.erasedEmail}</span></td>
                      <td>{formatDateTime(spot.createdAt, intlLocale, copy.common.never)}</td>
                      <td>{formatNumber(spot.shares, intlLocale)}</td>
                      <td>{formatNumber(spot.reservations, intlLocale)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <AdminEmpty title={copy.organization.noRecentSpace}>{copy.organization.noRecentSpaceBody}</AdminEmpty>}
          </section>
        </>
      )}
    </section>
  );
}
