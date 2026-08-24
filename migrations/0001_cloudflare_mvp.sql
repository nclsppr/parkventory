PRAGMA foreign_keys = ON;

CREATE TABLE organization (
  id TEXT PRIMARY KEY,
  normalized_domain TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
) STRICT;

CREATE TABLE user_account (
  id TEXT PRIMARY KEY,
  normalized_email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
) STRICT;

CREATE TABLE membership (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  user_id TEXT NOT NULL REFERENCES user_account(id),
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'ADMIN')),
  created_at INTEGER NOT NULL,
  UNIQUE (organization_id, user_id)
) STRICT;

CREATE TABLE magic_link_request (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  normalized_email TEXT NOT NULL,
  normalized_domain TEXT NOT NULL,
  requested_ip_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
) STRICT;

CREATE INDEX magic_link_email_rate_idx
  ON magic_link_request(normalized_email, created_at DESC);
CREATE INDEX magic_link_ip_rate_idx
  ON magic_link_request(requested_ip_hash, created_at DESC);

CREATE TABLE app_session (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  magic_link_request_id TEXT NOT NULL UNIQUE REFERENCES magic_link_request(id),
  membership_id TEXT NOT NULL REFERENCES membership(id),
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL
) STRICT;

CREATE INDEX app_session_membership_idx ON app_session(membership_id);
CREATE INDEX app_session_expiry_idx ON app_session(expires_at);

CREATE TRIGGER app_session_requires_consumed_link
BEFORE INSERT ON app_session
WHEN NOT EXISTS (
  SELECT 1
  FROM magic_link_request request
  WHERE request.id = NEW.magic_link_request_id
    AND request.consumed_at IS NOT NULL
    AND request.expires_at >= NEW.created_at
)
BEGIN
  SELECT RAISE(ABORT, 'magic_link_not_consumed');
END;

CREATE TABLE parking_spot (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  owner_membership_id TEXT NOT NULL UNIQUE REFERENCES membership(id),
  label TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT '',
  time_zone TEXT NOT NULL DEFAULT 'Europe/Paris',
  created_at INTEGER NOT NULL,
  UNIQUE (organization_id, label)
) STRICT;

CREATE TABLE availability_offer (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  parking_spot_id TEXT NOT NULL REFERENCES parking_spot(id),
  owner_membership_id TEXT NOT NULL REFERENCES membership(id),
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  local_date TEXT NOT NULL,
  local_from TEXT NOT NULL,
  local_to TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'WITHDRAWN')),
  created_at INTEGER NOT NULL,
  withdrawn_at INTEGER,
  CHECK (ends_at > starts_at)
) STRICT;

CREATE INDEX availability_org_window_idx
  ON availability_offer(organization_id, starts_at, ends_at, status);
CREATE INDEX availability_owner_idx
  ON availability_offer(owner_membership_id, starts_at, status);

CREATE TRIGGER availability_no_overlap_insert
BEFORE INSERT ON availability_offer
WHEN NEW.status = 'PUBLISHED' AND EXISTS (
  SELECT 1
  FROM availability_offer existing
  WHERE existing.parking_spot_id = NEW.parking_spot_id
    AND existing.status = 'PUBLISHED'
    AND NEW.starts_at < existing.ends_at
    AND NEW.ends_at > existing.starts_at
)
BEGIN
  SELECT RAISE(ABORT, 'availability_overlap');
END;

CREATE TABLE reservation (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  availability_offer_id TEXT NOT NULL REFERENCES availability_offer(id),
  reserver_membership_id TEXT NOT NULL REFERENCES membership(id),
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
  created_at INTEGER NOT NULL,
  cancelled_at INTEGER,
  UNIQUE (organization_id, reserver_membership_id, idempotency_key)
) STRICT;

CREATE UNIQUE INDEX one_active_reservation_per_offer
  ON reservation(availability_offer_id)
  WHERE status = 'CONFIRMED';
CREATE INDEX reservation_member_idx
  ON reservation(reserver_membership_id, status, created_at DESC);

CREATE TRIGGER reservation_same_tenant_insert
BEFORE INSERT ON reservation
WHEN NOT EXISTS (
  SELECT 1
  FROM availability_offer offer
  JOIN membership member ON member.id = NEW.reserver_membership_id
  WHERE offer.id = NEW.availability_offer_id
    AND offer.organization_id = NEW.organization_id
    AND member.organization_id = NEW.organization_id
    AND offer.owner_membership_id <> NEW.reserver_membership_id
    AND offer.status = 'PUBLISHED'
)
BEGIN
  SELECT RAISE(ABORT, 'reservation_not_allowed');
END;
