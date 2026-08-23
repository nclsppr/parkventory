# Rôles et gouvernance

## Modèle

Un rôle décrit un droit durable dans une organisation. Le fait d'avoir une place
assignée est une capacité métier, pas un rôle privilégié.

| Acteur | Portée | Capacités principales |
| --- | --- | --- |
| Visiteur | Publique | Découvrir le service, demander un lien de connexion |
| Membre | Une organisation | Gérer son profil, réserver, inviter, consulter les disponibilités |
| Titulaire d'une place assignée | Une affectation | Publier et retirer ses propres disponibilités selon les règles |
| Administrateur | Une organisation | Gérer informations, sites, membres, affectations, règles et plans |
| Opérateur Parkventory | Plateforme | Exploiter, assister et restaurer avec accès minimal et audité |

Un utilisateur peut appartenir à plusieurs organisations. Il choisit un tenant
actif parmi ses adhésions ; aucune valeur fournie librement par le navigateur ne
crée une autorisation.

## Organisation communautaire

Une organisation nouvellement créée commence en mode `COMMUNITY` et peut compter
zéro administrateur.

Dans ce mode, un membre peut :

- déclarer une place qui lui est assignée ;
- partager ses propres disponibilités ;
- réserver et annuler ses propres réservations ;
- inviter une adresse du même domaine autorisé ;
- signaler une affectation ou un contenu contesté.

Il ne peut pas :

- lire les données privées d'un autre tenant ;
- modifier une place ou une disponibilité d'un autre membre ;
- renommer l'organisation ou revendiquer un domaine ;
- promouvoir un administrateur ;
- résoudre seul un conflit d'affectation ;
- publier un plan ou changer une règle globale.

## Administration optionnelle

Un administrateur peut :

- corriger le nom de l'organisation et ses informations ;
- gérer sites, niveaux, zones et attributs de places ;
- inviter ou désactiver des adhésions ;
- confirmer, transférer ou retirer une affectation contestée ;
- ajouter ou révoquer d'autres administrateurs ;
- gérer les futurs plans de parking ;
- consulter l'audit nécessaire à ces fonctions.

L'administrateur ne reçoit pas par défaut le droit de lire un motif d'absence,
un calendrier externe, le contenu d'un email ou un secret d'authentification.

## Premier administrateur

Le premier inscrit n'est jamais promu automatiquement.

Quand aucun administrateur n'existe, le premier rôle privilégié exige :

1. une session et une adresse professionnelle vérifiées ;
2. une preuve de contrôle du domaine, de préférence DNS TXT, ou une validation
   opérateur explicitement autorisée et auditée ;
3. une confirmation du périmètre de l'organisation et des domaines associés ;
4. un événement d'audit immuable.

La méthode opérationnelle exacte sera finalisée avant F06. L'absence de cette
fonction ne bloque pas l'usage communautaire.

## Administrateurs suivants et dernier administrateur

- Un administrateur actif peut nommer un autre membre actif.
- La personne promue doit recevoir une notification.
- Une promotion ou révocation prend effet côté backend immédiatement.
- Toute mutation enregistre acteur, tenant, cible, instant et raison structurée.
- Le dernier administrateur peut être retiré ; l'organisation revient en mode
  communautaire au lieu d'être verrouillée.
- La récupération d'un espace sans administrateur suit de nouveau la preuve de
  contrôle du domaine.

## Invitations

- Une invitation exacte prévaut sur la résolution automatique du domaine, mais
  ne peut viser qu'un domaine `CLAIMED` ou `VERIFIED` de l'organisation.
- Elle est limitée à une adresse, une organisation, une expiration et un nombre
  de consommations.
- Une réponse publique ne révèle jamais si l'adresse ou l'organisation existe.
- Un membre peut inviter dans les limites de son organisation ; un
  administrateur peut inviter et gérer les invitations en attente.
- Une invitation ne confère pas automatiquement une place ni un rôle admin.

## Gouvernance d'une affectation

Un membre peut déclarer une place, mais cette déclaration reste contestable.
L'interface doit utiliser « place assignée » et afficher clairement l'auteur de
la déclaration à la personne concernée.

Avant qu'une organisation ait un administrateur :

- un conflit bloque la nouvelle affectation ;
- les offres existantes contestées peuvent être suspendues ;
- l'opérateur n'arbitre qu'avec une autorité explicite et une trace.

Avec un administrateur, toute réaffectation est auditée et ne supprime pas
l'historique des réservations.
