# Modèle de données D1

Le schéma opérationnel est versionné par les migrations D1 sous `migrations/`.

| Table | Rôle |
| --- | --- |
| `organization` | frontière d’autorisation, unique par domaine normalisé et classée `TENANT` ou `SYSTEM` |
| `user_account` | identité minimale, unique par e-mail normalisé, avec préférence de langue nullable et instant d’effacement optionnel |
| `membership` | rattachement d’un utilisateur à son organisation et rôle `MEMBER` ou `ADMIN` |
| `magic_link_request` | hash du jeton, expiration, consommation et rate limit |
| `app_session` | hash du cookie opaque, expiration et révocation |
| `parking_spot` | place assignée, une par membre |
| `availability_offer` | créneau entier publié ou retiré |
| `reservation` | réservation confirmée ou annulée |
| `organization_branding` | co-marque optionnelle par domaine, modifiable et désactivable sans changer l'identité des membres |
| `activity_event` | chronologie redacted des transitions métier et incidents, indexée par date, tenant, utilisateur, adhésion, type, entité, requête et code d’erreur |

L’index partiel `one_active_reservation_per_offer` garantit une seule
réservation confirmée par offre. Le trigger `availability_no_overlap_insert`
refuse les créneaux qui se chevauchent pour une même place. Le trigger
`reservation_same_tenant_insert` refuse une réservation inter-tenant ou par le
propriétaire de la place.

L’index partiel `availability_spot_active_window_idx` borne la recherche des
créneaux publiés d’une place, utilisée à la fois par le trigger anti-chevauchement
et par le contrôle d’intégrité global. Il évite qu’une vérification locale ne
devienne un scan de toutes les offres à mesure que l’historique grandit.

Le branding est résolu par égalité exacte sur le domaine normalisé. Son absence,
son opt-out ou une valeur invalide produit `null` et conserve l'identité
Parkventory. Les réponses authentifiées n'ont pas besoin d'exposer le domaine
pour transmettre le nom, le logo de même origine et les jetons sémantiques.

La préférence `preferred_locale` appartient au compte global, pas à une
adhésion ni à une session. Elle accepte uniquement `fr`, `en`, `de` ou `lb` et
reste `NULL` pour un compte historique tant qu’aucun choix connecté ou nouvelle
connexion ne l’a initialisée.

La migration `0005_tenant_administration.sql` ajoute l’opt-out du logo, la trace
de l’administrateur ayant modifié la marque et `email_erased_at`. Des triggers
vérifient que toute modification tenant-admin de la marque vient d’une adhésion
`ADMIN` du domaine exact. Un autre trigger refuse au niveau D1 l’effacement d’un
administrateur ou d’une identité rattachée à plusieurs tenants.

La migration `0004_godmode_admin.sql` ajoute `organization.kind`, crée l’unique
organisation `org_system_parkventory`, puis réalise un backfill de
`activity_event` depuis les dates déjà conservées. La provenance `BACKFILL`
signifie « état historique reconstruit » et non « événement observé en temps
réel ». Les triggers D1 enregistrent ensuite les créations de tenant, adhésions,
sessions, places, partages et réservations, ainsi que révocations, retraits et
annulations, avec la provenance `TRIGGER`. Les refus et incidents sûrs créés par
le Worker portent `WORKER`. Les refus godmode identiques sont dédupliqués par
adhésion et route dans une fenêtre de cinq minutes.

Des triggers additionnels refusent toute place, offre ou réservation rattachée à
`SYSTEM`, ainsi que les discordances entre l’organisation portée par la ligne, le
propriétaire, la place, l’offre et le réservataire. Les diagnostics restent utiles
pour les lignes historiques antérieures à ces gardes et pour détecter une future
régression de schéma. Chacun de leurs neuf contrôles peut être détaillé par
curseur ; la réponse contient uniquement la portée tenant éventuelle, les types
et identifiants internes concernés et leur multiplicité.

`activity_event` ne conserve aucun payload libre. Ses références sont des
identifiants internes optionnels ; ses seules informations opérationnelles sont
le type, l’instant, la sévérité, le résultat, la route, l’identifiant de requête
et un code d’erreur classifié. Cette forme permet les agrégats et investigations
sans recopier les données d’authentification.
