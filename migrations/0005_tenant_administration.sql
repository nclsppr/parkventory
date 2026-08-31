ALTER TABLE organization_branding
  ADD COLUMN logo_enabled INTEGER NOT NULL DEFAULT 1
    CHECK (logo_enabled IN (0, 1));

ALTER TABLE organization_branding
  ADD COLUMN updated_by_membership_id TEXT
    REFERENCES membership(id);

ALTER TABLE user_account
  ADD COLUMN email_erased_at INTEGER
    CHECK (email_erased_at IS NULL OR email_erased_at >= 0);

CREATE INDEX membership_org_role_created_idx
  ON membership(organization_id, role, created_at DESC, id DESC);

CREATE INDEX user_account_email_erased_idx
  ON user_account(email_erased_at, id)
  WHERE email_erased_at IS NOT NULL;

CREATE TRIGGER user_account_email_erasure_guard
BEFORE UPDATE OF normalized_email, email_erased_at ON user_account
WHEN NEW.email_erased_at IS NOT NULL AND NOT (
  OLD.email_erased_at IS NULL
  AND NEW.normalized_email GLOB 'erased_*@privacy.parkventory.invalid'
  AND (
    SELECT COUNT(*)
    FROM membership
    WHERE membership.user_id = OLD.id
      AND membership.role = 'MEMBER'
  ) = 1
  AND (
    SELECT COUNT(*)
    FROM membership
    WHERE membership.user_id = OLD.id
  ) = 1
)
BEGIN
  SELECT RAISE(ABORT, 'user_account_email_erasure_invalid');
END;

CREATE TRIGGER organization_branding_tenant_admin_insert
BEFORE INSERT ON organization_branding
WHEN NEW.updated_by_membership_id IS NOT NULL AND NOT EXISTS (
  SELECT 1
  FROM membership
  JOIN organization ON organization.id = membership.organization_id
  WHERE membership.id = NEW.updated_by_membership_id
    AND membership.role = 'ADMIN'
    AND organization.kind = 'TENANT'
    AND organization.normalized_domain = NEW.normalized_domain
)
BEGIN
  SELECT RAISE(ABORT, 'organization_branding_tenant_admin_invalid');
END;

CREATE TRIGGER organization_branding_tenant_admin_update
BEFORE UPDATE OF normalized_domain, updated_by_membership_id ON organization_branding
WHEN NEW.updated_by_membership_id IS NOT NULL AND NOT EXISTS (
  SELECT 1
  FROM membership
  JOIN organization ON organization.id = membership.organization_id
  WHERE membership.id = NEW.updated_by_membership_id
    AND membership.role = 'ADMIN'
    AND organization.kind = 'TENANT'
    AND organization.normalized_domain = NEW.normalized_domain
)
BEGIN
  SELECT RAISE(ABORT, 'organization_branding_tenant_admin_invalid');
END;
