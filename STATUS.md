# STATUS.md

Snapshot de l'état réellement vérifié. Il ne remplace ni le contrat stable de
`PROJECT.md`, ni l'ordre de livraison de `ROADMAP.md`.

## Référence

| Champ | Valeur |
| --- | --- |
| Vérifié le | 2026-07-30 |
| Par | Codex |
| Branche | `main` |
| Commits applicatifs | `e069d04a70c62c814345947dfb6e26fb0d890070` — backend persistant et Mailpit ; `9f7b9bef3e85815c40a48af914e0130dc6a6665c` — frontend local réel |
| Environnement | Local macOS, OrbStack 29.4.0 ; CI GitHub Actions Ubuntu |
| Version livrée | F02, F03 et F04 partielles ; démo publique GitHub Pages séparée |

## Résumé

Le parcours local n'est plus une simulation. Docker Compose démarre
PostgreSQL 18.3, Mailpit 1.30.6, Java 25 / Quarkus 3.33.3 LTS et React/Vite.
Une adresse professionnelle reçoit un lien magique dans Mailpit ; sa
consommation crée une session serveur, résout l'organisation et permet de
déclarer, partager puis réserver une place. Les mutations et l'outbox sont
persistées dans PostgreSQL, et Mailpit reçoit invitations et notifications.

Le frontend local ne retombe jamais silencieusement sur les données fictives :
une session absente, une API indisponible et un tableau vide possèdent des états
explicites. GitHub Pages reste volontairement une démo statique, signalée et
sans backend.

Project Foundation `v0.5.2` au commit
`708d7374f87060809a805c57abc2cf7e7b66c182` est adopté en pack `critical`.
`P18` impose commit et push des tranches validées ; `P19` impose Compose comme
graphe local intégré.

## Phases actives

| Phase roadmap | État observé | Preuve restante avant clôture | Responsable |
| --- | --- | --- | --- |
| F02 — Surface et squelette | `in_progress` | Générer le client OpenAPI et rejouer le démarrage depuis un clone propre | nclsppr |
| F03 — Identité et communauté | `in_progress` | Matrice tenant A/B, RLS, anti-abus et adaptateur OIDC de production | nclsppr |
| F04 — Partager et réserver | `in_progress` | Test réellement concurrent, annulation, fuseaux et heure d'été | nclsppr |

## Livré et vérifié

| Capacité | Périmètre réel | Preuve | Limite connue |
| --- | --- | --- | --- |
| Identité locale | Lien 256 bits, hash en base, durée 15 min, consommation unique, session `HttpOnly` 7 jours | Tests Quarkus, smoke Compose, parcours navigateur | Adaptateur HTTP local, pas OIDC de production |
| Communauté | Invitation exacte prioritaire, sinon organisation communautaire unique par domaine | PostgreSQL réel et tests d'intégration | Domaine partagé/filiales et liste anti-abus à durcir |
| Application React | Connexion, première place, partage, réservation, invitation, chargements, erreurs et états vides | 6 tests Vitest, build et navigateur sans erreur console | Client OpenAPI encore manuel |
| API Quarkus | Session, dashboard, place, partage, réservation idempotente et invitation | Tests sur PostgreSQL 18.3 et contrat OpenAPI `0.2.0` | Annulation et administration absentes |
| PostgreSQL | Schéma multi-tenant, sessions, outbox, audit, idempotence et exclusions GiST | Flyway V1 + V2 et relecture après mutations | RLS et rôle applicatif non propriétaire non livrés |
| Notifications | Invitation et réservation écrites avec l'outbox puis livrées avec reprise bornée | Messages observés dans Mailpit | Délivrabilité externe non prouvée |
| Environnement | Quatre services Compose, images par digest, healthchecks et volumes | Checker indépendant, smoke complet et stack locale saine | Docker ou OrbStack requis |
| Démo Pages | Landing et app statiques sous `/parkventory/` | Run Pages `30532444836`, routes publiques HTTP 200 | Aucun compte, email ou stockage distant |
| CI | Gate Foundation, docs, audit, React, Quarkus et smoke Compose | Run Verify `30532444607` réussi sur `9f7b9be` | Aucune gate de production |

## État opérationnel

| Surface | URL ou accès | Santé au 2026-07-30 |
| --- | --- | --- |
| Landing locale | `http://127.0.0.1:5173/` | Fonctionnelle |
| Application locale | `http://127.0.0.1:5173/app` | Authentification et données réelles |
| Mailpit | `http://127.0.0.1:8025/`, SMTP `127.0.0.1:1025` | Healthy, messages persistés localement |
| API | `http://127.0.0.1:8080/api/v1` | Readiness `UP` |
| Swagger UI | `http://127.0.0.1:8080/q/swagger-ui` | Accessible |
| PostgreSQL | `127.0.0.1:5434` | Healthy, Flyway V2 |
| Démo publique | `https://nclsppr.github.io/parkventory/` et `/app/` | HTTP 200, mode statique |
| Production | Aucune URL | Non provisionnée |

La stack locale de développement est laissée active à la fin de cette
livraison. `npm run compose:down` l'arrête en conservant les volumes.

## Validations récentes

| Date | Commande ou contrôle | Résultat | Portée de la preuve |
| --- | --- | --- | --- |
| 2026-07-30 | `npm run frontend:test` | 6 tests réussis | Inclut l'absence de repli démo et la consommation unique sous `StrictMode` |
| 2026-07-30 | `npm run frontend:build` | Build Vite réussi, JS initial 71,72 Ko gzip | Build local, pas mesure réseau |
| 2026-07-30 | `mise exec -- ./mvnw verify` dans `backend/` | 3 tests réussis sur PostgreSQL 18.3 | Identité, sessions, tenant, métier, conflits et outbox |
| 2026-07-30 | `npm run compose:verify` | Parcours PostgreSQL, Mailpit, Quarkus et Vite réussi | Projet et volumes de vérification isolés puis retirés |
| 2026-07-30 | `mise exec -- npm run verify` | Gate complète réussie | 36 Markdown catalogués, Nimbus vert, audit npm sans vulnérabilité, 6 tests React, 3 tests Quarkus et smoke Compose |
| 2026-07-30 | Parcours navigateur local | Lien Mailpit, session, `UI-30`, partage, collègue, réservation et notification observés | Trois adresses synthétiques `.test`, aucune donnée réelle |
| 2026-07-30 | Console navigateur | Aucune erreur ou alerte | Landing et application desktop locales |
| 2026-07-30 | GitHub Actions Verify `30532444607` | Réussi sur `9f7b9be` | CI distante, pas déploiement backend |
| 2026-07-30 | GitHub Pages `30532444836` | Build et déploiement réussis | Démo statique uniquement |

## Blocages externes

| Blocage | Impact | Propriétaire | Condition de reprise |
| --- | --- | --- | --- |
| Fournisseurs OIDC et email non choisis | Interdit de présenter l'identité locale comme prête pour la production | nclsppr | ADR, contrat, région, coût et retrait validés |
| Infrastructure non choisie | Bloque toute URL de production | nclsppr | Architecture d'exploitation et autorité de provisionnement |
| Droits des cinq JPEG non documentés | Interdit leur publication comme assets servis | nclsppr | Confirmer origine et droits ; le site sert une création originale |

## Dérives et travaux ouverts

| Intention | Réalité observée | Risque | Action |
| --- | --- | --- | --- |
| Isolation en profondeur | Filtres tenant et clés composites, sans RLS | Contournement en cas de défaut repository | Rôle non propriétaire, `SET LOCAL`, RLS forcée et matrice A/B |
| Client issu d'OpenAPI | Client TypeScript écrit à la main | Dérive de types | Générer et contrôler le diff avant clôture F02 |
| Défense anti-abus | Refus minimal de domaines personnels | Spam et tenant indésirable | Rate limit, liste versionnée et réponses/timings comparés |
| Intégrité temporelle complète | Contraintes GiST et conflits testés séquentiellement | Course, annulation ou DST mal traitée | Tests parallèles, annulation et matrice de fuseaux |
| Identité de production | Adaptateur local Mailpit | Mauvais usage hors boucle locale | OIDC, cookie `Secure`, PKCE, CSRF et révocation de migration |

## Risques et hypothèses

| Sujet | Type | Impact | Prochaine preuve | Responsable |
| --- | --- | --- | --- | --- |
| Domaine email équivalent à une entreprise | Hypothèse | Mauvais rattachement ou fuite de membres | Tests filiales, domaines partagés et invitations | nclsppr |
| Membre autorisé à déclarer une place | Risque produit | Offre illégitime | Recherche utilisateur et contestation | nclsppr |
| Direction visuelle issue des JPEG | Hypothèse partiellement validée | Densité inadéquate | Test utilisateur et audit accessibilité | nclsppr |
| Versions Quarkus/PostgreSQL/Mailpit | Hypothèse technique validée localement | Mise à jour ou faille future | Veille dépendances et CI régulière | nclsppr |
