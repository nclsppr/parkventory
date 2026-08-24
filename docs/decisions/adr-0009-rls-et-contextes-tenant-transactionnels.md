# ADR-0009 : RLS forcée et contextes tenant transactionnels

- Statut : remplacé par ADR-0017
- Statut d'implémentation : implémenté et vérifié localement
- Date : 2026-08-18
- Dernière vérification : PostgreSQL 17.10 et 18.3, rôles migrateur et runtime compris, le 2026-08-23
- Propriétaire : nclsppr
- Domaine : sécurité, données et exploitation
- Remplace : aucune
- Remplacé par : [ADR-0017](adr-0017-cloudflare-native.md)

## Contexte

Les filtres `organization_id` et les clés étrangères composites protègent déjà
les parcours métier, mais une requête applicative oubliant son filtre pourrait
encore lire ou modifier une autre organisation. L'ADR-0003 demande donc une
seconde barrière PostgreSQL avec un rôle runtime non propriétaire, un contexte
transactionnel et des politiques RLS forcées.

L'identité pose deux frontières particulières. Une identité vérifiée doit
retrouver une invitation exacte ou le tenant lié à son domaine avant de
connaître `organization_id`. Une session doit retrouver son tenant à partir du
hash opaque de son cookie avant de lire l'organisation et l'adhésion. Le worker
outbox doit enfin découvrir le prochain tenant sans lire les payloads des autres
organisations.

## Décision

La migration Flyway V3 active et force RLS sur les tables métier, d'identité,
de session, d'audit et d'outbox. Le runtime de production doit être différent du
propriétaire des tables, sans `SUPERUSER` ni `BYPASSRLS`.

Chaque service métier ouvre une transaction, autorise l'identité ou la session,
puis positionne `app.organization_id` avec `set_config(..., true)`, équivalent à
un `SET LOCAL`. Les politiques comparent chaque ligne à cette valeur et ne voient
aucune ligne quand elle manque, est vide ou désigne un autre tenant. Le helper
Java refuse de poser un contexte sur une connexion en autocommit afin d'éviter
qu'il soit immédiatement perdu ou qu'il survive à la transaction attendue.

Les exceptions nécessaires sont minimales et transactionnelles :

- `magic_link_request` n'est visible que pour l'email demandé ou le hash du lien
  en cours de consommation ;
- `app_session` n'est visible et révocable que pour le hash du cookie courant,
  et une création exige le tenant et l'utilisateur déjà résolus ;
- `user_account` et `user_email` sont bornés à l'identité vérifiée, à
  l'utilisateur courant ou aux membres du tenant actif ;
- `invitation` permet seulement de lire une invitation active correspondant à
  l'email vérifié ; sa mutation exige ensuite le contexte tenant ;
- `organization_domain` permet seulement de résoudre le domaine de l'identité
  vérifiée ; aucune autre donnée d'organisation n'est révélée avant le contexte ;
- `outbox_dispatch` reste une file globale sans RLS, mais ne contient que le
  tenant, l'identifiant technique de l'événement et sa date de disponibilité.
  Le payload demeure dans `outbox_event` sous RLS. Le worker verrouille une
  entrée de dispatch, pose son tenant, puis lit et met à jour l'événement.

Les réglages bootstrap ne constituent pas une preuve d'identité. Seul un
adaptateur ayant déjà vérifié l'identité peut les poser. Le lien magique local
le fait après consommation du jeton. Le futur adaptateur OIDC utilisera la même
frontière après validation de `issuer`, `subject` et `email_verified` ; les
politiques ne dépendent donc pas de Mailpit ni d'un fournisseur OIDC particulier.

## Conséquences

Une omission de filtre ou de contexte échoue fermée sous le rôle runtime. Les
requêtes tenant restent explicitement filtrées dans le code : RLS complète
l'autorisation objet et ne la remplace pas.

Le runtime peut techniquement appeler `set_config` avec un UUID arbitraire. RLS
réduit l'impact d'une erreur de repository, mais ne protège pas contre le vol du
credential PostgreSQL, un rôle `BYPASSRLS` ou une injection SQL donnant un
contrôle arbitraire de la transaction. La prévention des injections, les
requêtes paramétrées, les secrets séparés et les privilèges minimaux restent des
barrières obligatoires.

`outbox_dispatch` révèle au rôle runtime des UUID techniques de tenants et
d'événements afin d'ordonner le travail. Il ne contient ni email ni payload. Une
séparation future du worker dans un rôle dédié permettrait de retirer même cette
visibilité au runtime HTTP si le risque ou l'échelle le justifie.

## Vérification

`TenantIsolationTest` crée un rôle PostgreSQL non propriétaire, non superuser et
sans `BYPASSRLS`. Il prouve que :

- les dix-sept tables protégées ont `ENABLE` et `FORCE ROW LEVEL SECURITY` ;
- sans réglage, aucune identité, session ni ligne métier n'est visible ;
- un mauvais tenant ne voit aucune ligne ;
- le tenant A ne lit ni ne modifie une place du tenant B ;
- une insertion portant le tenant B sous le contexte A échoue en `42501` ;
- le bootstrap email/domaine ne révèle que l'invitation et le domaine attendus ;
- un retry outbox conserve exactement la même échéance dans l'événement et la
  file globale de dispatch.

Les tests de parcours Quarkus vérifient en plus que session, invitation,
partage, réservation et livraison outbox continuent de fonctionner. La matrice
du dépôt rejoue V1 à V5 sur PostgreSQL 17.10 et 18.3. Elle exerce notamment la
reprise V3 vers le catalogue courant sur une file non vide sous un propriétaire
`NOSUPERUSER` et `NOBYPASSRLS`, puis répète le parcours métier avec un rôle runtime non
propriétaire et sans `BYPASSRLS`. La migration V4 retire `FORCE RLS` uniquement
pendant son backfill transactionnel propriétaire et le rétablit avant commit.
Cette preuve sélectionne la version dans l'ADR-0015 ; elle ne crée ni rôle, ni
base, ni migration live dans cette tranche.

## Déploiement et retour arrière

V3 est une migration de correction vers l'avant. Le migrateur propriétaire
l'applique avant un runtime de la même release ; le runtime reçoit uniquement
les privilèges DML requis et ne lance jamais Flyway. Avant activation, vérifier
le rôle effectif, `rolsuper = false`, `rolbypassrls = false`, la propriété des
tables et la présence des politiques forcées.

Une ancienne version applicative ne pose pas tous les contextes exigés par V3
et échouerait fermée. Il ne faut donc pas activer V3 avec un ancien runtime. En
cas d'incident, publier une migration corrective et un runtime descendant ; ne
pas désactiver RLS pour restaurer le service.

## Réexamen

Réexaminer cette décision si :

- plusieurs tenants actifs par session sont introduits ;
- le worker outbox obtient un rôle ou un datasource dédié ;
- un support opérateur inter-tenant est implémenté ;
- une table globale supplémentaire contient des données personnelles ;
- le modèle d'identité OIDC exige une résolution différente de l'email vérifié.

## Références

- [ADR-0003 : OIDC passwordless et isolation métier](adr-0003-authentication-et-isolation.md)
- [Sécurité et isolation](../architecture/security-and-tenancy.md)
- [Modèle de domaine](../architecture/domain-model.md)
- [Row Security Policies PostgreSQL 17](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)
