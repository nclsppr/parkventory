# PROJECT.md

## Identité

| Champ | Valeur |
| --- | --- |
| Nom | Parkventory |
| Propriétaire | nclsppr |
| Classe | Critique |
| Surface de production | Aucune ; prototype local et démo statique publique au 2026-07-30 |
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
| Parcours autonome complet | Aucun produit livré | Une entreprise pilote exécute inscription, partage et réservation sans opérateur | Test E2E de la phase F04 | Sortie F04 |
| Intégrité d'une réservation concurrente | Aucun test | Deux demandes simultanées produisent un succès et un conflit explicite | Test d'intégration PostgreSQL | Sortie F04 |
| Isolation des organisations | Aucun test | Zéro lecture ou mutation inter-tenant dans la matrice d'autorisation | Tests d'intégration et RLS | Sortie F03 |
| Accessibilité du parcours critique | Aucune interface | WCAG 2.2 AA, clavier et mobile vérifiés | Matrice de `DESIGN.md` | Sortie F05 |
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
| Contrat API | `api/openapi/parkventory.yaml` | normative cible | Créé avec le backend |
| Schéma de données | [`docs/architecture/domain-model.md`](docs/architecture/domain-model.md) et `backend/src/main/resources/db/migration/` | normative et opérationnelle | Migration V1 testée sur PostgreSQL 18.3 |
| Sécurité et isolation | [`docs/architecture/security-and-tenancy.md`](docs/architecture/security-and-tenancy.md) | normative | Défense en profondeur |
| Design system | [`DESIGN.md`](DESIGN.md) et `frontend/src/styles.css` | normative et opérationnelle | Tokens, composants et responsive alignés |
| Configuration | `mise.toml`, `mise.lock`, `.env.example`, `compose.yaml` | opérationnelle | Runtimes et image PostgreSQL épinglés |
| Code livré | `frontend/` et `backend/` | opérationnelle locale | Prototype démo, pas flux F03/F04 |
| Opérations | [`RUNBOOK.md`](RUNBOOK.md) | normative cible | Production non provisionnée |
| Décisions | `docs/decisions/` | normative | ADR acceptées ou proposées |
| Documentation | `DOCUMENTATION.md`, `documentation.json`, `docs-nimbus/` et catalogue | normative et dérivée | Markdown canonique |
| Références visuelles | [`docs/references/visual-sources.md`](docs/references/visual-sources.md) | référence | JPEG non publiables sans droits |
| Artefacts générés | Catalogue Nimbus, site Nimbus, futur client TypeScript et futurs SVG | dérivée | Sources et commandes à conserver |
| Archives | Aucune | historique | Ne pas créer sans motif |
| Démonstration locale | Données API portant `demo: true` | expérimentale intégrée et signalée | Retirée ou remplacée par les parcours réels avant pilote |

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
| Documentation Nimbus | Rendu des Markdown classés | Actuel | Build local | Nimbus 0.8.2 | `docs-nimbus/` | `./scripts/verify.sh`, 2026-07-30 après exécution | nclsppr |
| Frontend React | Landing et application | Actuel, local et démo publique | Navigateur | React 19.2.8, Vite 8.1.5 | `frontend/` | 4 tests et builds racine/sous-chemin, 2026-07-30 | nclsppr |
| API Java | Démo REST, validation, santé et OpenAPI | Actuel, local | JVM Java 25 | Quarkus 3.33.3 LTS | `backend/` | 4 tests Quarkus, 2026-07-30 | nclsppr |
| PostgreSQL | Schéma et contraintes temporelles | Actuel, local | Compose et Testcontainers | PostgreSQL 18.3 | migration Flyway V1 | Migration appliquée sur PostgreSQL réel, 2026-07-30 | nclsppr |
| Livraison email | Magic links et notifications | Cible | Service externe derrière un port | Fournisseur non choisi | module `notifications` | Décision requise avant F03 | nclsppr |

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
| Hébergement web/API, non choisi | Servir l'application | Requêtes, session, journaux minimisés | Indisponibilité du service | Redéployer l'artefact immuable précédent |

## Environnements

| Environnement | Plateforme | Configuration canonique | URL ou accès | Vérification |
| --- | --- | --- | --- | --- |
| Développement documentaire | macOS local | Dépôt et lockfile Nimbus | `127.0.0.1:4321` quand lancé | `./scripts/verify.sh` |
| Développement applicatif | macOS local | `mise.toml`, `mise.lock`, `.env.example`, `compose.yaml` | `127.0.0.1:5173` et `127.0.0.1:8080` | `npm run dev`, tests et revue navigateur |
| Démo publique | GitHub Pages | `.github/workflows/pages.yml`, base `/parkventory/`, données statiques | `https://nclsppr.github.io/parkventory/` | Tests frontend, build puis probes publics |
| CI | GitHub Actions | `.github/workflows/verify.yml` | Exécuté à chaque push sur `main` | Même commande `verify` |
| Production | Non provisionnée | Décision d'exploitation future | Aucune URL | Runbook et probes requis avant ouverture |

## Commandes canoniques actuelles

| Action | Commande | Résultat attendu |
| --- | --- | --- |
| Installer les runtimes | `mise install` | Node 24.18, Java 25.0.4 et Python 3.12.13 épinglés |
| Installer l'application | `npm ci` | Dépendances frontend exactes du lockfile |
| Démarrer l'application | `npm run dev` | PostgreSQL, Quarkus puis React sur les ports locaux documentés |
| Arrêter et supprimer les données locales | `npm run db:reset` | Conteneur et volume PostgreSQL local retirés |
| Installer la documentation | `npm ci --prefix docs-nimbus` | Dépendances exactes du lockfile |
| Développer la documentation | `npm run dev --prefix docs-nimbus` | Nimbus local sur `127.0.0.1:4321` |
| Vérifier | `mise exec -- npm run verify` | Documentation, audit npm, React, Quarkus et migration PostgreSQL valides |
| Construire la documentation | `npm run build --prefix docs-nimbus` | Site statique dérivé dans `docs-nimbus/dist/` |
| Construire la démo Pages | `VITE_BASE_PATH=/parkventory/ VITE_DEMO_MODE=true npm run frontend:build` | Frontend statique sous le chemin public, sans appel backend |

Les commandes manuelles utilisent uniquement les services locaux autorisés.
La démo GitHub Pages est déployée automatiquement depuis `main`; elle ne
constitue pas une cible de production. Aucun déploiement backend n'existe tant
qu'une cible de production n'est pas explicitement décidée et autorisée.

## Données, sécurité et confidentialité

- Classification : adresses professionnelles, adhésions, affectations,
  disponibilités et réservations sont des données personnelles professionnelles.
- Minimisation : ne jamais collecter motif d'absence, calendrier personnel,
  plaque d'immatriculation ou géolocalisation continue au MVP.
- Secrets : injection par environnement ou gestionnaire de secrets, jamais Git.
- Authentification : lien magique à usage unique puis session serveur.
- Autorisation : backend et base, jamais la seule interface.
- Isolation : `organization_id`, clés composites et PostgreSQL RLS.
- Rétention : durée exacte à décider avant F03 ; suppression et export requis.
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
- Artefact cible : frontend statique et image OCI backend identifiés par SHA ou digest.
- Déploiement : aucun tant qu'une ADR d'exploitation et le runbook ne sont pas exécutables.
- Rollback : retour à l'artefact immuable précédent ; migrations corrigées vers
  l'avant sauf restauration autorisée et testée.
- Vérification finale : santé, route, parcours critique, logs et observation.
- Observabilité cible : SmallRye Health, logs JSON, Micrometer et supervision externe.
- Escalade : propriétaire du dépôt ; suppléant à nommer avant pilote.

## Responsabilités

| Zone | Propriétaire | Suppléant | Runbook |
| --- | --- | --- | --- |
| Produit, architecture et sécurité | nclsppr | Non nommé | `RUNBOOK.md` pour l'exploitation |
| Documentation et design | nclsppr | Non nommé | `DOCUMENTATION.md` et `DESIGN.md` |
| Production future | nclsppr jusqu'à délégation explicite | À nommer avant pilote | `RUNBOOK.md` |
