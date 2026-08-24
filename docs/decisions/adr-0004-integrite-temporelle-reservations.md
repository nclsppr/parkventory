# ADR-0004 : intégrité temporelle des réservations dans PostgreSQL

- Statut : remplacé par ADR-0017
- Statut d'implémentation : partiellement implémenté ; arbitrage concurrent,
  idempotence et annulation vérifiés, matrice DST encore ouverte
- Date : 2026-07-30
- Dernière vérification : documentation PostgreSQL 18 consultée le 2026-07-30
- Propriétaire : nclsppr
- Domaine : données
- Remplace : aucune
- Remplacé par : [ADR-0017](adr-0017-cloudflare-native.md)

## Contexte

Deux collègues peuvent tenter de réserver la même place presque simultanément.
Une vérification « encore disponible » suivie d'une insertion laisse une fenêtre
de course. Le serveur, le frontend et un cache ne sont pas les arbitres finaux
d'une contrainte durable.

Les journées de parking traversent aussi fuseaux et changements d'heure.

## Problème à décider

Comment représenter les intervalles et garantir qu'une place n'a jamais deux
réservations actives qui se chevauchent ?

## Critères

- garantie sous concurrence réelle ;
- fuseaux et heure d'été explicites ;
- erreur métier stable ;
- transactions simples ;
- idempotence des retries ;
- historique conservé ;
- aucune dépendance à un cache ou verrou distribué.

## Options considérées

### Option A : vérification applicative avant insertion

Simple à lire, mais deux transactions peuvent observer la même disponibilité et
insérer toutes les deux.

### Option B : verrou pessimiste de la place

Le verrou sérialise les réservations d'une place. Il fonctionne si tous les
chemins respectent la même discipline, mais une nouvelle écriture peut oublier
le verrou et les requêtes sont plus couplées.

### Option C : contrainte d'exclusion PostgreSQL

Une contrainte GiST combine tenant, place et intervalle. Toute écriture, quel que
soit le chemin applicatif, est refusée si elle chevauche une réservation active.

### Option minimale : réservation à la journée

Une clé unique place + date simplifie la concurrence mais empêche les partages
par intervalle demandés par le produit.

## Décision

Adopter l'option C, complétée par un verrou de l'offre pendant la commande.

- Instants UTC et fuseau IANA sur le site.
- Intervalles semi-ouverts `[start, end)`.
- `tstzrange` ou expression équivalente dans une contrainte d'exclusion.
- `btree_gist` pour combiner UUID/scalaires et chevauchement.
- Statuts actifs explicitement listés.
- Clé d'idempotence par tenant, acteur et commande.
- Conflit d'exclusion converti en HTTP `409`.
- Réservation et événement d'outbox dans la même transaction.

Forme cible :

```sql
EXCLUDE USING gist (
  organization_id WITH =,
  parking_spot_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
)
WHERE (status IN ('HELD', 'CONFIRMED'));
```

## Conséquences

### Positives

- garantie indépendante d'un chemin de code ;
- modèle naturel pour les recherches de chevauchement ;
- conflits fiables sous concurrence ;
- pas de service de verrou distribué.

### Négatives

- dépendance volontaire aux capacités PostgreSQL ;
- migration et extension `btree_gist` à gérer ;
- traduction propre de l'erreur SQL nécessaire ;
- tests sur une vraie base obligatoires.

### Risques

- statuts actifs mal alignés avec la contrainte ;
- instant local converti deux fois ;
- retrait d'offre concurrent avec réservation ;
- retry créant deux commandes faute d'idempotence.

## Mise en œuvre

1. Créer types, checks de bornes et extension via Flyway.
2. Ajouter la contrainte d'exclusion partielle.
3. Verrouiller l'offre avant validation et insertion.
4. Insérer réservation et outbox dans une transaction.
5. Mapper la violation nommée vers un code métier `reservation_conflict`.
6. Ajouter l'idempotence et la reprise du résultat.
7. Tester heures d'été, bornes adjacentes et retraits concurrents.

## Vérification

- Commandes : test d'intégration parallèle sur PostgreSQL 18 via Testcontainers.
- Environnements : local et CI Linux.
- Résultat attendu : exactement un succès, un conflit `409`, aucune ligne
  chevauchante ; deux intervalles adjacents sont acceptés.
- Preuve observée : migrations V1 à V5 appliquées sur PostgreSQL 18.3 ; deux
  requêtes HTTP concurrentes vers la même offre produisent exactement un succès
  et un conflit `409`. L'annulation et le retrait idempotents sont couverts par
  le parcours d'intégration de l'ADR-0013.
- Limites de la preuve : la matrice complète des bornes adjacentes, des heures
  d'été/hiver et d'un retrait strictement concurrent à la réservation reste à
  exécuter ; aucune migration ni requête de production n'est prouvée.

## Rollback

Revenir à la dernière migration et version applicative compatibles uniquement
sur une base isolée ou non ouverte. En production, préférer une migration de
correction vers l'avant. Ne jamais retirer la contrainte avant qu'une protection
équivalente soit déployée et testée.

## Réexamen

Réexaminer si :

- le produit abandonne les intervalles au profit d'une journée entière ;
- plusieurs bases doivent accepter une même réservation ;
- la contention d'une place devient mesurable ;
- un nouveau statut doit être considéré actif.

## Références

- [Types intervalle PostgreSQL 18](https://www.postgresql.org/docs/18/rangetypes.html)
- [Règles métier](../product/business-rules.md)
- [Modèle de domaine](../architecture/domain-model.md)
- [ADR-0013 : annulation et retrait dans le parcours public initial](adr-0013-annulation-et-retrait-mvp.md)
