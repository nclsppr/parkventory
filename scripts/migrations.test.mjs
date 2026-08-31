import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

const migrationsDirectory = new URL("../migrations/", import.meta.url);

function migrationSource(name) {
  return readFileSync(new URL(name, migrationsDirectory), "utf8");
}

test("0004 conserve les comptes existants et contraint la préférence de langue", () => {
  const database = new DatabaseSync(":memory:");
  const migrationNames = readdirSync(migrationsDirectory)
    .filter((name) => /^\d{4}_.+\.sql$/.test(name))
    .sort();
  const localeMigration = "0004_user_locale.sql";

  try {
    for (const name of migrationNames.filter((migration) => migration < localeMigration)) {
      database.exec(migrationSource(name));
    }

    database.prepare(`
      INSERT INTO organization (id, normalized_domain, display_name, created_at)
      VALUES ('org_history', 'history.test', 'History', 1)
    `).run();
    database.prepare(`
      INSERT INTO user_account (id, normalized_email, display_name, created_at)
      VALUES ('usr_history', 'member@history.test', 'Compte historique', 1)
    `).run();
    database.prepare(`
      INSERT INTO membership (id, organization_id, user_id, role, created_at)
      VALUES ('mem_history', 'org_history', 'usr_history', 'MEMBER', 1)
    `).run();

    database.exec(migrationSource(localeMigration));

    assert.deepEqual(
      { ...database.prepare(`
        SELECT user_account.id, user_account.normalized_email,
               user_account.preferred_locale, membership.id AS membership_id
        FROM user_account
        JOIN membership ON membership.user_id = user_account.id
        WHERE user_account.id = 'usr_history'
      `).get() },
      {
        id: "usr_history",
        normalized_email: "member@history.test",
        preferred_locale: null,
        membership_id: "mem_history",
      },
    );

    database.prepare(`
      UPDATE user_account SET preferred_locale = 'de' WHERE id = 'usr_history'
    `).run();
    assert.equal(
      database.prepare(`
        SELECT preferred_locale FROM user_account WHERE id = 'usr_history'
      `).get().preferred_locale,
      "de",
    );
    assert.throws(() => database.prepare(`
      UPDATE user_account SET preferred_locale = 'nl' WHERE id = 'usr_history'
    `).run(), /CHECK constraint failed/);
  } finally {
    database.close();
  }
});
