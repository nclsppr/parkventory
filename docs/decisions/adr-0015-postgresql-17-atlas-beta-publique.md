# ADR-0015 — PostgreSQL 17 Atlas pour la bêta publique

- Statut : accepté
- Statut d'implémentation : sélection contractuelle ; base Atlas non créée
- Date : 2026-08-23
- Décideur : nclsppr
- Portée : base de production de la bêta publique
- Complète : [ADR-0002](adr-0002-monolithe-quarkus-postgresql.md) et [ADR-0009](adr-0009-rls-et-contextes-tenant-transactionnels.md)

## Contexte

Le développement local utilise PostgreSQL 18.3. Atlas exploite déjà un cluster
partagé PostgreSQL 17.10, isolé par base, rôles et réseaux applicatifs. Attendre
un second cluster PostgreSQL 18 retarderait l'ouverture sans répondre à un
besoin produit observé.

Les migrations V1 à V4, les exclusions temporelles, la RLS forcée, le runtime
non propriétaire et le parcours métier complet sont exercés sur les images
exactes PostgreSQL 17.10 et 18.3. La reprise V3 vers V4 est également testée sur
une base non vide avec un migrateur propriétaire `NOSUPERUSER` et
`NOBYPASSRLS`.

## Décision

Sélectionner PostgreSQL 17.10 sur le cluster partagé Atlas pour la production de
la bêta publique. PostgreSQL 18.3 reste la baseline locale et la seconde variante
de compatibilité.

- L'image Atlas reste verrouillée au digest de plateforme ; Parkventory ne
  démarre pas son propre conteneur PostgreSQL.
- `parkventory_migrator` possède la base et applique Flyway avant le runtime.
- `parkventory_runtime` reste non propriétaire, non superutilisateur, sans
  `BYPASSRLS` et limité aux droits DML nécessaires.
- La base, les deux rôles, les secrets, le réseau et les sauvegardes restent
  pilotés par `vps-infra`, pas par le dépôt applicatif.
- L'activation exige toujours une sauvegarde chiffrée hors site et une
  restauration isolée réussie. La sélection de version ne vaut ni création de
  base ni cutover.
- Chaque mise à jour de patch ou de digest rejoue la matrice et les preuves de
  migration avant admission.

## Conséquences

La bêta réutilise la plateforme disponible et ouvre plus vite. Elle accepte une
différence de version majeure entre production et développement, compensée par
la matrice sur digests exacts. Aucune fonctionnalité Parkventory ne dépend
actuellement d'une capacité exclusive à PostgreSQL 18.

PostgreSQL 18 pourra remplacer la cible Atlas lors d'une maintenance planifiée,
après test de restauration et preuve de compatibilité. Cette évolution n'est
pas une condition de lancement.

## Vérification

Le contrat `backend/postgres-compatibility.json` fixe
`atlas-shared-cluster-production` à 17.10 et conserve 18.3 comme baseline. La
gate refuse une décision redevenue indéterminée, rejoue V1 puis V4 sur une base
non vide avec le rôle migrateur réel, exécute la suite Quarkus complète et
répète le parcours sous rôle runtime RLS sur les deux versions.

La preuve locale du 2026-08-23 est verte. La compatibilité et la restauration
sur Atlas restent à prouver pendant la préparation live, avant activation.

## Retour arrière

Avant le cutover, abandonner la base préparée et laisser la démo statique
propriétaire de la route. Après le cutover, restaurer le dernier backup vérifié
dans une base isolée et redéployer la même release applicative ; ne pas
rétrograder le schéma Flyway ni désactiver la RLS.

## Réexamen

Réexaminer lors d'une fin de support PostgreSQL 17, d'une mise à niveau du
cluster partagé, d'un besoin exclusif à PostgreSQL 18 ou d'une incompatibilité
observée sur Atlas.
