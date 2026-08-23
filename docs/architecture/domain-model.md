# Modèle de domaine

Ce document décrit les agrégats et invariants cibles. Les migrations Flyway V1
à V3 sont la source exécutable du schéma local ; toute divergence est signalée
et corrigée.

## Vue d'ensemble

```text
UserAccount
  | 1..*
UserEmail
  |
Membership *--1 Organization 1--* OrganizationDomain
  |                         |
  |                         *-- ParkingSite 1--* ParkingSpot
  |                                              |
  |                                              *-- SpotAssignment
  |
  *-- AvailabilityOffer 1--* Reservation

Chaque mutation sensible -> AuditEvent
Chaque notification       -> OutboxEvent
```

## Entités

| Entité | Responsabilité | Identité et invariants majeurs |
| --- | --- | --- |
| `user_account` | Identité Parkventory stable | UUID, sujet OIDC unique, état |
| `user_email` | Adresse vérifiée et historique | Adresse normalisée unique par type, statut vérifié |
| `organization` | Tenant métier | UUID, nom, mode `COMMUNITY` ou gouverné, état |
| `organization_domain` | Rattachement d'un domaine | Domaine IDNA normalisé, unicité active, preuve et statut |
| `membership` | Appartenance et rôle | Organisation + utilisateur uniques, état, rôle `MEMBER` ou `ADMIN` |
| `invitation` | Invitation exacte | Hash de jeton, email cible, expiration, consommation unique |
| `admin_claim` | Première gouvernance | Demandeur, méthode de preuve, état, audit |
| `parking_site` | Lieu de parking | Organisation, nom, fuseau IANA, adresse minimale |
| `parking_spot` | Place stable | Organisation, site, libellé unique actif, attributs |
| `spot_assignment` | Affectation temporelle | Place, membre, intervalle sans contradiction active |
| `availability_offer` | Intervalle partagé | Affectation, début, fin, statut, auteur |
| `reservation` | Droit d'usage temporaire | Place, offre, réservataire, intervalle, statut, idempotence |
| `outbox_event` | Livraison asynchrone fiable | Type, payload minimal, essais, prochaine tentative |
| `outbox_dispatch` | Ordonnancement global du worker | Tenant, identifiant d'événement et échéance uniquement ; aucun payload |
| `audit_event` | Trace de sécurité | Acteur, tenant, action, cible, instant, résultat |

## Identifiants

- UUID généré côté application ou base selon une convention unique.
- Aucun email, domaine, libellé de place ou slug ne sert de clé primaire.
- Les identifiants exposés sont non séquentiels.
- Un libellé peut changer ; l'identifiant de place reste stable pour le futur
  plan et l'historique.

## Tenant

Toutes les tables métier possèdent `organization_id`, y compris offres,
réservations, outbox et audit lorsque l'événement est organisationnel.

Les références importantes utilisent des clés composites :

```text
(organization_id, parking_spot_id)
(organization_id, membership_id)
(organization_id, availability_offer_id)
```

Une contrainte ou clé étrangère empêche ainsi une relation inter-tenant même si
une erreur applicative fournit un identifiant d'une autre organisation.

V3 force RLS sur les tables contenant identités, sessions et données tenant.
`app_session.organization_id` lie la session à son adhésion par une clé étrangère
composite. `outbox_dispatch` est l'exception globale minimale : elle permet au
worker de découvrir un tenant, puis `outbox_event` redevient accessible
uniquement après contexte transactionnel.

## Temps

- Instants persistés en UTC.
- Fuseau IANA sur `parking_site`.
- Intervalles semi-ouverts `[start, end)`.
- La journée entière est calculée dans le fuseau du site.
- Les changements d'heure font partie de la matrice de tests.
- Les règles de rétention utilisent des instants, pas l'heure locale du serveur.

## États

### Organisation

```text
COMMUNITY -> GOVERNED
GOVERNED  -> COMMUNITY
*         -> SUSPENDED
```

`GOVERNED` signifie au moins un administrateur actif. Le retour à `COMMUNITY`
est normal quand le dernier administrateur est retiré.

### Offre

```text
DRAFT -> PUBLISHED -> WITHDRAWN
                   -> EXPIRED
```

Une offre publiée avec réservation confirmée ne passe pas à `WITHDRAWN` par une
suppression silencieuse.

### Réservation

```text
HELD -> CONFIRMED -> CANCELLED
  \-> EXPIRED
```

Le MVP peut omettre `HELD` si aucune confirmation externe ne le nécessite. La
contrainte d'exclusion couvre tous les statuts considérés actifs.

### Invitation

```text
PENDING -> ACCEPTED
        -> EXPIRED
        -> REVOKED
```

La consommation est atomique et idempotente.

## Réservation et contrainte

La base garantit l'absence de chevauchement pour une place et un tenant :

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reservation
ADD CONSTRAINT reservation_no_active_overlap
EXCLUDE USING gist (
  organization_id WITH =,
  parking_spot_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
)
WHERE (status IN ('HELD', 'CONFIRMED'));
```

La migration V1 applique cette contrainte sur PostgreSQL 18. La migration V2
ajoute la même protection aux offres publiées, ainsi que les liens magiques et
sessions locales.

## Idempotence

Une table ou contrainte garantit l'unicité de :

```text
(organization_id, actor_membership_id, command_type, idempotency_key)
```

Le résultat de la première commande peut être rejoué sans créer une seconde
réservation. Les clés expirent selon une rétention documentée.

L'annulation et le retrait utilisent l'état persistant comme résultat
idempotent : rejouer `CANCELLED` ou `WITHDRAWN` retourne un succès sans écrire
un second audit ni un second événement d'outbox. Le détail de ces transitions
vit dans l'ADR-0013.

## Plan de parking futur

F07 pourra ajouter sans changer l'identité d'une place :

- `floor_plan` ;
- `floor_plan_version` ;
- `spot_placement` ;
- coordonnées normalisées `x`, `y`, `width`, `height`, `rotation` ;
- asset de fond versionné avec provenance et droits.

Le placement est une représentation. Il ne devient jamais la seule source de
l'existence ou du statut d'une place.

## Données volontairement absentes

- motif d'absence ;
- calendrier personnel complet ;
- plaque et modèle du véhicule ;
- géolocalisation continue ;
- contenu libre dans l'audit ;
- copie du contenu des emails envoyés ;
- informations RH sans nécessité prouvée.
