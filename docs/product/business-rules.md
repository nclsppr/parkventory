# Règles métier MVP

| ID | Règle |
| --- | --- |
| ORG-001 | Aucun compte, membre ou tenant n’est créé avant consommation d’un magic link valide. |
| ORG-002 | Un domaine professionnel normalisé correspond à une seule organisation. |
| ORG-003 | Les réponses de demande de lien ne révèlent ni compte ni organisation. |
| ORG-004 | Les domaines personnels connus sont refusés. |
| SPT-001 | Un membre possède au plus une place assignée dans le MVP. |
| SPT-002 | Le libellé d’une place est unique dans l’organisation. |
| AVL-001 | Un créneau futur a un début strictement antérieur à sa fin. |
| AVL-002 | Un membre publie seulement pour sa propre place. |
| AVL-003 | Deux créneaux actifs d’une même place ne se chevauchent pas. |
| AVL-004 | Un créneau réservé ne peut pas être retiré. |
| RSV-001 | Offre, réservataire et place appartiennent à la même organisation. |
| RSV-002 | Le propriétaire ne réserve pas sa propre offre. |
| RSV-003 | Une offre possède au plus une réservation confirmée ; D1 est l’arbitre final. |
| RSV-004 | Une clé d’idempotence rejouée pour la même offre retourne le même succès. |
| RSV-005 | Seul le réservataire annule strictement avant le début. |
| PRV-001 | Aucun motif d’absence, plaque, calendrier ou géolocalisation n’est collecté. |
| PRV-002 | Les tokens, cookies et adresses sont absents des logs applicatifs. |
| LNG-001 | Une préférence de profil accepte uniquement `fr`, `en`, `de` ou `lb` et l’identité du compte vient de la session. |
| LNG-002 | Le sélecteur reste disponible avant connexion sur toute surface publique ; dès qu’une session est reconnue, il disparaît de ces surfaces, apparaît uniquement dans le profil et la base est mise à jour avant la route. |
