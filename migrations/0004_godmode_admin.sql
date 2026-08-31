ALTER TABLE organization
  ADD COLUMN kind TEXT NOT NULL DEFAULT 'TENANT'
    CHECK (kind IN ('TENANT', 'SYSTEM'));

INSERT INTO organization (
  id,
  normalized_domain,
  display_name,
  created_at,
  kind
) VALUES (
  'org_system_parkventory',
  'system.parkventory.invalid',
  'Parkventory',
  unixepoch(),
  'SYSTEM'
);

CREATE UNIQUE INDEX one_system_organization
  ON organization(kind)
  WHERE kind = 'SYSTEM';

CREATE TRIGGER system_organization_identity_insert
BEFORE INSERT ON organization
WHEN NEW.kind = 'SYSTEM' AND (
  NEW.id <> 'org_system_parkventory'
  OR NEW.normalized_domain <> 'system.parkventory.invalid'
)
BEGIN
  SELECT RAISE(ABORT, 'system_organization_identity_invalid');
END;

CREATE TRIGGER system_organization_identity_update
BEFORE UPDATE OF id, normalized_domain, kind ON organization
WHEN (
  OLD.id = 'org_system_parkventory'
  OR OLD.kind = 'SYSTEM'
  OR NEW.id = 'org_system_parkventory'
  OR NEW.kind = 'SYSTEM'
) AND (
  NEW.id <> 'org_system_parkventory'
  OR NEW.normalized_domain <> 'system.parkventory.invalid'
  OR NEW.kind <> 'SYSTEM'
)
BEGIN
  SELECT RAISE(ABORT, 'system_organization_identity_invalid');
END;

CREATE TRIGGER system_organization_required
BEFORE DELETE ON organization
WHEN OLD.kind = 'SYSTEM'
BEGIN
  SELECT RAISE(ABORT, 'system_organization_required');
END;

CREATE UNIQUE INDEX one_system_membership
  ON membership(organization_id)
  WHERE organization_id = 'org_system_parkventory';

CREATE TRIGGER system_membership_requires_admin_insert
BEFORE INSERT ON membership
WHEN NEW.role <> 'ADMIN' AND EXISTS (
  SELECT 1
  FROM organization
  WHERE organization.id = NEW.organization_id
    AND organization.kind = 'SYSTEM'
)
BEGIN
  SELECT RAISE(ABORT, 'system_membership_requires_admin');
END;

CREATE TRIGGER system_membership_requires_admin_update
BEFORE UPDATE OF organization_id, role ON membership
WHEN NEW.role <> 'ADMIN' AND EXISTS (
  SELECT 1
  FROM organization
  WHERE organization.id = NEW.organization_id
    AND organization.kind = 'SYSTEM'
)
BEGIN
  SELECT RAISE(ABORT, 'system_membership_requires_admin');
END;

CREATE INDEX organization_kind_created_idx
  ON organization(kind, created_at DESC, id DESC);
CREATE INDEX user_account_created_idx
  ON user_account(created_at DESC, id DESC);
CREATE INDEX membership_org_created_idx
  ON membership(organization_id, created_at DESC, id DESC);
CREATE INDEX membership_user_idx
  ON membership(user_id, organization_id);
CREATE INDEX parking_spot_org_created_idx
  ON parking_spot(organization_id, created_at DESC, id DESC);
CREATE INDEX availability_org_created_idx
  ON availability_offer(organization_id, created_at DESC, id DESC);
CREATE INDEX availability_spot_active_window_idx
  ON availability_offer(parking_spot_id, starts_at, ends_at, id)
  WHERE status = 'PUBLISHED';
CREATE INDEX reservation_org_created_idx
  ON reservation(organization_id, created_at DESC, id DESC);
CREATE INDEX app_session_created_idx
  ON app_session(created_at DESC, id DESC);

CREATE TABLE activity_event (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL
    CHECK (length(event_type) BETWEEN 3 AND 80),
  occurred_at INTEGER NOT NULL CHECK (occurred_at >= 0),
  severity TEXT NOT NULL DEFAULT 'INFO'
    CHECK (severity IN ('INFO', 'WARNING', 'ERROR')),
  outcome TEXT NOT NULL DEFAULT 'SUCCESS'
    CHECK (outcome IN ('SUCCESS', 'DENIED', 'FAILED')),
  organization_id TEXT REFERENCES organization(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES user_account(id) ON DELETE SET NULL,
  membership_id TEXT REFERENCES membership(id) ON DELETE SET NULL,
  entity_type TEXT
    CHECK (entity_type IS NULL OR length(entity_type) BETWEEN 2 AND 40),
  entity_id TEXT
    CHECK (entity_id IS NULL OR length(entity_id) BETWEEN 1 AND 160),
  request_id TEXT
    CHECK (request_id IS NULL OR length(request_id) BETWEEN 8 AND 80),
  route TEXT
    CHECK (route IS NULL OR (length(route) BETWEEN 1 AND 160 AND substr(route, 1, 1) = '/')),
  error_code TEXT
    CHECK (error_code IS NULL OR length(error_code) BETWEEN 2 AND 80),
  source TEXT NOT NULL DEFAULT 'TRIGGER'
    CHECK (source IN ('BACKFILL', 'TRIGGER', 'WORKER'))
) STRICT;

CREATE INDEX activity_event_time_idx
  ON activity_event(occurred_at DESC, id DESC);
CREATE INDEX activity_event_org_time_idx
  ON activity_event(organization_id, occurred_at DESC, id DESC);
CREATE INDEX activity_event_user_time_idx
  ON activity_event(user_id, occurred_at DESC, id DESC);
CREATE INDEX activity_event_membership_time_idx
  ON activity_event(membership_id, occurred_at DESC, id DESC);
CREATE INDEX activity_event_type_time_idx
  ON activity_event(event_type, occurred_at DESC, id DESC);
CREATE INDEX activity_event_severity_time_idx
  ON activity_event(severity, occurred_at DESC, id DESC)
  WHERE severity IN ('WARNING', 'ERROR');
CREATE INDEX activity_event_entity_time_idx
  ON activity_event(entity_type, entity_id, occurred_at DESC, id DESC);
CREATE INDEX activity_event_request_idx
  ON activity_event(request_id)
  WHERE request_id IS NOT NULL;
CREATE INDEX activity_event_error_time_idx
  ON activity_event(error_code, occurred_at DESC, id DESC)
  WHERE error_code IS NOT NULL;

CREATE TRIGGER parking_spot_tenant_integrity_insert
BEFORE INSERT ON parking_spot
WHEN NOT EXISTS (
  SELECT 1
  FROM organization
  JOIN membership ON membership.id = NEW.owner_membership_id
  WHERE organization.id = NEW.organization_id
    AND organization.kind = 'TENANT'
    AND membership.organization_id = NEW.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'parking_spot_tenant_integrity');
END;

CREATE TRIGGER parking_spot_tenant_integrity_update
BEFORE UPDATE OF organization_id, owner_membership_id ON parking_spot
WHEN NOT EXISTS (
  SELECT 1
  FROM organization
  JOIN membership ON membership.id = NEW.owner_membership_id
  WHERE organization.id = NEW.organization_id
    AND organization.kind = 'TENANT'
    AND membership.organization_id = NEW.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'parking_spot_tenant_integrity');
END;

CREATE TRIGGER availability_tenant_integrity_insert
BEFORE INSERT ON availability_offer
WHEN NOT EXISTS (
  SELECT 1
  FROM organization
  JOIN parking_spot ON parking_spot.id = NEW.parking_spot_id
  JOIN membership ON membership.id = NEW.owner_membership_id
  WHERE organization.id = NEW.organization_id
    AND organization.kind = 'TENANT'
    AND parking_spot.organization_id = NEW.organization_id
    AND parking_spot.owner_membership_id = NEW.owner_membership_id
    AND membership.organization_id = NEW.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'availability_tenant_integrity');
END;

CREATE TRIGGER availability_tenant_integrity_update
BEFORE UPDATE OF organization_id, parking_spot_id, owner_membership_id ON availability_offer
WHEN NOT EXISTS (
  SELECT 1
  FROM organization
  JOIN parking_spot ON parking_spot.id = NEW.parking_spot_id
  JOIN membership ON membership.id = NEW.owner_membership_id
  WHERE organization.id = NEW.organization_id
    AND organization.kind = 'TENANT'
    AND parking_spot.organization_id = NEW.organization_id
    AND parking_spot.owner_membership_id = NEW.owner_membership_id
    AND membership.organization_id = NEW.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'availability_tenant_integrity');
END;

CREATE TRIGGER reservation_tenant_integrity_insert
BEFORE INSERT ON reservation
WHEN NOT EXISTS (
  SELECT 1
  FROM organization
  JOIN availability_offer ON availability_offer.id = NEW.availability_offer_id
  JOIN membership ON membership.id = NEW.reserver_membership_id
  WHERE organization.id = NEW.organization_id
    AND organization.kind = 'TENANT'
    AND availability_offer.organization_id = NEW.organization_id
    AND membership.organization_id = NEW.organization_id
    AND availability_offer.owner_membership_id <> NEW.reserver_membership_id
)
BEGIN
  SELECT RAISE(ABORT, 'reservation_tenant_integrity');
END;

CREATE TRIGGER reservation_tenant_integrity_update
BEFORE UPDATE OF organization_id, availability_offer_id, reserver_membership_id ON reservation
WHEN NOT EXISTS (
  SELECT 1
  FROM organization
  JOIN availability_offer ON availability_offer.id = NEW.availability_offer_id
  JOIN membership ON membership.id = NEW.reserver_membership_id
  WHERE organization.id = NEW.organization_id
    AND organization.kind = 'TENANT'
    AND availability_offer.organization_id = NEW.organization_id
    AND membership.organization_id = NEW.organization_id
    AND availability_offer.owner_membership_id <> NEW.reserver_membership_id
)
BEGIN
  SELECT RAISE(ABORT, 'reservation_tenant_integrity');
END;

INSERT INTO activity_event (
  id, event_type, occurred_at, organization_id, entity_type, entity_id, source
)
SELECT
  'backfill_organization_' || id,
  'ORGANIZATION_CREATED',
  created_at,
  id,
  'ORGANIZATION',
  id,
  'BACKFILL'
FROM organization
WHERE kind = 'TENANT';

INSERT INTO activity_event (
  id, event_type, occurred_at, organization_id, user_id, membership_id,
  entity_type, entity_id, source
)
SELECT
  'backfill_membership_' || membership.id,
  'MEMBER_REGISTERED',
  membership.created_at,
  membership.organization_id,
  membership.user_id,
  membership.id,
  'MEMBERSHIP',
  membership.id,
  'BACKFILL'
FROM membership
JOIN organization ON organization.id = membership.organization_id
WHERE organization.kind = 'TENANT';

INSERT INTO activity_event (
  id, event_type, occurred_at, organization_id, user_id, membership_id,
  entity_type, entity_id, source
)
SELECT
  'backfill_session_started_' || app_session.id,
  'SESSION_STARTED',
  app_session.created_at,
  membership.organization_id,
  membership.user_id,
  membership.id,
  'APP_SESSION',
  app_session.id,
  'BACKFILL'
FROM app_session
JOIN membership ON membership.id = app_session.membership_id;

INSERT INTO activity_event (
  id, event_type, occurred_at, organization_id, user_id, membership_id,
  entity_type, entity_id, source
)
SELECT
  'backfill_session_revoked_' || app_session.id,
  'SESSION_REVOKED',
  app_session.revoked_at,
  membership.organization_id,
  membership.user_id,
  membership.id,
  'APP_SESSION',
  app_session.id,
  'BACKFILL'
FROM app_session
JOIN membership ON membership.id = app_session.membership_id
WHERE app_session.revoked_at IS NOT NULL;

INSERT INTO activity_event (
  id, event_type, occurred_at, organization_id, user_id, membership_id,
  entity_type, entity_id, source
)
SELECT
  'backfill_spot_' || parking_spot.id,
  'SPOT_CREATED',
  parking_spot.created_at,
  parking_spot.organization_id,
  membership.user_id,
  parking_spot.owner_membership_id,
  'PARKING_SPOT',
  parking_spot.id,
  'BACKFILL'
FROM parking_spot
JOIN membership ON membership.id = parking_spot.owner_membership_id;

INSERT INTO activity_event (
  id, event_type, occurred_at, organization_id, user_id, membership_id,
  entity_type, entity_id, source
)
SELECT
  'backfill_share_published_' || availability_offer.id,
  'SHARE_PUBLISHED',
  availability_offer.created_at,
  availability_offer.organization_id,
  membership.user_id,
  availability_offer.owner_membership_id,
  'AVAILABILITY_OFFER',
  availability_offer.id,
  'BACKFILL'
FROM availability_offer
JOIN membership ON membership.id = availability_offer.owner_membership_id;

INSERT INTO activity_event (
  id, event_type, occurred_at, organization_id, user_id, membership_id,
  entity_type, entity_id, source
)
SELECT
  'backfill_share_withdrawn_' || availability_offer.id,
  'SHARE_WITHDRAWN',
  availability_offer.withdrawn_at,
  availability_offer.organization_id,
  membership.user_id,
  availability_offer.owner_membership_id,
  'AVAILABILITY_OFFER',
  availability_offer.id,
  'BACKFILL'
FROM availability_offer
JOIN membership ON membership.id = availability_offer.owner_membership_id
WHERE availability_offer.withdrawn_at IS NOT NULL;

INSERT INTO activity_event (
  id, event_type, occurred_at, organization_id, user_id, membership_id,
  entity_type, entity_id, source
)
SELECT
  'backfill_reservation_confirmed_' || reservation.id,
  'RESERVATION_CONFIRMED',
  reservation.created_at,
  reservation.organization_id,
  membership.user_id,
  reservation.reserver_membership_id,
  'RESERVATION',
  reservation.id,
  'BACKFILL'
FROM reservation
JOIN membership ON membership.id = reservation.reserver_membership_id;

INSERT INTO activity_event (
  id, event_type, occurred_at, organization_id, user_id, membership_id,
  entity_type, entity_id, source
)
SELECT
  'backfill_reservation_cancelled_' || reservation.id,
  'RESERVATION_CANCELLED',
  reservation.cancelled_at,
  reservation.organization_id,
  membership.user_id,
  reservation.reserver_membership_id,
  'RESERVATION',
  reservation.id,
  'BACKFILL'
FROM reservation
JOIN membership ON membership.id = reservation.reserver_membership_id
WHERE reservation.cancelled_at IS NOT NULL;

CREATE TRIGGER activity_organization_created
AFTER INSERT ON organization
WHEN NEW.kind = 'TENANT'
BEGIN
  INSERT INTO activity_event (
    id, event_type, occurred_at, organization_id, entity_type, entity_id
  ) VALUES (
    'evt_' || lower(hex(randomblob(16))),
    'ORGANIZATION_CREATED',
    NEW.created_at,
    NEW.id,
    'ORGANIZATION',
    NEW.id
  );
END;

CREATE TRIGGER activity_membership_created
AFTER INSERT ON membership
BEGIN
  INSERT INTO activity_event (
    id, event_type, occurred_at, organization_id, user_id, membership_id,
    entity_type, entity_id
  ) VALUES (
    'evt_' || lower(hex(randomblob(16))),
    'MEMBER_REGISTERED',
    NEW.created_at,
    NEW.organization_id,
    NEW.user_id,
    NEW.id,
    'MEMBERSHIP',
    NEW.id
  );
END;

CREATE TRIGGER activity_session_started
AFTER INSERT ON app_session
BEGIN
  INSERT INTO activity_event (
    id, event_type, occurred_at, organization_id, user_id, membership_id,
    entity_type, entity_id
  )
  SELECT
    'evt_' || lower(hex(randomblob(16))),
    'SESSION_STARTED',
    NEW.created_at,
    membership.organization_id,
    membership.user_id,
    membership.id,
    'APP_SESSION',
    NEW.id
  FROM membership
  WHERE membership.id = NEW.membership_id;
END;

CREATE TRIGGER activity_session_revoked
AFTER UPDATE OF revoked_at ON app_session
WHEN OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL
BEGIN
  INSERT INTO activity_event (
    id, event_type, occurred_at, organization_id, user_id, membership_id,
    entity_type, entity_id
  )
  SELECT
    'evt_' || lower(hex(randomblob(16))),
    'SESSION_REVOKED',
    NEW.revoked_at,
    membership.organization_id,
    membership.user_id,
    membership.id,
    'APP_SESSION',
    NEW.id
  FROM membership
  WHERE membership.id = NEW.membership_id;
END;

CREATE TRIGGER activity_spot_created
AFTER INSERT ON parking_spot
BEGIN
  INSERT INTO activity_event (
    id, event_type, occurred_at, organization_id, user_id, membership_id,
    entity_type, entity_id
  )
  SELECT
    'evt_' || lower(hex(randomblob(16))),
    'SPOT_CREATED',
    NEW.created_at,
    NEW.organization_id,
    membership.user_id,
    NEW.owner_membership_id,
    'PARKING_SPOT',
    NEW.id
  FROM membership
  WHERE membership.id = NEW.owner_membership_id;
END;

CREATE TRIGGER activity_share_published
AFTER INSERT ON availability_offer
BEGIN
  INSERT INTO activity_event (
    id, event_type, occurred_at, organization_id, user_id, membership_id,
    entity_type, entity_id
  )
  SELECT
    'evt_' || lower(hex(randomblob(16))),
    'SHARE_PUBLISHED',
    NEW.created_at,
    NEW.organization_id,
    membership.user_id,
    NEW.owner_membership_id,
    'AVAILABILITY_OFFER',
    NEW.id
  FROM membership
  WHERE membership.id = NEW.owner_membership_id;
END;

CREATE TRIGGER activity_share_withdrawn
AFTER UPDATE OF status ON availability_offer
WHEN OLD.status = 'PUBLISHED' AND NEW.status = 'WITHDRAWN'
BEGIN
  INSERT INTO activity_event (
    id, event_type, occurred_at, organization_id, user_id, membership_id,
    entity_type, entity_id
  )
  SELECT
    'evt_' || lower(hex(randomblob(16))),
    'SHARE_WITHDRAWN',
    COALESCE(NEW.withdrawn_at, unixepoch()),
    NEW.organization_id,
    membership.user_id,
    NEW.owner_membership_id,
    'AVAILABILITY_OFFER',
    NEW.id
  FROM membership
  WHERE membership.id = NEW.owner_membership_id;
END;

CREATE TRIGGER activity_reservation_confirmed
AFTER INSERT ON reservation
BEGIN
  INSERT INTO activity_event (
    id, event_type, occurred_at, organization_id, user_id, membership_id,
    entity_type, entity_id
  )
  SELECT
    'evt_' || lower(hex(randomblob(16))),
    'RESERVATION_CONFIRMED',
    NEW.created_at,
    NEW.organization_id,
    membership.user_id,
    NEW.reserver_membership_id,
    'RESERVATION',
    NEW.id
  FROM membership
  WHERE membership.id = NEW.reserver_membership_id;
END;

CREATE TRIGGER activity_reservation_cancelled
AFTER UPDATE OF status ON reservation
WHEN OLD.status = 'CONFIRMED' AND NEW.status = 'CANCELLED'
BEGIN
  INSERT INTO activity_event (
    id, event_type, occurred_at, organization_id, user_id, membership_id,
    entity_type, entity_id
  )
  SELECT
    'evt_' || lower(hex(randomblob(16))),
    'RESERVATION_CANCELLED',
    COALESCE(NEW.cancelled_at, unixepoch()),
    NEW.organization_id,
    membership.user_id,
    NEW.reserver_membership_id,
    'RESERVATION',
    NEW.id
  FROM membership
  WHERE membership.id = NEW.reserver_membership_id;
END;
