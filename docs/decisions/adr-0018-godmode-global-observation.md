# ADR-0018 — Console godmode globale d’observation

- Statut : accepté
- Statut d’implémentation : candidat local ; migration distante, secret et déploiement non vérifiés
- Date : 2026-08-31
- Décideur : nclsppr
- Portée : identité opérateur, autorisation globale, télémétrie D1 et console d’exploitation
- Complète : [ADR-0017](adr-0017-cloudflare-native.md)

## Contexte

Le parcours membre isole volontairement chaque organisation. Cette frontière ne
permet pas au propriétaire de Parkventory de suivre l’adoption globale, de
retrouver un compte, de comprendre l’activité d’un tenant ou de rapprocher un
incident des entités métier concernées.

La colonne `membership.role` contient déjà `ADMIN`, mais ce rôle reste local à
une organisation et ne doit jamais conférer une lecture inter-tenants. L’identité
de l’unique opérateur est une donnée personnelle : sa valeur ne doit apparaître
ni dans Git, ni dans le frontend, ni dans les journaux. La console doit enfin
rester une surface d’observation ; modifier ou usurper des données de production
élargirait fortement son risque.

## Décision

### Identité et autorisation

Le Worker reçoit le secret `GODMODE_ADMIN_EMAIL_SHA256`, un digest SHA-256
hexadécimal de 64 caractères calculé sur l’adresse opérateur normalisée par
suppression des espaces périphériques et passage en minuscules. L’adresse claire
n’est jamais versionnée. La comparaison du digest calculé et du digest configuré
est faite en temps constant et échoue fermée lorsque le binding est absent ou
mal formé.

L’identité exacte configurée constitue l’unique exception privée au refus des
domaines personnels. Après consommation de son magic link, elle est rattachée à
l’organisation interne `org_system_parkventory`, de type `SYSTEM`, avec le rôle
`ADMIN`. Une requête godmode n’est autorisée que si sa session serveur courante
réunit simultanément les quatre preuves suivantes :

1. l’e-mail normalisé produit le digest configuré ;
2. l’organisation porte `kind = 'SYSTEM'` ;
3. l’adhésion porte `role = 'ADMIN'` ;
4. la session n’est ni expirée ni révoquée.

Le formulaire opérateur marque explicitement sa demande avec `purpose = 'admin'`.
Dans ce mode, une adresse qui ne correspond pas au digest reçoit la réponse
publique non énumérante habituelle, mais ne crée ni demande de lien, ni envoi, ni
tenant. Le mode `tenant` conserve le parcours professionnel existant et ne peut
pas créer une identité `SYSTEM`. Après validation Turnstile, la réponse admin est
un `202` générique immédiat ; la lecture D1, la limite et l’envoi autorisé sont
traités hors de ce chemin de réponse, avec leurs erreurs absorbées et classifiées.
Ni le statut, ni une panne D1, ni la latence d’envoi ne deviennent ainsi un oracle
sur l’adresse autorisée. Le quota horaire est appliqué dans le même
`INSERT … SELECT … WHERE` que la création de la demande, sans fenêtre de course
entre lecture du compteur et écriture.

Un `ADMIN` d’une organisation `TENANT` ne satisfait donc jamais le contrôle
global. Réciproquement, toute route métier de partage ou de réservation exige une
organisation `TENANT` : l’opérateur système ne peut pas agir comme un membre.
L’interface consomme le booléen `godmode` pour le routage, mais ce booléen client
n’est jamais une preuve d’autorisation.

### Surface en lecture seule

La SPA ajoute `/admin`, `/admin/tenants`, `/admin/tenants/:id`,
`/admin/users` et `/admin/operations`. Les lectures correspondantes sont servies
par :

- `GET /api/v1/admin/overview` ;
- `GET /api/v1/admin/tenants` et `GET /api/v1/admin/tenants/:id` ;
- `GET /api/v1/admin/users` ;
- `GET /api/v1/admin/activity` ;
- `GET /api/v1/admin/diagnostics`.

La première livraison ne propose ni impersonation, ni promotion, ni révocation,
ni correction de ligne D1. Une réparation reste une opération séparée, autorisée
et tracée par le runbook. Toute future mutation godmode exigera une nouvelle
décision portant au minimum confirmation, idempotence, validation serveur et
audit avant/après.

Les collections utilisent une pagination par curseur stable, ordonnée par date
puis identifiant, avec une limite serveur bornée. Les recherches et filtres ne
transforment jamais « voir tous les utilisateurs » en réponse non paginée.
Le journal accepte en plus une référence exacte qui correspond à l’identifiant de
l’événement, de l’entité ou de la requête ; les diagnostics lient directement vers
ce filtre pour retrouver un incident ancien au-delà de leur liste récente bornée.

### Registre d’activité D1

La migration additive `0004_godmode_admin.sql` ajoute `organization.kind`,
l’organisation `SYSTEM`, les index de lecture et la table stricte
`activity_event`. Cette table ne contient que : type, instant, sévérité, résultat,
identifiants internes optionnels, route normalisée, identifiant de requête, code
d’erreur classifié et provenance.

Elle exclut explicitement adresses, tokens, cookies, hashes de tokens ou d’IP,
corps de requêtes et messages d’erreur bruts. Trois provenances rendent la preuve
lisible :

- `BACKFILL` reconstruit les créations et transitions historiques à partir des
  dates déjà présentes dans D1 ; ce n’est pas une observation temps réel ;
- `TRIGGER` enregistre atomiquement les futures créations de tenant, adhésions,
  sessions, places, partages et réservations ainsi que les retraits, annulations
  et révocations ;
- `WORKER` consigne les refus d’accès, les règles métier rejetées et les incidents
  classifiés qui n’existent pas comme transition d’une table métier.

Le backfill et les triggers donnent une chronologie durable sans dépendre de la
disponibilité des logs Cloudflare. Les journaux Workers restent utiles au debug
technique, mais ne sont pas présentés comme la source du dashboard.

Les écritures métier postérieures à `0004` sont aussi protégées par des triggers
qui exigent une organisation `TENANT` et la cohérence entre membre, place, offre
et réservation. Les contrôles de diagnostics conservent leur rôle pour les
données historiques et les futures régressions. Tous les refus godmode utilisent
le bucket constant `/api/v1/admin/*` et sont conservés au plus une fois par
adhésion sur cinq minutes, afin d’éviter qu’un membre authentifié ne transforme
le chemin demandé en injection ou la piste d’audit en vecteur de stockage. Les
refus métier sont eux aussi dédupliqués par adhésion, route et code ; seuls les
identifiants d’entité déjà résolus depuis D1 peuvent être conservés.

### Définitions des métriques

Toutes les métriques d’adoption sont calculées sur les organisations `TENANT` ;
l’organisation `SYSTEM` et l’opérateur en sont exclus. Les incidents constituent
une mesure d’exploitation du service complet et ne sont pas attribués
artificiellement à un tenant.

| Mesure | Définition |
| --- | --- |
| Tenants | nombre total d’organisations `TENANT` |
| Utilisateurs | comptes rattachés à une adhésion d’organisation `TENANT` |
| Places | lignes `parking_spot` de tenants |
| Partages | lignes `availability_offer` de tenants, y compris retirées |
| Réservations | lignes `reservation` de tenants, y compris annulées |
| Sessions actives | sessions tenant non révoquées dont l’expiration est future à `generatedAt` |
| Nouveaux tenants/utilisateurs | créations depuis `window.from`, soit J-29 à 00:00 UTC |
| Partages/réservations de période | créations depuis le même `window.from` |
| Utilisateurs actifs à 7 jours | utilisateurs distincts associés à un événement tenant depuis `generatedAt - 7 jours` |
| Utilisateurs actifs à 30 jours | utilisateurs distincts associés à un événement tenant depuis `window.from` |
| Retraits/annulations | événements `SHARE_WITHDRAWN` et `RESERVATION_CANCELLED` depuis `window.from` |
| Ratio réservations / partages | réservations créées divisées par les partages créés dans la fenêtre ; `null` si aucun partage |
| Incidents | tous les événements de sévérité `ERROR` depuis `window.from`, quel que soit leur tenant |
| Dernière activité | maximum `activity_event.occurred_at` dans le périmètre concerné |

La série quotidienne expose 30 jours calendaires en UTC, y compris les jours à
zéro, pour éviter qu’un changement de fuseau du navigateur ne modifie les
agrégats. L’interface affiche la période et l’instant `generatedAt`. Les comptes
d’un tenant et d’un utilisateur restent des totaux factuels ; aucune estimation,
score de santé ou donnée de démonstration n’est inventé.

Les diagnostics distinguent liens magiques en attente ou expirés, sessions tenant
et système actives, sessions révoquées, volume et ancienneté du registre,
incidents des dernières 24 heures et des sept derniers jours, puis contrôles
d’intégrité entre tenants, membres, places, partages et réservations ainsi que
l’unicité et l’absence de données métier dans l’organisation `SYSTEM`. La
référence bornée rendue avec une réponse `500` est conservée comme identifiant
interne de l’incident et permet sa corrélation avec le `request_id`, sans message
d’erreur brut. Un code `UNHANDLED_<empreinte>` dérivé de la cause avec le secret
applicatif permet de regrouper les occurrences identiques sans stocker la pile ;
le client conserve uniquement l’UUID d’incident validé dans son message sûr.

## Sécurité et confidentialité

- chaque route `/api/v1/admin/*` applique le contrôle global côté Worker ;
- les réponses API conservent `Cache-Control: no-store` ;
- les nouveaux liens transportent le jeton à usage unique dans le fragment URL,
  qui n’est pas envoyé au Worker lors du chargement du callback ; la SPA le capte
  puis nettoie immédiatement l’URL avant le `POST` de vérification ;
- les logs d’invocation Cloudflare sont désactivés et seule la journalisation
  applicative structurée, qui conserve une route canonique issue d’une liste ou
  d’un patron interne, jamais le chemin ni la query string bruts, reste activée ;
- les vues godmode utilisateurs, détail tenant et activité peuvent enrichir un
  identifiant interne avec l’adresse de compte déjà conservée ; cette adresse
  n’est jamais écrite dans `activity_event`, les diagnostics ou les logs ;
- une absence de secret, de migration ou de session valide rend la console
  indisponible plutôt que permissive ;
- la route frontend et le booléen `godmode` ne remplacent jamais le contrôle
  serveur ;
- la console reste absente du sitemap et des navigations membre.

La notice de confidentialité couvre déjà le compte, l’historique métier, les
événements de sécurité et les journaux bornés. Ce candidat n’ajoute ni payload
brut ni nouvelle catégorie de donnée personnelle ; une future extension du
ledger ou de sa rétention devra rouvrir cette analyse.

## Livraison et preuves

Les états suivants restent distincts :

1. **candidat local** : migration, Worker, React, tests, typecheck, build et dry-run
   sont cohérents dans le checkout ;
2. **schéma distant prêt** : `0004_godmode_admin.sql` est appliquée et listée sur
   la base de préversion puis sur D1 production ;
3. **configuration prête** : le secret digest est présent dans l’environnement
   ciblé sans que sa valeur ou l’adresse source ne soit exposée ;
4. **déploiement actif** : le Worker et les assets exacts servent `/admin` et les
   routes API ;
5. **parcours prouvé** : un magic link réel de l’identité autorisée ouvre la
   console, tandis qu’une session tenant reçoit `403`.

Workers Builds n’applique pas les migrations D1. La migration doit donc être
appliquée et vérifiée avant toute fusion qui déclenche le Worker dépendant. Un
build vert, une migration appliquée ou un HTTP `200` anonyme ne prouve pas à lui
seul le parcours godmode. Un envoi réel de magic link requiert une confirmation
explicite au moment de l’action.

## Alternatives écartées

- **Réutiliser `membership.role = 'ADMIN'` seul** : ouvrirait la lecture globale
  aux administrateurs de tenants.
- **Coder l’adresse dans le Worker ou le frontend** : versionnerait une donnée
  personnelle et rendrait la rotation moins sûre.
- **Masquer seulement la route dans React** : ne protège aucune donnée API.
- **Lire uniquement les logs Cloudflare** : ne fournit ni historique métier
  durable, ni backfill, ni jointure contrôlée par tenant.
- **Ajouter immédiatement des actions correctrices** : augmente le risque avant
  que les besoins de réparation soient observés et spécifiés.

## Conséquences

Positives : une identité globale unique et révocable, une séparation explicite
des tenants, des métriques réelles, une chronologie redacted et des diagnostics
liés aux entités internes.

Négatives : une migration et un secret supplémentaires, une croissance continue
de `activity_event`, de nouvelles lectures contenant des données personnelles et
une dépendance à des définitions métriques qu’il faudra maintenir. Une politique
de purge automatisée devra être décidée avant que le volume du registre ne rende
la conservation indéfinie disproportionnée.

## Retour arrière

Tant que la migration n’est pas appliquée, retirer le code et le binding candidat
suffit. Après migration, un rollback applicatif peut ignorer les colonnes, la
table et l’organisation additives ; il ne supprime aucune donnée en urgence. Le
secret peut être supprimé pour couper immédiatement tout nouvel accès godmode.
Une suppression de schéma ou d’événements exige une migration ultérieure et une
preuve de sauvegarde, jamais une commande destructive improvisée.
