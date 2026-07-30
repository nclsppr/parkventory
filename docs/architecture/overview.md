# Architecture cible

## Décision synthétique

Parkventory utilisera :

- React + TypeScript pour la landing et l'application ;
- Java 25 ;
- Quarkus `3.33.3` LTS au démarrage, revalidé et épinglé en F02 ;
- Maven Wrapper ;
- Quarkus REST et Jackson ;
- Hibernate ORM avec Panache stable en mode impératif ;
- Flyway ;
- PostgreSQL 18 ;
- OpenAPI 3.1 et client TypeScript généré ;
- Testcontainers et ArchUnit ;
- un fournisseur OIDC compatible passwordless email ;
- un fournisseur d'email derrière un port applicatif.

La contrainte produit est explicite : si le backend est Java, il est Quarkus.
Le choix complet est consigné dans
[`ADR-0002`](../decisions/adr-0002-monolithe-quarkus-postgresql.md).

## Pourquoi un monolithe modulaire

Les règles d'organisation, d'affectation, de partage et de réservation ont
besoin d'une transaction locale et d'invariants communs. Les séparer en
microservices ajouterait réseau, cohérence éventuelle, broker et exploitation
avant de résoudre un problème mesuré.

Le backend reste un seul déployable, structuré par modules métier et vérifié par
ArchUnit :

- `identity` : sujet OIDC, compte interne et session ;
- `organizations` : domaines, adhésions, invitations et gouvernance ;
- `parking` : sites, places, affectations et futur placement ;
- `sharing` : offres de disponibilité ;
- `reservations` : réservation, annulation, idempotence et conflits ;
- `notifications` : outbox et livraison ;
- `audit` : événements de sécurité et gouvernance.

Chaque module expose un petit package API interne. Les dépendances forment un
graphe sans cycle ; l'accès direct aux packages internes est refusé par test.

## Topologie

```text
Navigateur
  |
  | HTTPS, même origine
  v
Reverse proxy
  |-- /                 -> frontend React statique
  |-- /api/v1/*         -> Quarkus, JVM Java 25
  |-- /q/health/*       -> probes restreintes
                            |
                            | JDBC
                            v
                        PostgreSQL 18
                            |
                            | outbox
                            v
                     fournisseur email

Quarkus <-> fournisseur OIDC passwordless par Authorization Code Flow
```

Le frontend ne conserve aucun bearer token dans `localStorage`. Quarkus agit
comme application OIDC confidentielle, termine le code flow et maintient la
session via cookie sécurisé.

## Versions cibles au 2026-07-30

| Composant | Cible | Politique |
| --- | --- | --- |
| Java | 25 LTS | Épinglé par `mise.toml`, image et CI |
| Quarkus | `3.33.3` LTS | Latest LTS recommandé pour production à cette date |
| PostgreSQL | 18.x | Patch courant dans l'environnement choisi |
| Node | 24 LTS | Frontend et outillage ; Nimbus accepte au moins 22.12 |
| React | Version stable compatible, à épingler en F02 | Lockfile obligatoire |
| Maven | Wrapper committé | Version déclarée dans le wrapper |

Une version cible n'est pas une version installée. F02 doit revalider les
advisories, épingler les versions exactes et enregistrer les résultats.

## Style d'exécution backend

Le domaine utilise le modèle impératif classique :

- transactions Jakarta via `@Transactional` ;
- Hibernate ORM et JDBC PostgreSQL ;
- contraintes de base comme dernier arbitre ;
- virtual threads uniquement après mesure et support vérifié ;
- aucun Hibernate Reactive au MVP ;
- aucun binaire natif au MVP.

Ce choix favorise la lisibilité des transactions de réservation et réduit le
nombre de paradigmes. Le mode JVM reste simple à exploiter ; un native image
pourra être évalué séparément si démarrage ou mémoire deviennent un problème
mesuré.

## API

- Base : `/api/v1`.
- Format : JSON.
- Contrat canonique : OpenAPI 3.1 versionné sous
  `api/openapi/parkventory.yaml`.
- Erreurs : Problem Details avec code métier stable, corrélation et détail non
  sensible.
- Client React : généré depuis OpenAPI et jamais édité à la main.
- Pagination : curseur stable pour les historiques, pas nécessaire pour les
  petits résultats bornés.
- Dates : ISO 8601 avec instant UTC ; fuseau du site fourni séparément.
- Mutations critiques : en-tête ou champ d'idempotence documenté.

Pas de GraphQL, WebSocket ou SSE au MVP. Un rafraîchissement ciblé après
mutation suffit tant qu'un besoin de temps réel n'est pas prouvé.

## Persistance

- Toutes les migrations passent par Flyway.
- Les tables métier portent `organization_id`.
- Les clés étrangères critiques sont composites avec `organization_id`.
- PostgreSQL Row-Level Security ajoute une défense, sans remplacer les contrôles
  de service.
- Les intervalles utilisent `tstzrange` ou deux colonnes accompagnées d'une
  contrainte d'exclusion équivalente.
- Les réservations actives sont protégées par GiST et `btree_gist`.
- Les suppressions métier sensibles sont logiques ou historisées.

Le modèle détaillé vit dans [`domain-model.md`](domain-model.md).

## Authentification et tenant

Le fournisseur OIDC doit supporter le passwordless email et produire un email
vérifié. Quarkus utilise Authorization Code Flow, PKCE et un cookie de session
chiffré. L'organisation Parkventory n'est pas un tenant OIDC : c'est une
frontière métier interne, ce qui évite une configuration OIDC par entreprise.

Le fournisseur précis reste à décider avant F03 selon coût, région, export,
délivrabilité, sécurité et procédure de retrait.

Le détail vit dans [`security-and-tenancy.md`](security-and-tenancy.md) et
[`ADR-0003`](../decisions/adr-0003-authentication-et-isolation.md).

## Notifications

La mutation métier et un `outbox_event` sont commités ensemble. Un worker
Quarkus :

1. sélectionne un lot avec `FOR UPDATE SKIP LOCKED` ;
2. appelle le port du fournisseur email avec une clé d'idempotence ;
3. marque succès ou prochain essai ;
4. place un échec terminal en diagnostic sans annuler la mutation métier.

Aucun broker n'est nécessaire au MVP.

## Observabilité

- SmallRye Health pour liveness et readiness ;
- logs JSON corrélés sans PII ;
- Micrometer pour métriques techniques et métier à faible cardinalité ;
- traces seulement si un collecteur est réellement exploité ;
- supervision externe indépendante du service ;
- compteurs utiles : demandes de lien, réservations confirmées, conflits,
  backlog outbox et erreurs de tenant, sans email ni identifiant personnel.

## Déploiement initial

La topologie cible reste volontairement petite :

- frontend statique ;
- un conteneur Quarkus JVM immuable ;
- PostgreSQL 18 managé de préférence ;
- reverse proxy TLS ;
- fournisseur OIDC ;
- fournisseur email ;
- sauvegarde et restauration isolée.

Le fournisseur, la région et les commandes ne sont pas choisis. Une ADR
d'exploitation et un runbook exécutable sont requis avant tout provisionnement.

## Contrôles architecturaux attendus

- test ArchUnit des frontières et cycles ;
- diff OpenAPI et génération du client ;
- tests d'intégration sur PostgreSQL réel via Testcontainers ;
- migration aller et restauration isolée ;
- matrice d'autorisation et RLS ;
- réservation concurrente ;
- création concurrente d'organisation par domaine ;
- rejeu et expiration du flux passwordless ;
- image JVM démarrée avec healthchecks ;
- SBOM et scan de dépendances proportionné au risque.

## Références officielles

- [Versions et statut LTS Quarkus](https://quarkus.io/releases/)
- [Support complet de Java 25 introduit avec Quarkus 3.31](https://quarkus.io/blog/quarkus-3-31-released/)
- [Sécurité Quarkus](https://quarkus.io/guides/security-overview)
- [Authorization Code Flow OIDC](https://quarkus.io/guides/security-oidc-code-flow-authentication)
- [Transactions Quarkus](https://quarkus.io/guides/transaction)
- [Flyway avec Quarkus](https://quarkus.io/guides/flyway)
- [Types intervalle PostgreSQL 18](https://www.postgresql.org/docs/18/rangetypes.html)
- [Row-Level Security PostgreSQL 18](https://www.postgresql.org/docs/18/ddl-rowsecurity.html)
