import { ArrowLeft, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError, loadAdminTenant, updateAdminTenantMemberRole } from "../../api/client";
import { AppLink } from "../../components/AppLink";
import { AdminActivityList } from "../../components/admin/AdminActivityList";
import { AdminEmpty, AdminError, AdminLoading } from "../../components/admin/AdminState";
import { AdminMetricBand, AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { formatDateTime, formatNumber, formatRole } from "../../components/admin/adminFormat";
import { adminOperationsUrl, adminTenantsUrl, adminUsersUrl } from "../../config";
import { useAdminResource } from "../../hooks/useAdminResource";

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
  const loader = useCallback(() => loadAdminTenant(tenantId), [tenantId]);
  const resource = useAdminResource(loader, [loader], onSessionExpired, onForbidden);
  const usersUrl = filteredUrl(adminUsersUrl, "tenantId", tenantId);
  const activityUrl = filteredUrl(adminOperationsUrl, "tenantId", tenantId);
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
      else setRoleError(error instanceof Error ? error.message : "Le rôle n’a pas pu être modifié.");
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
      <AppLink className="admin-back-link" href={adminTenantsUrl}><ArrowLeft aria-hidden="true" /> Tous les tenants</AppLink>
      {resource.loading && <AdminLoading label="Chargement du tenant…" />}
      {!resource.data && resource.error && (
        resource.error instanceof ApiError && resource.error.status === 404
          ? <AdminEmpty title="Tenant introuvable.">Il a peut-être été supprimé ou le lien est incomplet.</AdminEmpty>
          : <AdminError error={resource.error} onRetry={() => void resource.reload()} />
      )}
      {resource.data && (
        <>
          <AdminPageHeader
            title={resource.data.tenant.name}
            description={`${resource.data.tenant.domain} · créé le ${formatDateTime(resource.data.tenant.createdAt)}`}
            actions={<AppLink className="button button-secondary button-small" href={activityUrl}>Voir l’activité <ExternalLink aria-hidden="true" /></AppLink>}
          />
          {resource.error && <AdminError error={resource.error} onRetry={() => void resource.reload()} title="L’actualisation a échoué." />}
          <AdminMetricBand
            label={`Indicateurs de ${resource.data.tenant.name}`}
            items={[
              { label: "Utilisateurs", value: formatNumber(resource.data.stats.users), href: usersUrl, detail: "Ouvrir la liste filtrée" },
              { label: "Places", value: formatNumber(resource.data.stats.parkingSpots) },
              { label: "Partages", value: formatNumber(resource.data.stats.shares), href: activityUrl, detail: "Voir les faits du tenant" },
              { label: "Réservations", value: formatNumber(resource.data.stats.reservations), href: activityUrl, detail: "Voir les faits du tenant" },
              { label: "Sessions actives", value: formatNumber(resource.data.stats.activeSessions), href: usersUrl },
            ]}
          />
          <div className="admin-tenant-grid">
            <section className="admin-panel admin-tenant-identity" aria-labelledby="tenant-identity-title">
              <header><div><h2 id="tenant-identity-title">Configuration</h2><p>Identité et présentation du tenant</p></div></header>
              <dl>
                <div><dt>Nom</dt><dd>{resource.data.tenant.name}</dd></div>
                <div><dt>Domaine</dt><dd>{resource.data.tenant.domain}</dd></div>
                <div><dt>Co-marque</dt><dd>{resource.data.tenant.branding?.enabled ? "Activée" : "Parkventory par défaut"}</dd></div>
                {resource.data.tenant.branding?.enabled && <div><dt>Nom affiché</dt><dd>{resource.data.tenant.branding.companyName}</dd></div>}
              </dl>
            </section>
            <section className="admin-panel" aria-labelledby="tenant-activity-title">
              <header>
                <div><h2 id="tenant-activity-title">Activité récente</h2><p>Événements rattachés à ce tenant</p></div>
                <AppLink href={activityUrl}>Tout voir</AppLink>
              </header>
              {resource.data.recentActivity.length
                ? <AdminActivityList items={resource.data.recentActivity} compact />
                : <AdminEmpty title="Aucun événement récent.">L’activité de ce tenant apparaîtra ici.</AdminEmpty>}
            </section>
          </div>
          <section className="admin-panel admin-tenant-facts" aria-labelledby="tenant-members-title">
            <header>
              <div><h2 id="tenant-members-title">Membres récents</h2><p>Comptes les plus récemment rattachés au tenant</p></div>
              <AppLink href={usersUrl}>Liste filtrée</AppLink>
            </header>
            {roleError && <div className="admin-inline-error" role="alert">{roleError}</div>}
            {resource.data.recentMembers.length ? (
              <div className="admin-table-wrap" aria-label="Table des membres récents, défilement horizontal" role="region" tabIndex={0}>
                <table className="admin-table">
                  <caption>Membres récents de {resource.data.tenant.name}</caption>
                  <thead><tr><th>Membre</th><th>Rôle</th><th>Inscription</th><th>Sessions</th><th>Dernière activité</th><th>Faits</th></tr></thead>
                  <tbody>{resource.data.recentMembers.map((member) => (
                    <tr key={member.membershipId}>
                      <th scope="row"><strong>{member.displayName}</strong><span>{member.email ?? "E-mail effacé"}</span></th>
                      <td>
                        <span className="admin-role">{formatRole(member.role)}</span>
                        {member.emailErasedAt === null && (
                          roleTarget?.membershipId === member.membershipId ? (
                            <span className="admin-role-confirm">
                              <button type="button" onClick={() => void confirmRole()} disabled={roleBusy}>Confirmer</button>
                              <button type="button" onClick={() => setRoleTarget(null)} disabled={roleBusy}>Annuler</button>
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
                              {member.role === "ADMIN" ? "Retirer l’accès admin" : "Nommer admin du tenant"}
                            </button>
                          )
                        )}
                      </td>
                      <td>{formatDateTime(member.createdAt)}</td>
                      <td>{formatNumber(member.activeSessions)}</td>
                      <td>{formatDateTime(member.lastActivityAt)}</td>
                      <td><AppLink href={filteredUrl(adminOperationsUrl, "userId", member.userId)}>Activité</AppLink></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <AdminEmpty title="Aucun membre récent.">Les membres rattachés apparaîtront ici.</AdminEmpty>}
          </section>
          <section className="admin-panel admin-tenant-facts" aria-labelledby="tenant-spots-title">
            <header><div><h2 id="tenant-spots-title">Places récentes</h2><p>Inventaire, propriétaires et utilisation observée</p></div><AppLink href={usersUrl}>Inventaire complet</AppLink></header>
            {resource.data.recentSpots.length ? (
              <div className="admin-table-wrap" aria-label="Table des places récentes, défilement horizontal" role="region" tabIndex={0}>
                <table className="admin-table">
                  <caption>Places récentes de {resource.data.tenant.name}</caption>
                  <thead><tr><th>Place</th><th>Propriétaire</th><th>Création</th><th>Partages</th><th>Réservations</th></tr></thead>
                  <tbody>{resource.data.recentSpots.map((spot) => (
                    <tr key={spot.id}>
                      <th scope="row"><strong>{spot.label}</strong><span>{spot.level} · {spot.timeZone}</span></th>
                      <td><strong>{spot.owner.displayName}</strong><span>{spot.owner.email ?? "E-mail effacé"}</span></td>
                      <td>{formatDateTime(spot.createdAt)}</td>
                      <td>{formatNumber(spot.shares)}</td>
                      <td>{formatNumber(spot.reservations)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <AdminEmpty title="Aucune place récente.">Les places déclarées apparaîtront ici.</AdminEmpty>}
          </section>
        </>
      )}
    </section>
  );
}
