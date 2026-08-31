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
| ADM-004 | Le godmode peut uniquement promouvoir ou rétrograder une adhésion d’un tenant ; les données métier restent en lecture seule. |
| ADM-005 | Le registre d’activité contient uniquement événements classifiés et identifiants internes ; il exclut adresses, tokens, cookies, hashes d’authentification, IP, corps et erreurs brutes. |
| ADM-006 | Tout conflit métier `409` est conservé comme refus classifié et dédupliqué avec tenant, acteur, entité résolue éventuelle, route canonique et code ; toute erreur `500` reçoit un UUID et une empreinte causale sûre. |
| TAD-001 | Toute route tenant-admin déduit l’organisation de la session et refuse `SYSTEM`, `MEMBER` et toute tentative inter-tenant. |
| TAD-002 | Seul le godmode nomme ou révoque un administrateur de tenant. |
| TAD-003 | Un administrateur de tenant choisit deux couleurs `#RRGGBB`; les couleurs de texte et encres accessibles sont dérivées par le Worker. |
| TAD-004 | Un logo de tenant peut seulement être activé s’il est déjà stocké comme asset de même origine autorisé par Parkventory. |
| TAD-005 | L’effacement d’e-mail refuse le compte courant, tout `ADMIN` et tout compte multi-tenant ; il révoque les sessions, pseudonymise l’adresse et conserve les faits métier. |
| TAD-006 | Une future connexion vérifiée avec l’adresse effacée réactive le même identifiant utilisateur et la même adhésion. |
| PRV-001 | Aucun motif d’absence, plaque, calendrier ou géolocalisation n’est collecté. |
| PRV-002 | Les tokens, cookies et adresses sont absents des logs applicatifs. |
| LNG-001 | Une préférence de profil accepte uniquement `fr`, `en`, `de` ou `lb` et l’identité du compte vient de la session. |
| LNG-002 | Le sélecteur reste disponible avant connexion sur toute surface publique ; dès qu’une session est reconnue, il disparaît de ces surfaces, apparaît uniquement dans le profil et la base est mise à jour avant la route. |
