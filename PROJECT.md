# PROJECT.md

## Identité

| Champ | Valeur |
| --- | --- |
| Nom | Parkventory |
| Propriétaire | nclsppr |
| Classe | Critique |
| Surface de production | Aucune application dynamique ; démos statiques Pages/Atlas publiques et candidat OCI full-stack séparé, publié sans activation Compose |
| Socle adopté | [`FOUNDATION.md`](FOUNDATION.md) |

## Problème

Dans une entreprise, des places de parking assignées restent inutilisées quand
leurs titulaires sont absents, tandis que des collègues sans place ne savent ni
les trouver ni les réserver de façon fiable.

## Utilisateurs

| Utilisateur | Situation | Besoin | Risque principal |
| --- | --- | --- | --- |
| Visiteur | Connaît le service mais n'est pas authentifié | Comprendre la promesse et vérifier son email professionnel | Énumération d'entreprises ou d'adresses |
| Membre | A rejoint un espace d'entreprise | Trouver, réserver et inviter sans dépendre d'un administrateur | Fuite de données entre entreprises |
| Titulaire d'une place assignée | S'absente ponctuellement | Publier exactement quand sa place est libre | Déclaration illégitime ou retrait d'une offre réservée |
| Administrateur d'organisation | A reçu un rôle optionnel | Enrichir sites, places, membres et règles | Abus de privilège ou perte de gouvernance |
| Opérateur Parkventory | Exploite le service | Diagnostiquer, restaurer et auditer avec un accès minimal | Accès excessif aux identités et habitudes de présence |

## Résultat attendu

Un collègue vérifie son adresse professionnelle, rejoint automatiquement
l'espace correspondant, partage une place qui lui est assignée ou réserve une
disponibilité réelle, sans intervention administrative préalable et sans double
réservation.

### Preuves de succès

| Preuve | Baseline connue | Cible | Source | Échéance |
| --- | --- | --- | --- | --- |
| Parcours autonome complet | Parcours local Compose et navigateur vérifié | Une entreprise pilote exécute inscription, partage et réservation sans opérateur | Test E2E de la phase F04 | Sortie F04 |
| Intégrité d'une réservation concurrente | Contraintes GiST et conflits séquentiels testés | Deux demandes simultanées produisent un succès et un conflit explicite | Test d'intégration PostgreSQL | Sortie F04 |
| Isolation des organisations | Tenant chargé côté serveur et clés composites en place | Zéro lecture ou mutation inter-tenant dans la matrice d'autorisation | Tests d'intégration et RLS | Sortie F03 |
| Accessibilité du parcours critique | 34 tests React, 24 audits Axe, ratios automatisés et revue clavier/mobile ; Safari réel et technologies d'assistance restent à vérifier | WCAG 2.2 AA, clavier et mobile vérifiés sur les appareils cibles | Matrice de `DESIGN.md` | Sortie F05 |
| Documentation reproductible | Socle vierge | `./scripts/verify.sh` vert depuis un clone propre | Preuve de livraison | Chaque livraison |

Ces cibles ne sont pas des résultats acquis.

## Périmètre

### Inclus

- self-registration par adresse professionnelle vérifiée ;
- organisation communautaire pouvant avoir zéro administrateur ;
- invitation de collègues du même espace ;
- déclaration d'une place assignée ;
- offre de disponibilité sur une journée ou un intervalle ;
- recherche, réservation et annulation sans collision ;
- notifications transactionnelles ;
- rôles administrateur optionnels et auditables ;
- sites, niveaux et attributs de place ;
- préparation du modèle pour un plan de parking futur ;
- landing page et application React responsive.

### Non-objectifs initiaux

- monétisation, paiement ou marketplace publique ;
- contrôle d'accès physique, lecture de plaque ou capteur IoT ;
- calcul de revenus, pricing entreprise ou faux indicateurs commerciaux ;
- carte interactive du parking dans le MVP ;
- synchronisation calendrier, SSO d'entreprise ou application native ;
- microservices, Kubernetes, broker de messages ou temps réel ;
- optimisation automatique d'affectation des places.

### Conditions d'arrêt ou de réévaluation

- impossibilité de rattacher une personne à une organisation sans exposer les
  membres ou accepter des domaines personnels ;
- incapacité à prouver l'isolation inter-tenant et l'absence de double booking ;
- absence de pilote capable de valider le flux cœur après F04 ;
- coût ou délivrabilité de l'email incompatibles avec le self-service ;
- exigences légales, immobilières ou de représentation du personnel modifiant
  la collecte minimale prévue.

## État et séquencement

- L'état vérifié vit dans [`STATUS.md`](STATUS.md).
- L'ordre de livraison vit dans [`ROADMAP.md`](ROADMAP.md).
- Les questions non résolues vivent dans
  [`docs/internal/open-questions.md`](docs/internal/open-questions.md).

## Sources de vérité

| Concept | Source canonique | Type | Notes |
| --- | --- | --- | --- |
| Vision et périmètre produit | [`docs/product/vision.md`](docs/product/vision.md) | normative | Promesse et exclusions |
| Rôles et gouvernance | [`docs/product/roles-and-governance.md`](docs/product/roles-and-governance.md) | normative | Zéro administrateur autorisé |
| Parcours | [`docs/product/user-journeys.md`](docs/product/user-journeys.md) | normative | États UX compris |
| Règles métier | [`docs/product/business-rules.md`](docs/product/business-rules.md) | normative | Invariants fonctionnels |
| État courant | `STATUS.md` | snapshot opérationnel | Daté et vérifié |
| Roadmap | `ROADMAP.md` | normative | Autorité de séquencement |
| Historique | `CHANGELOG.md` | historique | Changements livrés |
| Architecture | [`docs/architecture/overview.md`](docs/architecture/overview.md) | normative | Cible, pas état livré |
| Contrat API | `api/openapi/parkventory.yaml` | normative actuelle | Authentification locale et parcours métier versionnés |
| Schéma de données | [`docs/architecture/domain-model.md`](docs/architecture/domain-model.md) et `backend/src/main/resources/db/migration/` | normative et opérationnelle | Migrations V1 à V3 et parcours runtime non propriétaire testés sur PostgreSQL 17.10 et 18.3 ; aucune migration Atlas exécutée |
| Sécurité et isolation | [`docs/architecture/security-and-tenancy.md`](docs/architecture/security-and-tenancy.md) | normative | Défense en profondeur |
| Design system | [`DESIGN.md`](DESIGN.md) et `frontend/src/styles.css` | normative et opérationnelle | Tokens, composants et responsive alignés |
| Identité de marque | `assets/brand/parkventory-logo-transparent.svg` | normative | Master du symbole ; copies publiques synchronisées et contrôlées |
| Configuration | `compose.yaml`, `mise.toml`, `mise.lock`, `.env.example`, `config/deployment/images.env` et `deploy/vps/` | opérationnelle | Compose porte le parcours local ; les sources VPS publient les candidats statique et full-stack, tandis que `vps-infra` décide séparément leur activation |
| Code livré | `frontend/` et `backend/` | opérationnelle locale | Flux F03/F04 partiels et persistants ; pas une production |
| Opérations | [`RUNBOOK.md`](RUNBOOK.md) | normative et opérationnelle | Démo statique Atlas active ; production applicative bloquée |
| Décisions | `docs/decisions/` | normative | ADR acceptées ou proposées |
| Documentation | `DOCUMENTATION.md`, `documentation.json`, `docs-nimbus/` et catalogue | normative et dérivée | Markdown canonique ; seule la collection `product` est autorisée pour Pages |
| Références visuelles | [`docs/references/visual-sources.md`](docs/references/visual-sources.md) | référence | JPEG non publiables sans droits |
| Artefacts générés | Catalogue Nimbus, site Nimbus, copies publiques du logo et futur client TypeScript | dérivée | Sources et commandes à conserver |
| Archives | Aucune | historique | Ne pas créer sans motif |
| Démonstration publique | Données statiques portant `demo: true` sur GitHub Pages et Atlas | expérimentale et signalée | `parkventory.com` est actuellement servi par Atlas sans backend |
| Documentation publique | Collection Nimbus `product` sous `/parkventory/docs/` | publique | Allowlist vérifiée ; aucune collection interne ou de référence dans l'artefact |

## Architecture

La cible est un monolithe modulaire, déployable simplement et séparé d'un
frontend statique :

```text
Navigateur
  -> même origine HTTPS
     -> React statique
     -> /api/v1 vers Quarkus
        -> PostgreSQL
        -> fournisseur d'email transactionnel
```

Le détail et les compromis vivent dans
[`docs/architecture/overview.md`](docs/architecture/overview.md) et
[`ADR-0002`](docs/decisions/adr-0002-monolithe-quarkus-postgresql.md).

### Composants

| Composant | Rôle | Statut | Exécution | Version | Source | Preuve et date | Propriétaire |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Documentation Nimbus | Rendu des Markdown classés | Actuel | Build local complet et GitHub Pages filtré | Nimbus 0.8.2 | `docs-nimbus/` | 13 tests d'adaptateur, 7 pages publiques issues de 4 sources, build/lint et probes, 2026-08-11 | nclsppr |
| Frontend React | Landing, authentification, dashboard, partage et recherche | Actuel, réel en local et démo publique | Compose ou navigateur statique | React 19.2.8, Vite 8.1.5 | `frontend/` | 34 tests, 24 audits Axe, builds et parcours navigateur, 2026-08-11 | nclsppr |
| API Java | Identité locale, métier, validation, santé et OpenAPI | Actuel, local | Compose, Maven 3.9.16 et Java 25 | Quarkus 3.33.3 LTS | `backend/` | Tests PostgreSQL et smoke Compose, 2026-07-30 | nclsppr |
| PostgreSQL | Identité, sessions, métier, outbox, contraintes et RLS forcée | Actuel, local | Compose et Testcontainers | PostgreSQL 18.3 | migrations Flyway V1 à V3 | Migration, parcours persisté et rôle RLS adversarial vérifiés, 2026-08-18 | nclsppr |
| Mailpit | Liens magiques, invitations et notifications locales | Actuel, local uniquement | Compose | Mailpit 1.30.6 | `compose.yaml` | Healthcheck, API et navigateur, 2026-07-30 | nclsppr |
| Livraison email de production | Magic links et notifications | Cible | Service externe derrière un port | Fournisseur non choisi | module `notifications` | Décision requise avant F05 | nclsppr |

### Dépendance de mouvement de la landing

| Dépendance | Classe et consommateur | Besoin couvert | Version et origine | Données et permissions | Dégradation, retrait et réexamen | Propriétaire |
| --- | --- | --- | --- | --- | --- | --- |
| GSAP avec ScrollTrigger | Runtime navigateur optionnel, uniquement `useLandingMotion` | Synchroniser progression, profondeur et récit au scroll sans recalculer le layout dans React | `3.13.0` exact, package `gsap` officiel GreenSock, lock npm avec intégrité SHA-512 | Aucune donnée lue ou transmise, aucun secret, aucun appel réseau applicatif | Import différé ; sans package chargé, les contenus et révélations `IntersectionObserver` restent utilisables. Retrait : supprimer les imports et les animations GSAP, puis `npm uninstall gsap`. Réexamen à chaque mise à jour et avant F05 | nclsppr |

L'API Web Animation et le CSS seuls suffisent aux révélations simples, mais ne
portent pas de façon homogène le scrubbing, le pinning borné et leur nettoyage
responsive. La dépendance reste confinée à une page, sans ADR : elle ne modifie
ni contrat, ni données, ni autre module, et son retrait est local.

### Flux principal

1. L'utilisateur demande un lien magique sans révéler si l'adresse existe.
2. Le backend vérifie l'adresse avant de créer compte, adhésion ou organisation.
3. L'organisation est résolue par invitation exacte ou domaine professionnel.
4. Le titulaire publie un intervalle de disponibilité pour sa place assignée.
5. Un collègue réserve dans une transaction bornée au tenant.
6. PostgreSQL refuse tout chevauchement actif.
7. La réservation et son événement de notification sont commités ensemble.
8. Le worker d'outbox envoie l'email sans pouvoir annuler la réservation.

### Dépendances externes

| Dépendance | Usage | Données transmises | Mode d'échec | Alternative |
| --- | --- | --- | --- | --- |
| Fournisseur email, non choisi | Liens magiques et notifications | Adresse destinataire, type de message, lien court | File d'outbox en attente ; réservation conservée | Mailpit uniquement en développement |
| Hébergement PostgreSQL, non choisi | Données applicatives | Identités minimales, organisations, places, intervalles | Application indisponible en écriture | PostgreSQL local pour développement, pas pour production |
| Atlas et Caddy partagé | Servir la démo statique puis le futur frontend/API | Requêtes, session et journaux minimisés après cutover | Démo indisponible aujourd'hui ; application indisponible après activation | Nouveau commit descendant statique ou release applicative descendante ; handoff de route contrôlé par `vps-infra` |

## Environnements

| Environnement | Plateforme | Configuration canonique | URL ou accès | Vérification |
| --- | --- | --- | --- | --- |
| Développement documentaire | macOS local | Dépôt et lockfile Nimbus | `127.0.0.1:4321` quand lancé | `./scripts/verify.sh` |
| Développement applicatif | Docker Compose sur macOS ou Linux | `compose.yaml`, `.env.example` | Web `5173`, API `8080`, Mailpit `8025`/`1025`, PostgreSQL `5434` | `npm run dev` et `npm run compose:verify` |
| Démo publique | GitHub Pages | `.github/workflows/pages.yml`, base `/parkventory/`, données statiques | `https://nclsppr.github.io/parkventory/` | Tests frontend, build puis probes publics |
| Documentation publique | GitHub Pages | collection Nimbus `product`, base `/parkventory/docs/` | `https://nclsppr.github.io/parkventory/docs/` | Build public, lint, contrôle d'audience et probes HTTP |
| Démo Atlas | Atlas, déploiement contrôlé par `vps-infra` | `.github/workflows/vps-release.yml`, base `/`, données statiques | `https://parkventory.com/` | Snapshot historique avant consolidation : source `583e0e2b63701097aa4894ecc4fb3de8ad325346`, site `sha256:eb4596ac08e76bf59dc0c1ed6982f8cad6a25e98bc09b507790a78107e41553c`, routes `sha256:47673d6906494ed128616357efe305e7be372e06022f4a2a794dcdc164ecbe7a`, apex HTTP 200 et redirection `www` unique vérifiés le 2026-08-18 ; l'état courant se lit dans `vps-infra` et Atlas |
| Candidat applicatif Atlas | GHCR, publié mais non activé | `.github/workflows/application-release.yml`, `infra/images/`, `deploy/vps/` | Aucun accès public dynamique | Première publication historique : run `32071732734` vert ; `application-release@sha256:384f736a81089a9a91a7ff55b21d552a6d803d65ab8e33daa296b54d990209a3` publié et attesté sur `583e0e2b63701097aa4894ecc4fb3de8ad325346` ; chaque push ultérieur publie un nouveau candidat |
| CI | GitHub Actions | `.github/workflows/verify.yml` | Exécuté à chaque push sur `main` | Même commande `verify` |
| Production applicative | Non activée | Contrôleur Compose central désactivé | Aucune URL dynamique ; le domaine sert la démo statique | Base, secrets, migration, cutover exclusif, rollback et probes requis avant ouverture |

### Routes applicatives actuelles

| Route | Responsabilité | Données locales | Comportement Pages |
| --- | --- | --- | --- |
| `/app` | Synthèse et accès aux deux tâches principales | Session, compteurs, prochains créneaux, invitation | Démo statique signalée |
| `/app/partager` | Déclarer une place si nécessaire puis publier son absence | Place assignée et création réelle d'une disponibilité | Démo statique signalée |
| `/app/trouver` | Lire, sélectionner puis confirmer une disponibilité | Agenda réel à sept jours et réservation idempotente | Démo statique signalée |

Les anciens liens `/app?intent=share` et `/app?intent=find` sont remplacés dans
l'historique du navigateur par leur route dédiée. Toute autre route rend une
page 404 explicite.

## Commandes canoniques actuelles

| Action | Commande | Résultat attendu |
| --- | --- | --- |
| Installer les runtimes | `mise install` | Node 24.18, Java 25.0.4 et Python 3.12.13 épinglés |
| Installer l'application | `npm ci` | Dépendances frontend exactes du lockfile |
| Démarrer l'application | `npm run dev` | PostgreSQL, Mailpit, Quarkus et React sains sous Compose sur les ports documentés |
| Arrêter l'application | `npm run compose:down` | Conteneurs et réseau retirés, volumes conservés |
| Supprimer la base locale | `npm run db:reset` | Seul le volume PostgreSQL de développement est retiré après arrêt |
| Vérifier Compose | `npm run compose:verify` | Stack isolée saine et parcours identité, partage, réservation, notification et invitation persisté |
| Installer la documentation | `npm ci --prefix docs-nimbus` | Dépendances exactes du lockfile |
| Développer la documentation | `npm run dev --prefix docs-nimbus` | Nimbus local sur `127.0.0.1:4321` |
| Synchroniser le logo | `npm run brand:sync` | Trois copies SVG exactes et un dérivé PNG Open Graph régénérés |
| Vérifier le logo | `npm run brand:check` | Aucun dérivé public manquant ou divergent |
| Vérifier | `mise exec -- npm run verify` | Documentation, Compose, audit npm, React, Quarkus et matrice PostgreSQL 17.10/18.3 valides |
| Construire la documentation | `npm run build --prefix docs-nimbus` | Site statique dérivé dans `docs-nimbus/dist/` |
| Construire les surfaces Pages | `npm run pages:build` | Frontend statique sous `/parkventory/`, routes directes et documentation Nimbus publique sous `/parkventory/docs/` |
| Construire la démo Atlas | `npm run atlas:build` | Frontend statique à la racine, toujours en mode démo et sans backend |
| Construire les artefacts Atlas | `./scripts/build-vps-release.sh frontend/dist <sortie> <révision>` | Archive et inventaire de routes déterministes liés à un commit complet |
| Vérifier le contrat applicatif | `npm run production:check` | Images, Compose, bundle et descripteur conformes au contrat producteur exact |
| Exercer les images applicatives | `npm run production:images:test` | Frontend/backend non-root, migrateur dédié, santé et runtime PostgreSQL sans DDL |
| Construire le bundle VPS applicatif | `./scripts/build-vps-integration.sh <sortie> <révision>` | Compose app-only, inventaire, migrations V1 à V3 et probes déterministes liés au SHA |

Les commandes manuelles utilisent uniquement les services locaux autorisés.
La démo et la documentation publique GitHub Pages sont déployées automatiquement
depuis `main` dans un artefact unique. La démo Atlas est réconciliée séparément
par `vps-infra` depuis les artefacts immuables du HEAD canonique vert. Ces
surfaces ne constituent pas une production applicative. Le candidat full-stack
est publié dans GHCR, mais aucun backend, base ou migrateur Parkventory n'est
actif sur Atlas tant que les gates de production et le cutover exclusif du
runbook ne sont pas satisfaits.

## Données, sécurité et confidentialité

- Classification : adresses professionnelles, adhésions, affectations,
  disponibilités et réservations sont des données personnelles professionnelles.
- Minimisation : ne jamais collecter motif d'absence, calendrier personnel,
  plaque d'immatriculation ou géolocalisation continue au MVP.
- Secrets : injection par environnement ou gestionnaire de secrets, jamais Git.
- Authentification : lien magique à usage unique puis session serveur.
- Autorisation : backend et base, jamais la seule interface.
- Isolation actuelle : `organization_id`, clés composites et filtres serveur ;
  PostgreSQL RLS reste la défense cible avant pilote.
- Rétention : durée exacte à décider avant pilote ; suppression et export
  requis.
- Sauvegarde : stratégie et restauration isolée obligatoires avant production.
- Logs : identifiants corrélables pseudonymisés, aucun token ni email complet.

Le détail vit dans
[`docs/architecture/security-and-tenancy.md`](docs/architecture/security-and-tenancy.md).

## Qualité

| Risque | Contrôle automatisé | Contrôle manuel | Environnement |
| --- | --- | --- | --- |
| Documentation incohérente | Catalogue, liens, Nimbus build/lint | Navigation et audiences | Local puis CI |
| Double réservation | Test concurrent sur PostgreSQL réel | Scénario de conflit compréhensible | Testcontainers puis préproduction |
| Fuite inter-tenant | Matrice d'autorisation et RLS | Revue des erreurs et logs | Intégration puis préproduction |
| Rejeu de lien magique | Test de consommation atomique et expiration | Parcours lien expiré | Intégration |
| Régression d'interface | Tests composants et E2E | Mobile, desktop, clavier, mouvement réduit | Navigateurs cibles |
| Migration destructive | Flyway sur copie représentative | Revue du plan et restauration isolée | CI puis préproduction |

## Livraison

- Branche canonique : `main`.
- Publication : après chaque tranche validée, committer puis pousser directement
  sur `main` tant que GitHub l'autorise ; si `main` est protégée, pousser une
  branche dédiée et suivre sa revue. Une tranche terminée ne reste pas locale.
- Convention de commit : préfixes `docs:`, `feat:`, `fix:` ou `chore:`.
- Artefact cible : digest OCI `application-release` liant les images
  frontend/backend, le bundle VPS et les inventaires au même SHA.
- Déploiement : la démo statique est active et automatiquement réconciliée ;
  l'ADR-0008 autorise la publication du candidat applicatif, pas son activation
  Compose tant que le runbook n'est pas exécutable.
- Rollback : après une activation statique réussie, publier un nouveau commit
  descendant qui restaure le contenu voulu ; ne pas déplacer manuellement
  `current` vers un ancien digest. Pour l'application, préférer une release
  descendante compatible avec les migrations ; toute restauration reste
  explicitement autorisée et testée.
- Vérification finale : santé, route, parcours critique, logs et observation.
- Observabilité cible : SmallRye Health, logs JSON, Micrometer et supervision externe.
- Escalade : propriétaire du dépôt ; suppléant à nommer avant pilote.

## Responsabilités

| Zone | Propriétaire | Suppléant | Runbook |
| --- | --- | --- | --- |
| Produit, architecture et sécurité | nclsppr | Non nommé | `RUNBOOK.md` pour l'exploitation |
| Documentation et design | nclsppr | Non nommé | `DOCUMENTATION.md` et `DESIGN.md` |
| Production future | nclsppr jusqu'à délégation explicite | À nommer avant pilote | `RUNBOOK.md` |
