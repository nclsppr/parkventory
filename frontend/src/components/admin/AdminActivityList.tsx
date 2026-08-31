import type { AdminActivityItem } from "../../types";
import { formatDateTime } from "./adminFormat";

const severityLabels = { INFO: "Information", WARNING: "Avertissement", ERROR: "Erreur" } as const;
const outcomeLabels = { SUCCESS: "Réussi", DENIED: "Refusé", FAILED: "Échoué" } as const;

const knownEventLabels: Record<string, string> = {
  ORGANIZATION_CREATED: "Organisation créée",
  ORGANISATION_CREATED: "Organisation créée",
  MEMBER_CREATED: "Membre inscrit",
  MEMBER_JOINED: "Membre inscrit",
  MEMBER_REGISTERED: "Membre inscrit",
  SESSION_CREATED: "Session ouverte",
  SESSION_OPENED: "Session ouverte",
  SESSION_STARTED: "Session ouverte",
  SESSION_REVOKED: "Session révoquée",
  SPOT_CREATED: "Place déclarée",
  SPOT_DECLARED: "Place déclarée",
  SHARE_CREATED: "Partage publié",
  SHARE_PUBLISHED: "Partage publié",
  SHARE_WITHDRAWN: "Partage retiré",
  RESERVATION_CREATED: "Réservation confirmée",
  RESERVATION_CONFIRMED: "Réservation confirmée",
  RESERVATION_CANCELLED: "Réservation annulée",
  INCIDENT: "Incident détecté",
  INCIDENT_RECORDED: "Incident enregistré",
  ACCESS_DENIED: "Accès refusé",
  GODMODE_ACCESS_DENIED: "Accès opérateur refusé",
  BUSINESS_RULE_REJECTED: "Règle métier refusée",
};

function eventLabel(type: string) {
  if (knownEventLabels[type]) return knownEventLabels[type];
  return type
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminActivityList({
  items,
  compact = false,
}: {
  items: AdminActivityItem[];
  compact?: boolean;
}) {
  return (
    <ol className={`admin-activity-list ${compact ? "admin-activity-list-compact" : ""}`.trim()}>
      {items.map((item) => (
        <li key={item.id}>
          <span className={`admin-severity admin-severity-${item.severity.toLowerCase()}`}>
            {severityLabels[item.severity]}
          </span>
          <div className="admin-activity-copy">
            <strong>{eventLabel(item.type)}</strong>
            <span>
              {outcomeLabels[item.outcome]}
              {item.actor ? ` · ${item.actor.displayName ?? item.actor.email ?? "Acteur inconnu"}` : ""}
              {item.organization ? ` · ${item.organization.name ?? item.organization.domain ?? "Tenant inconnu"}` : ""}
              {item.route ? ` · ${item.route}` : ""}
              {item.errorCode ? ` · ${item.errorCode}` : ""}
            </span>
          </div>
          <time dateTime={new Date(item.occurredAt * 1_000).toISOString()}>
            {formatDateTime(item.occurredAt)}
          </time>
          {!compact && (item.entityId || item.requestId) && (
            <div className="admin-activity-references">
              {item.entityId && <code title={item.entityId}>{item.entityType ?? "Entité"} · {item.entityId}</code>}
              {item.requestId && item.requestId !== item.entityId && <code title={item.requestId}>Requête · {item.requestId}</code>}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
