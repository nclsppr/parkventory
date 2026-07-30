# STATUS.md

Snapshot de l'état réellement vérifié. Il ne remplace ni le contrat stable de
`PROJECT.md`, ni l'ordre de livraison de `ROADMAP.md`.

## Référence

| Champ | Valeur |
| --- | --- |
| Vérifié le | 2026-07-30 |
| Par | Codex |
| Branche | `main` |
| Commit | `372810f9f9044df56e436f9e080e77c33ca55339` — artefact applicatif Pages vérifié |
| Environnement | Local macOS, OrbStack 29.4.0 |
| Version livrée | F01 documentaire et prototype F02 local avec démo publique GitHub Pages |

## Résumé

Le dépôt contient maintenant une landing et un tableau de bord React
interactifs, une API Java 25 / Quarkus 3.33.3 LTS, PostgreSQL 18.3 avec une
migration Flyway et un environnement reproductible mise/Compose. Le rendu a
été revu sur desktop et mobile. Les écrans et endpoints portent explicitement
le statut de démonstration locale : aucune authentification, persistance métier,
livraison d'email ou production n'est encore présente. Le même frontend est
publié sur GitHub Pages en mode démo statique, sans appel au backend.

Project Foundation `v0.4.0` au commit
`7a5204a60eaf01cbaf38c86f56175751e36a0dad` est adopté en pack `critical`.
Son invariant `P18` impose désormais le commit puis le push de chaque tranche
validée. Le push initial, la CI et le rejeu complet depuis un clone public propre
sont réussis. F02 demeure `in_progress` jusqu'à la génération du client OpenAPI
et au démarrage de la stack depuis ce clone propre.

## Phase active

| Phase roadmap | État observé | Prochaine preuve | Responsable |
| --- | --- | --- | --- |
| F02 — Surface et squelette exécutable | `in_progress` | Générer le client OpenAPI puis prouver `npm run dev` depuis un clone propre | nclsppr |

## Livré et vérifié

| Capacité | Périmètre réel | Preuve | Limite connue |
| --- | --- | --- | --- |
| Socle Foundation | Snapshot critique `v0.4.0`, six profils, Nimbus et `P18` | Noyau identique au SHA épinglé, release amont et gates documentaires | Tag annoté mais non signé |
| Landing React | Promesse, fonctionnement, équipes, sécurité et formulaire local | Build Vite, test composant et revue navigateur | Aucun lien magique réel |
| Application React | Partage, recherche, réservation, invitation, navigation et feedback | Quatre tests Vitest et scénarios navigateur local/public | État de démonstration uniquement |
| API Quarkus | Dashboard et trois mutations locales, validation, santé, OpenAPI | Quatre tests Quarkus REST | Mutations conservées en mémoire |
| PostgreSQL | Schéma multi-tenant, outbox, audit, idempotence et contraintes temporelles | Flyway V1 appliquée sur PostgreSQL 18.3 réel | API démo non branchée sur ces tables |
| Environnement | Node 24.18, Java 25.0.4, Python 3.12.13 et PostgreSQL épinglés | `mise.lock`, wrapper Maven avec SHA, digest OCI | Docker/OrbStack requis |
| Illustration | Master PNG original et WebP navigateur de 459 190 octets | Hashes et provenance dans le registre | Pas un master vectoriel de marque |
| CI | Workflow Ubuntu appelant la gate canonique | Runs `30516904650` et `30517358828` réussis | Aucune gate de production |
| Démo Pages | Landing et app statiques sous `/parkventory/` | Run `30517358844`, HTTP 200 et revue navigateur publique | Aucun backend, compte, email ou stockage distant |

## État opérationnel

| Surface | URL ou accès | Artefact ou SHA | Santé | Dernière vérification |
| --- | --- | --- | --- | --- |
| Landing | `http://127.0.0.1:5173/` pendant `npm run dev` | Build Vite local | Fonctionnelle | 2026-07-30 |
| Application | `http://127.0.0.1:5173/app` pendant `npm run dev` | Build Vite local | Fonctionnelle, démo signalée | 2026-07-30 |
| API | `http://127.0.0.1:8080/api/v1` pendant `npm run dev` | Quarkus 3.33.3 | Santé prête et interactions fonctionnelles | 2026-07-30 |
| PostgreSQL | `127.0.0.1:5434` en local | Image 18.3 épinglée par digest | Healthy, Flyway V1 | 2026-07-30 |
| Documentation Nimbus | `http://127.0.0.1:4321` quand lancée | `docs-nimbus/dist/`, dérivé ignoré | Build et lint locaux | 2026-07-30 |
| Démo publique | `https://nclsppr.github.io/parkventory/` et `/app/` | Commit applicatif `372810f` | HTTP 200, navigation et console vérifiées | 2026-07-30 |
| Production | Aucune URL | Aucun artefact publié | Non provisionnée | 2026-07-30 |

## Validations récentes

| Date | Commande ou contrôle | Environnement | Résultat | Portée de la preuve |
| --- | --- | --- | --- | --- |
| 2026-07-30 | `npm run frontend:test` | Node 24.18 | 4 tests réussis | Promesse, partage, rejet d'email personnel et routage Pages |
| 2026-07-30 | `npm run frontend:build` | TypeScript 7, Vite 8.1.5 | Build réussi, JS initial 69,70 Ko gzip | Ne mesure pas le LCP réseau réel |
| 2026-07-30 | `mise exec -- ./mvnw test` | Java 25, Quarkus 3.33.3, PostgreSQL 18.3 Testcontainers | 4 tests réussis, Flyway V1 appliquée | Ne prouve pas encore la concurrence F04 |
| 2026-07-30 | `docker compose up -d --wait postgres` | OrbStack | PostgreSQL healthy sur `5434` | Environnement local uniquement |
| 2026-07-30 | Parcours navigateur landing/app | 1440×900, 390×844 et 320×568 | Aucun débordement horizontal, aucune erreur console | Revue locale, pas audit WCAG complet |
| 2026-07-30 | Partage, réservation et invitation | Navigateur contre Quarkus local | Confirmations observées et état mis à jour | Données en mémoire, aucun email envoyé |
| 2026-07-30 | Inscription email | Navigateur local | Domaine personnel refusé, domaine pro accepté en démo | Pas de vérification réelle de boîte email |
| 2026-07-30 | `mise exec -- npm run verify` | Runtimes épinglés et Docker | Gate complète réussie, audit npm à 0 vulnérabilité | Preuve locale |
| 2026-07-30 | `mise exec -- npm run dev` puis probes HTTP | Compose, Quarkus et Vite | Base healthy, API `UP`, frontend HTTP 200 | Commande arrêtée après contrôle, volume conservé |
| 2026-07-30 | GitHub Actions `30516904650` et `30517358828` | Ubuntu 24.04 | Gate canonique réussie sur les deux commits applicatifs | Pas un déploiement backend |
| 2026-07-30 | Clone public propre de `main` au SHA `5ee0f90` | Répertoire temporaire isolé | Installation et `mise exec -- npm run verify` réussies | `npm run dev` non rejoué dans ce clone |
| 2026-07-30 | GitHub Pages `30517358844` et probes publics | HTTPS et navigateur | Build/déploiement verts, deux routes HTTP 200, aucune erreur console | Démo statique uniquement |
| 2026-07-30 | Comparaison avec Project Foundation `v0.4.0` | Snapshot local | Noyau et six profils identiques au SHA épinglé | Tag amont annoté mais non signé |

## Blocages externes

| Blocage | Impact | Propriétaire | Condition de reprise |
| --- | --- | --- | --- |
| Droits des cinq JPEG non documentés | Interdit leur publication comme assets servis | nclsppr | Confirmer origine et droits ; le prototype sert une création originale |
| Fournisseur d'email non choisi | Bloque la self-registration réelle | nclsppr | Décision avant F03 |
| Infrastructure non choisie | Bloque toute URL de production | nclsppr | ADR et autorité de provisionnement |

## Dérives connues

| Intention | Réalité observée | Risque | Action |
| --- | --- | --- | --- |
| Partages et réservations persistés | Mutations en mémoire derrière une API démo | Confondre prototype et produit | Conserver `demo: true`, implémenter F03/F04 avant pilote |
| Schéma multi-tenant utilisé | Migration réelle, endpoints encore non persistés | Invariants non exercés par l'UI | Brancher repositories et tests de concurrence en F04 |
| Contrat API canonique | YAML et annotations Quarkus présents, client écrit à la main | Dérive de types | Générer et vérifier le client avant sortie F02 |
| Logo de production | SVG code-native provisoire inspiré de la référence | Géométrie non validée comme master | Produire et approuver le système de marque avant production |

## Risques et hypothèses

| Sujet | Type | Impact | Prochaine preuve | Responsable | Date de réévaluation |
| --- | --- | --- | --- | --- | --- |
| Domaine email équivalent à une entreprise | Hypothèse | Mauvais rattachement ou fuite de membres | Tests domaines, filiales et invitations | nclsppr | Avant F03 |
| Membre autorisé à déclarer une place | Risque | Offre illégitime | Recherche utilisateur et contestation | nclsppr | Avant F04 |
| Direction visuelle issue des JPEG | Hypothèse partiellement validée | Densité inadéquate en usage réel | Test utilisateur et audit accessibilité | nclsppr | Avant F05 |
| Quarkus 3.33.3 LTS et PostgreSQL 18.3 | Hypothèse technique validée localement | Mise à jour ou faille future | Veille dépendances et CI régulière | nclsppr | Mensuel |
