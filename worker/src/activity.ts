import type { Bindings } from "./types";

export type ActivitySeverity = "INFO" | "WARNING" | "ERROR";
export type ActivityOutcome = "SUCCESS" | "DENIED" | "FAILED";

export interface ActivityEventInput {
  eventType: string;
  occurredAt: number;
  severity?: ActivitySeverity;
  outcome?: ActivityOutcome;
  organizationId?: string | null;
  userId?: string | null;
  membershipId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  requestId?: string | null;
  route?: string | null;
  errorCode?: string | null;
  dedupeWindowSeconds?: number;
}

export async function recordActivityEvent(
  database: Bindings["DB"],
  event: ActivityEventInput,
): Promise<void> {
  const dedupeWindowSeconds = Math.max(0, Math.floor(event.dedupeWindowSeconds ?? 0));
  await database.prepare(`
    INSERT INTO activity_event (
      id, event_type, occurred_at, severity, outcome,
      organization_id, user_id, membership_id,
      entity_type, entity_id, request_id, route, error_code, source
    ) SELECT
      ?1, ?2, ?3, ?4, ?5,
      ?6, ?7, ?8,
      ?9, ?10, ?11, ?12, ?13, 'WORKER'
    WHERE ?14 = 0 OR NOT EXISTS (
      SELECT 1
      FROM activity_event existing
      WHERE existing.event_type = ?2
        AND existing.membership_id IS ?8
        AND existing.route IS ?12
        AND existing.error_code IS ?13
        AND existing.occurred_at >= ?3 - ?14
    )
  `).bind(
    `evt_${crypto.randomUUID().replaceAll("-", "")}`,
    event.eventType,
    event.occurredAt,
    event.severity ?? "INFO",
    event.outcome ?? "SUCCESS",
    event.organizationId ?? null,
    event.userId ?? null,
    event.membershipId ?? null,
    event.entityType ?? null,
    event.entityId ?? null,
    event.requestId ?? null,
    event.route ?? null,
    event.errorCode ?? null,
    dedupeWindowSeconds,
  ).run();
}
