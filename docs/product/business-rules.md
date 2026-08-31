# Règles métier MVP

| ID | Règle |
| --- | --- |
| ORG-001 | Aucun compte, membre ou tenant n’est créé avant consommation d’un magic link valide. |
| ORG-002 | Un domaine professionnel normalisé correspond à une seule organisation. |
| ORG-003 | Les réponses de demande de lien ne révèlent ni compte ni organisation. |
| ORG-004 | Les domaines personnels connus sont refusés, sauf pour l’unique identité opérateur dont le digest privé exact est configuré côté Worker ; la réponse ne révèle jamais cette exception. |
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
| ADM-001 | Une lecture godmode exige simultanément le digest opérateur exact, une organisation `SYSTEM`, le rôle `ADMIN` et une session serveur valide. |
| ADM-002 | Le rôle `ADMIN` d’une organisation `TENANT` ne confère aucun accès inter-tenants. |
| ADM-003 | Une identité `SYSTEM` ne peut appeler aucune route métier réservée aux tenants. |
| ADM-004 | La console godmode est en lecture seule ; toute future correction de données exige une décision, une autorisation et un audit séparés. |
| ADM-005 | Le registre d’activité contient uniquement événements classifiés et identifiants internes ; il exclut adresses, tokens, cookies, hashes d’authentification, IP, corps et erreurs brutes. |
| ADM-006 | Tout conflit métier `409` est conservé comme refus classifié et dédupliqué avec tenant, acteur, entité résolue éventuelle, route canonique et code ; toute erreur `500` reçoit un UUID et une empreinte causale sûre. |
| PRV-001 | Aucun motif d’absence, plaque, calendrier ou géolocalisation n’est collecté. |
| PRV-002 | Les tokens, cookies et adresses sont absents des logs applicatifs. |
