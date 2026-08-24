# ADR-0002 : monolithe Java Quarkus et PostgreSQL

- Statut : remplacé par ADR-0017
- Statut d'implémentation : non commencé
- Date : 2026-07-30
- Dernière vérification : versions officielles consultées le 2026-07-30
- Propriétaire : nclsppr
- Domaine : architecture et données
- Remplace : aucune
- Remplacé par : [ADR-0017](adr-0017-cloudflare-native.md)

## Contexte

Le frontend doit être React. Le backend traite identité, tenants, rôles,
intervalles et réservations concurrentes. Le propriétaire impose que tout
backend Java utilise Quarkus.

La topologie doit rester exploitable par une petite équipe et garantir les
invariants dans une seule transaction.

## Problème à décider

Quelle architecture Quarkus fournit le meilleur équilibre entre vitesse de
livraison, sécurité transactionnelle, modularité et coût d'exploitation ?

## Critères

- Quarkus non négociable pour Java ;
- transactions et contraintes PostgreSQL explicites ;
- authentification standard et remplaçable ;
- modules métier vérifiables ;
- un déploiement simple ;
- migrations et tests reproductibles ;
- chemin d'évolution sans microservices prématurés.

## Options considérées

### Option A : monolithe modulaire Quarkus impératif

Un seul service JVM, Quarkus REST, Hibernate ORM/Panache, JDBC, Flyway,
PostgreSQL et packages métier contrôlés par ArchUnit. Les transactions sont
locales, la topologie petite et les frontières testables.

### Option B : microservices Quarkus

Identité, parking, réservation et notifications deviennent des services
séparés. Le déploiement indépendant est possible, mais il impose contrats
distribués, cohérence éventuelle, réseau, observabilité et reprise avant tout
besoin de charge mesuré.

### Option C : Quarkus réactif de bout en bout

REST réactif, Hibernate Reactive et client PostgreSQL réactif peuvent augmenter
la concurrence avec moins de threads. Les transactions métier et la courbe de
compréhension deviennent plus complexes sans preuve de saturation.

### Option minimale : Backend-as-a-Service

Une plateforme hébergée pourrait accélérer le CRUD, mais l'autorisation objet,
la RLS, les réservations concurrentes, l'outbox et le retrait du fournisseur
resteraient à assembler. Elle ne satisfait pas la contrainte backend retenue.

## Décision

Adopter l'option A :

- Java 25 LTS ;
- Quarkus `3.33.3` LTS comme cible au 2026-07-30 ;
- Maven Wrapper et BOM Quarkus ;
- Quarkus REST/Jackson ;
- Hibernate ORM avec Panache stable et JDBC PostgreSQL ;
- transactions impératives ;
- Flyway ;
- PostgreSQL 18 ;
- OpenAPI 3.1 et client TypeScript généré ;
- Testcontainers et ArchUnit ;
- exécution JVM, sans native image au MVP.

La version exacte sera revalidée puis épinglée en F02. La page officielle
Quarkus recommande le dernier LTS pour la production.

## Conséquences

### Positives

- invariants et outbox dans une transaction locale ;
- stack Java moderne et familière, centrée sur Quarkus ;
- démarrage et mode dev efficaces ;
- modèle déployable sur une petite topologie ;
- PostgreSQL arbitre les collisions.

### Négatives

- frontend TypeScript et backend Java nécessitent un contrat généré ;
- ArchUnit et conventions de packages doivent remplacer les frontières d'un
  framework de modules ;
- une JVM consomme plus au repos qu'un simple runtime statique ;
- l'identité passwordless dépend d'un fournisseur OIDC à choisir.

### Risques

- dérive vers des packages techniques horizontaux ;
- usage de fonctionnalités expérimentales sans besoin ;
- versions cibles présentées comme installées avant F02 ;
- introduction de microservices ou réactif par effet de mode.

## Mise en œuvre

1. Épingler Java, Maven et Quarkus après vérification des advisories.
2. Créer un backend unique et ses modules verticaux.
3. Ajouter PostgreSQL 18 local, Flyway et Testcontainers.
4. Ajouter ArchUnit pour cycles, API internes et dépendances autorisées.
5. Écrire OpenAPI avant ou avec le premier endpoint.
6. Générer le client React depuis le contrat.
7. Étendre `./scripts/verify.sh`.
8. Construire et démarrer l'image JVM de production.

## Vérification

- Commandes : Maven verify, tests ArchUnit, Testcontainers, diff OpenAPI, build
  image et healthcheck ; commandes exactes créées en F02.
- Environnements : local, CI et conteneur Linux.
- Résultat attendu : modules sans cycle, migrations vertes, API conforme,
  image démarrée et probes saines.
- Preuve observée : documentation officielle consultée ; aucun code créé.
- Limites de la preuve : aucune compatibilité applicative n'est encore testée.

## Rollback

Rester sur Quarkus mais revenir au dernier patch LTS vérifié si une mise à jour
échoue. Les modules restent dans un déployable unique. Une extraction future
vers un service n'est autorisée qu'après mesure, ADR et contrat explicite.

## Réexamen

Réexaminer si :

- la dernière LTS ne supporte plus Java 25 ;
- une charge mesurée justifie le réactif ou une extraction ;
- un module exige un cycle non résolvable ;
- les contraintes d'hébergement rendent la JVM impraticable.

## Références

- [Versions Quarkus et recommandation LTS](https://quarkus.io/releases/)
- [Support complet de Java 25 dans Quarkus 3.31](https://quarkus.io/blog/quarkus-3-31-released/)
- [Transactions Quarkus](https://quarkus.io/guides/transaction)
- [Hibernate ORM avec Panache](https://quarkus.io/guides/hibernate-orm-panache)
- [Flyway avec Quarkus](https://quarkus.io/guides/flyway)
- [Architecture cible](../architecture/overview.md)
