# Règles métier

Les identifiants servent de base aux tests d'acceptation. Une évolution qui
change durablement une règle structurante exige une ADR.

## Identité et organisation

| ID | Règle |
| --- | --- |
| ORG-001 | Aucun compte actif, adhésion ou tenant n'est créé avant vérification de l'adresse. |
| ORG-002 | Toute réponse de demande de connexion ou d'invitation reste anti-énumération. |
| ORG-003 | Une invitation exacte valide prévaut sur le domaine. |
| ORG-004 | Un domaine professionnel normalisé n'appartient qu'à une organisation active à un instant donné. |
| ORG-005 | Deux premières inscriptions concurrentes du même domaine créent une seule organisation. |
| ORG-006 | Les domaines personnels et jetables sont refusés au MVP. |
| ORG-007 | L'alias `+` d'une adresse n'est jamais supprimé automatiquement. |
| ORG-008 | Un utilisateur peut avoir plusieurs adhésions, mais toute commande possède un tenant actif explicite et autorisé. |
| ORG-009 | Une organisation peut fonctionner avec zéro administrateur. |
| ORG-010 | Le premier inscrit n'est jamais administrateur par défaut. |
| ORG-011 | Un compte ou une adhésion suspendus ne sont jamais réactivés automatiquement par une nouvelle connexion. |
| ORG-012 | Les domaines professionnels inconnus sont admis par défaut ; seuls les domaines personnels, jetables ou racines partagées de la denylist versionnée sont refusés. |

## Places et affectations

| ID | Règle |
| --- | --- |
| SPT-001 | Une place possède un identifiant stable indépendant de son libellé ou futur placement. |
| SPT-002 | Un libellé de place est unique dans un site actif. |
| SPT-003 | Une affectation lie une place à un membre sur une période ; elle ne représente pas une propriété. |
| SPT-004 | Un membre publie uniquement pour une affectation active qui le concerne. |
| SPT-005 | Deux affectations actives contradictoires sur la même place sont refusées ou suspendues pour arbitrage. |
| SPT-006 | Une réaffectation ne supprime jamais l'historique des réservations. |
| SPT-007 | Les attributs accessible, électrique ou visiteur n'accordent pas à eux seuls l'éligibilité. |

## Disponibilités

| ID | Règle |
| --- | --- |
| AVL-001 | Une offre possède un début strictement antérieur à sa fin. |
| AVL-002 | Un intervalle métier est semi-ouvert : début inclus, fin exclue. |
| AVL-003 | Les instants sont stockés en UTC ; le site conserve un fuseau IANA. |
| AVL-004 | Une offre ne chevauche pas une autre offre active du même titulaire pour la même place. |
| AVL-005 | Une offre retirée n'est plus réservable mais reste traçable. |
| AVL-006 | Une offre couvrant une réservation confirmée ne peut pas être retirée silencieusement. |
| AVL-007 | La journée entière est convertie depuis le calendrier et le fuseau du site, jamais en durée fixe de vingt-quatre heures. |

## Réservations

| ID | Règle |
| --- | --- |
| RSV-001 | Une réservation appartient à la même organisation que la place, l'offre et le réservataire. |
| RSV-002 | L'intervalle réservé est entièrement contenu dans l'offre active. |
| RSV-003 | Deux réservations actives d'une même place ne se chevauchent jamais. |
| RSV-004 | La base de données, pas un contrôle préalable du client, est l'arbitre final des collisions. |
| RSV-005 | Une commande de réservation possède une clé d'idempotence unique par organisation et acteur. |
| RSV-006 | Un conflit concurrent devient une réponse HTTP `409` stable et compréhensible. |
| RSV-007 | Une annulation conserve l'historique et peut remettre l'intervalle en disponibilité. |
| RSV-008 | Une panne de notification ne modifie pas le statut métier déjà commité. |
| RSV-009 | Une action administrative sur une réservation exige une raison et un audit. |

## Gouvernance

| ID | Règle |
| --- | --- |
| GOV-001 | Un administrateur existant peut promouvoir ou révoquer un membre actif de son organisation. |
| GOV-002 | Sans administrateur, la première promotion exige une preuve de contrôle du domaine ou une validation opérateur autorisée. |
| GOV-003 | Promotion, révocation, rattachement de domaine et réaffectation sont audités. |
| GOV-004 | Retirer le dernier administrateur remet l'organisation en mode communautaire. |
| GOV-005 | Un rôle fourni par le frontend ou un token non recoupé avec la base n'accorde aucun droit. |

## Confidentialité

| ID | Règle |
| --- | --- |
| PRV-001 | Aucun motif d'absence n'est collecté. |
| PRV-002 | Les membres ne voient que les données nécessaires au partage et à la réservation. |
| PRV-003 | Emails complets, tokens et identifiants de session sont absents des logs. |
| PRV-004 | Les événements d'audit contiennent acteur, tenant, action, cible, instant et résultat, sans contenu libre inutile. |
| PRV-005 | Export, suppression et rétention sont définis avant tout pilote réel. |
| PRV-006 | L'existence d'une organisation ou d'un membre n'est pas révélée à un visiteur non vérifié. |

## Notifications

| ID | Règle |
| --- | --- |
| NTF-001 | L'événement de notification et la mutation métier sont écrits dans la même transaction. |
| NTF-002 | Un worker reprend les événements avec backoff et idempotence. |
| NTF-003 | Un email ne contient que les informations nécessaires et aucun motif d'absence. |
| NTF-004 | L'échec terminal est visible à l'opérateur sans bloquer le domaine métier. |
