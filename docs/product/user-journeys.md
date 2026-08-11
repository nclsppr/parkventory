# Parcours utilisateurs

## 1. Découvrir et demander un accès

1. Le visiteur comprend en une phrase que Parkventory partage les places
   inutilisées entre collègues.
2. Il saisit son email professionnel.
3. Le serveur répond toujours avec un message générique.
4. Si l'adresse est admissible, le fournisseur d'identité envoie un lien
   passwordless à usage court.
5. L'écran explique expiration, nouvel envoi et canal de support sans confirmer
   l'existence d'un compte.

États obligatoires : email vide, invalide, domaine non admissible, envoi,
succès générique, limite de débit, fournisseur indisponible et lien expiré.

## 2. Rejoindre ou créer une organisation

Après authentification et seulement si l'email est marqué vérifié :

1. une invitation exacte non expirée est recherchée ;
2. sinon un domaine déjà rattaché résout l'organisation ;
3. sinon un domaine professionnel admissible crée atomiquement une
   organisation communautaire ;
4. le membre choisit son site et confirme le fuseau proposé ;
5. il peut déclarer une place assignée ou passer cette étape ;
6. il peut inviter un collègue.

Le produit ne révèle jamais le nom, les membres ou l'activité d'une
organisation avant la vérification de l'adresse.

États obligatoires : invitation valide, invitation expirée, domaine partagé,
création concurrente, domaine personnel, organisation suspendue, aucun site et
adhésion multiple.

## 3. Déclarer une place assignée

1. Le membre choisit son site.
2. Il saisit un libellé stable et les attributs qu'il connaît.
3. Il confirme que la place lui est assignée et comprend que cette déclaration
   peut être contestée.
4. Le backend refuse un libellé déjà affecté dans le même site.
5. La place apparaît dans « Mes partages » même sans disponibilité active.

Attributs initiaux possibles : niveau, zone, couverte, électrique, accessible et
instructions courtes. Un attribut réglementé n'accorde jamais à lui seul le
droit de réserver.

## 4. Partager une place

1. Le titulaire choisit sa place.
2. Il sélectionne journée entière ou intervalle.
3. L'interface affiche date, horaires et fuseau.
4. Le backend vérifie affectation, chevauchement et bornes.
5. Un résumé précède la publication.
6. Le succès rend l'offre immédiatement trouvable.

Modifier ou retirer une offre sans réservation active est autorisé. Si une
réservation confirmée serait invalidée, l'action est refusée et propose un flux
d'annulation explicite avec notification.

États obligatoires : aucune place, intervalle invalide, chevauchement, heure
d'été ou d'hiver ambiguë, offre publiée, offre partiellement réservée et retrait
refusé.

## 5. Trouver une place

1. Le membre choisit site, date et horaires.
2. La liste n'affiche que les offres couvrant tout l'intervalle.
3. Il filtre éventuellement les attributs utiles.
4. Chaque résultat indique libellé, emplacement textuel, intervalle et statut.
5. Le futur plan reste un second mode ; la liste demeure canonique et
   accessible.

États obligatoires : aucun résultat, chargement, erreur, nouveaux résultats,
site sans places, filtres trop restrictifs et résultat devenu indisponible.

## 6. Réserver

1. Le membre ouvre une disponibilité.
2. Il vérifie horaires, site, place et instructions.
3. Il confirme une seule fois ; le client envoie une clé d'idempotence.
4. Le backend tente l'insertion dans une transaction.
5. PostgreSQL arbitre les demandes concurrentes.
6. Le succès crée la réservation et l'événement de notification ensemble.
7. Un conflit HTTP `409` explique que la place vient d'être prise et ramène aux
   résultats.

Une panne d'email ne transforme jamais une réservation confirmée en échec.

## 7. Annuler

Le réservataire peut annuler sa réservation avant son début selon une politique
à finaliser avant F04. La place redevient disponible pour l'intervalle libéré et
un événement d'outbox notifie le titulaire.

Le titulaire ne peut pas effacer silencieusement une réservation. Un
administrateur peut intervenir uniquement avec une raison auditée et une
notification.

## 8. Inviter

1. Un membre saisit l'email professionnel du collègue.
2. Le backend vérifie la portée sans révéler d'autre organisation.
3. Une invitation exacte et expirante est créée.
4. Le destinataire rejoint l'organisation après authentification.
5. L'invitation consommée ne peut pas être rejouée.

## 9. Administrer plus tard

Les surfaces d'administration sont absentes pour les non-administrateurs.
Après preuve et promotion, un administrateur gère l'inventaire, les membres et
les futurs plans sans remplacer les capacités communautaires.

## Navigation

Desktop :

- Tableau de bord
- Partager ma place
- Trouver une place
- Mes réservations
- Mes partages
- Collègues
- Paramètres
- Administration, conditionnelle

Mobile : Accueil, Partager et Trouver sont directement accessibles. La
destination Réservations sera ajoutée avec sa route réelle ; les autres
sections passent dans un menu explicite.
