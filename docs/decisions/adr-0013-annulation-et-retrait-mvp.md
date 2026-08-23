# ADR-0013 : annulation et retrait dans le parcours public initial

- Statut : accepté
- Statut d'implémentation : implémenté localement, non déployé
- Date : 2026-08-23
- Dernière vérification : gate local complet et revue Chromium du 2026-08-23
- Propriétaire : nclsppr
- Domaine : produit et données
- Remplace : aucune
- Remplacé par : aucune

## Contexte

Une réservation confirmée et une disponibilité publiée ne peuvent pas rester
sans issue pour leurs auteurs. Sans annulation, un collègue garde une place
qu'il n'utilisera plus. Sans retrait, un titulaire laisse réservable un créneau
qui n'est plus valide. Une suppression physique ferait disparaître l'historique
et pourrait invalider silencieusement une réservation active.

Le parcours public initial doit rester petit : il n'introduit ni administration
des réservations, ni motif libre, ni modification d'intervalle, ni page
d'historique paginée.

## Décision

### Annulation par le réservataire

- Seul le membre qui a créé une réservation peut l'annuler.
- Une réservation `CONFIRMED` est annulable strictement avant son début.
- L'annulation passe son statut à `CANCELLED` et ne supprime aucune ligne.
- L'offre reste `PUBLISHED` : son créneau redevient immédiatement réservable.
- La mutation, l'audit et l'événement `RESERVATION_CANCELLED` sont écrits dans
  la même transaction.
- L'outbox notifie le titulaire sans exposer de motif d'absence.
- Rejouer l'annulation d'une réservation déjà annulée retourne un succès sans
  créer de second audit ni de seconde notification.

### Retrait par le titulaire

- Seul le membre qui a publié une disponibilité peut la retirer.
- Une offre `PUBLISHED` ne peut passer à `WITHDRAWN` que si aucune réservation
  `HELD` ou `CONFIRMED` ne la couvre.
- Le retrait conserve l'offre et son audit ; il n'envoie aucun email lorsqu'il
  n'existe aucun réservataire à prévenir.
- Rejouer le retrait d'une offre déjà retirée retourne un succès sans créer de
  second audit.
- Si une réservation est active, le retrait répond `409` et indique que le
  réservataire doit d'abord annuler. Le titulaire ne peut pas annuler à sa
  place dans ce MVP.

### Contrat et interface

- `DELETE /api/v1/reservations/{reservationId}` porte l'annulation.
- `DELETE /api/v1/availability/{availabilityId}` porte le retrait.
- Les transitions sont idempotentes par leur état ; elles n'exigent pas de clé
  d'idempotence supplémentaire.
- Le dashboard expose uniquement l'identifiant de réservation appartenant au
  membre courant, sa relation à chaque créneau et les actions autorisées.
- Les écrans existants « Trouver » et « Partager » affichent ces actions. Une
  confirmation native précède chaque geste destructif ; le bouton est verrouillé
  dès la première soumission.
- Les réponses `401`, `403`, `409`, `429` et `5xx` produisent des messages
  distincts et aucune erreur serveur sensible n'est affichée.

## Conséquences

Le parcours utile peut être corrigé par ses utilisateurs sans opérateur. La
contrainte d'exclusion PostgreSQL considère `CANCELLED` comme inactif et rend
donc le créneau disponible sans migration de schéma.

La politique choisie ne couvre pas une annulation après le début, une action du
titulaire sur une réservation, une raison administrative, une disponibilité
partiellement réservée ou un remboursement. Ces capacités nécessiteront une
décision séparée si des usages réels les justifient.

Le dashboard reste borné aux créneaux actifs des sept prochains jours. Les
statuts retirés et annulés demeurent en base et dans l'audit, mais une page
d'historique paginée est différée.

## Vérification

- parcours Quarkus : réserver, refuser le retrait, refuser l'annulation par un
  autre membre, annuler deux fois, notifier, rendre le créneau disponible,
  retirer deux fois et conserver l'historique ;
- concurrence PostgreSQL : deux réservataires simultanés produisent exactement
  un HTTP `200` et un HTTP `409` ;
- frontend : double soumission bornée, annulation, retrait, messages d'erreur,
  états occupés et contrôles nommés ;
- smoke Compose : réservation, annulation, notification, réouverture du
  créneau puis retrait sur la stack locale complète ;
- contrat OpenAPI `0.4.0` aligné avec les modèles Java et TypeScript.

Ces preuves sont locales à la branche de livraison. Elles ne prouvent ni une
publication d'artefact, ni une activation Compose, ni un déploiement public.

## Déploiement et retour arrière

La migration V4 complète `outbox_dispatch` avec l'identité technique de
l'agrégat afin qu'une notification d'annulation ne dépasse jamais une
confirmation en retry. Elle ne duplique ni payload ni email. Le changement doit
être déployé avec le frontend et le backend du même commit afin que les champs
du dashboard et les actions restent cohérents.

Le retour arrière applicatif conserve les statuts déjà écrits, connus du schéma
V1. Une ancienne version ignore les lignes `CANCELLED` et `WITHDRAWN` dans les
requêtes actives conformément aux contraintes existantes. Le trigger V4 remplit
l'agrégat pour les écritures `outbox_dispatch` de l'ancien runtime : un retour
arrière applicatif reste donc compatible avec le schéma migré, tandis que le
rollback de schéma demeure inutile et interdit en production.

## Réexamen

Réexaminer cette décision si :

- une annulation après le début devient nécessaire ;
- le titulaire ou un administrateur doit déplacer ou annuler une réservation ;
- une offre porte plusieurs réservations partielles ;
- les utilisateurs demandent un historique ou une restauration en libre-service.

## Références

- [Parcours utilisateurs](../product/user-journeys.md)
- [Règles métier](../product/business-rules.md)
- [ADR-0004 : intégrité temporelle des réservations](adr-0004-integrite-temporelle-reservations.md)
- [Modèle de domaine](../architecture/domain-model.md)
