# Vision produit

## Thèse

Parkventory transforme l'absence d'un titulaire de place en disponibilité
immédiatement réservable par un collègue, sans demander à l'entreprise de
déployer d'abord un outil ou de nommer un administrateur.

Ce n'est ni une marketplace ni un système de monétisation. La valeur vient d'un
inventaire déjà payé et partiellement inutilisé, rendu visible à la bonne
communauté au bon moment.

## Problème utilisateur

Trois faits se rencontrent :

1. certaines personnes disposent d'une place assignée mais s'absentent ;
2. d'autres collègues viennent au bureau sans place garantie ;
3. l'information circule mal, trop tard ou sans réservation fiable.

Un tableur ou un canal de messagerie peut annoncer une absence, mais ne garantit
ni appartenance à la même entreprise, ni disponibilité couvrant tout
l'intervalle, ni absence de double réservation.

## Promesse

Après vérification de son email professionnel, un membre peut :

- rejoindre l'espace de son entreprise ;
- déclarer la place qui lui est assignée ;
- publier quand elle est libre ;
- trouver et réserver une place proposée ;
- inviter d'autres collègues ;
- utiliser le service même si l'organisation compte zéro administrateur.

L'administration est une capacité optionnelle de gouvernance et
d'enrichissement, pas une précondition à la valeur.

## Principes produit

### Communauté avant configuration

Le premier flux utile ne dépend ni d'un plan de parking, ni d'un import RH, ni
d'une configuration par les services généraux.

### Email vérifié, confiance limitée

Une adresse professionnelle vérifiée est un signal d'appartenance, pas une
preuve juridique absolue. Les invitations exactes, domaines secondaires et
preuves de contrôle du domaine renforcent ce signal sans révéler la communauté.

### Place assignée, jamais possédée

Le vocabulaire produit parle de titulaire ou bénéficiaire d'une place assignée.
Parkventory ne crée aucun droit immobilier et ne transfère aucune propriété.

### Disponibilité réellement réservable

Une disponibilité est un intervalle offert. Une réservation confirmée est
protégée transactionnellement et ne peut pas être invalidée silencieusement.

### Administration réversible

Une organisation accepte zéro, un ou plusieurs administrateurs. Retirer le
dernier administrateur ne bloque pas les usages communautaires.

### Données minimales

Le service n'a pas besoin de connaître le motif d'une absence, le calendrier
personnel complet, la plaque d'un véhicule ou la localisation continue.

## MVP

Le MVP comprend :

- landing page et self-registration passwordless ;
- rattachement à une organisation par invitation ou domaine ;
- site et fuseau horaire ;
- place assignée déclarée par un membre ;
- disponibilité ponctuelle, journée ou intervalle ;
- recherche par site, date et horaires ;
- réservation, annulation et notification ;
- invitations ;
- historique minimal et audit des actions sensibles.

Le MVP ne comprend pas :

- plan graphique du parking ;
- récurrence avancée ;
- SSO d'entreprise ;
- paiement, pricing ou revenus ;
- capteurs, barrières ou plaques ;
- statistiques sociales, remerciements ou classement ;
- application mobile native.

## Validation attendue

La première preuve produit n'est pas un dashboard complet. C'est un parcours
vertical dans lequel :

1. deux personnes d'une même organisation rejoignent le service ;
2. l'une publie sa place ;
3. l'autre la réserve ;
4. une tentative concurrente reçoit un conflit compréhensible ;
5. aucune intervention administrateur ou opérateur n'a été nécessaire.

Les critères de phase et leur ordre sont maintenus dans la roadmap interne du
dépôt. La documentation publique décrit le produit sans inclure ces documents
d'exploitation ou de travail dans la surface Nimbus publique.
