ALTER TABLE user_account
  ADD COLUMN preferred_locale TEXT
    CHECK (
      preferred_locale IS NULL
      OR preferred_locale IN ('fr', 'en', 'de', 'lb')
    );
