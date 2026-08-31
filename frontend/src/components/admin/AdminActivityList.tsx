import type { AdminActivityItem } from "../../types";
import { useI18n } from "../../i18n/I18n";
import { adminMessages } from "../../i18n/admin";
import { formatDateTime } from "./adminFormat";

export function AdminActivityList({
  items,
  compact = false,
}: {
  items: AdminActivityItem[];
  compact?: boolean;
}) {
  const { locale, intlLocale } = useI18n();
  const copy = adminMessages[locale];

  return (
    <ol className={`admin-activity-list ${compact ? "admin-activity-list-compact" : ""}`.trim()}>
      {items.map((item) => (
        <li key={item.id}>
          <span className={`admin-severity admin-severity-${item.severity.toLowerCase()}`}>
            {copy.common.severity[item.severity]}
          </span>
          <div className="admin-activity-copy">
            <strong>{copy.eventTypes[item.type] ?? copy.activity.unknownEvent(item.type)}</strong>
            <span>
              {copy.common.outcome[item.outcome]}
              {item.actor ? ` · ${item.actor.displayName ?? item.actor.email ?? copy.common.unknownActor}` : ""}
              {item.organization ? ` · ${item.organization.name ?? item.organization.domain ?? copy.common.unknownOrganization}` : ""}
              {item.route ? ` · ${item.route}` : ""}
              {item.errorCode ? ` · ${item.errorCode}` : ""}
            </span>
          </div>
          <time dateTime={new Date(item.occurredAt * 1_000).toISOString()}>
            {formatDateTime(item.occurredAt, intlLocale, copy.common.never)}
          </time>
          {!compact && (item.entityId || item.requestId) && (
            <div className="admin-activity-references">
              {item.entityId && <code title={item.entityId}>{item.entityType ? (copy.entityTypes[item.entityType] ?? `${copy.common.entity} · ${item.entityType}`) : copy.common.entity} · {item.entityId}</code>}
              {item.requestId && item.requestId !== item.entityId && <code title={item.requestId}>{copy.common.request} · {item.requestId}</code>}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
