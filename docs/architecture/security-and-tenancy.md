# Sécurité, confidentialité et isolation

## Objectifs

1. Prouver l'identité avant toute révélation d'organisation.
2. Isoler chaque organisation même en cas d'erreur applicative.
3. Refuser collisions et rejeux au niveau transactionnel.
4. Minimiser les données de présence.
5. Garder les actions privilégiées auditables et révocables.

## Authentification passwordless

Le choix accepté est un fournisseur OIDC compatible passwordless email, intégré
avec l'Authorization Code Flow de Quarkus en mode `web-app`.

Flux :

1. l'utilisateur demande une connexion avec une réponse générique ;
2. le fournisseur envoie et valide le lien à usage unique ;
3. Quarkus termine le code flow comme client confidentiel avec PKCE ;
4. le claim d'email vérifié est contrôlé ;
5. Parkventory résout le compte et l'adhésion dans sa propre base ;
6. Quarkus établit une session via cookie sécurisé.

Contraintes :

- aucun bearer token dans `localStorage` ou accessible au JavaScript applicatif ;
- cookies `HttpOnly`, `Secure`, `SameSite=Lax` ou plus strict selon le flow ;
- état et token de session chiffrés avec secret injecté ;
- rotation de session après authentification ;
- protection CSRF et vérification `Origin` pour les mutations ;
- expiration courte du flux et rate limiting email/IP ;
- aucun log d'email complet, code, token ou cookie.

Le fournisseur exact n'est pas encore choisi. Il doit permettre export,
suppression, région adaptée, rotation des clés et retrait sans perdre les
comptes internes.

### État local actuel

Le parcours Compose utilise temporairement l'adaptateur accepté par
[`ADR-0005`](../decisions/adr-0005-adaptateur-identite-mailpit-local.md) :
jeton aléatoire de 256 bits, hash SHA-256 en base, consommation atomique,
session de sept jours en cookie `HttpOnly` et Mailpit. Il exerce les frontières
applicatives mais ne prouve pas OIDC, `Secure`, PKCE, rate limiting, protection
CSRF complète ou délivrabilité.

## Tenant métier

Une organisation Parkventory n'est pas un tenant OIDC. Un seul fournisseur
d'identité peut authentifier des membres de plusieurs organisations.

Après authentification :

- `user_account` est résolu par le couple issuer + subject ;
- `membership` est chargé depuis PostgreSQL ;
- le tenant actif est choisi parmi les adhésions autorisées ;
- chaque service reçoit explicitement `OrganizationId` et `MembershipId` ;
- les rôles sont relus depuis la base ;
- changer de tenant exige une adhésion active et renouvelle le contexte.

Un en-tête ou paramètre `organization_id` ne suffit jamais à autoriser une
requête.

### Contrat identité vers tenant

1. L'adaptateur prouve l'identité ; le lien magique local consomme son hash et
   le futur OIDC devra valider `issuer`, `subject` et `email_verified`.
2. Le bootstrap borné résout une invitation exacte ou un domaine, sans révéler
   le reste du tenant.
3. Parkventory crée ou relit le compte et l'adhésion active dans PostgreSQL ;
   les rôles proviennent toujours de cette adhésion, jamais d'un header ou d'un
   claim non recoupé.
4. La session serveur lie `user_account_id`, `active_membership_id` et
   `organization_id` par clé étrangère composite.
5. Chaque transaction authentifiée relit cette session, puis pose
   `SET LOCAL app.organization_id` avant toute requête tenant.

Une identité vérifiée sans adhésion résolue n'autorise donc aucune lecture
métier. Un tenant sans transaction active n'est pas un contexte valide.

## Défense en profondeur PostgreSQL

Chaque transaction métier :

1. démarre avec le rôle applicatif non propriétaire des tables ;
2. exécute `SET LOCAL app.organization_id = ...` après autorisation ;
3. accède à des tables avec Row-Level Security activée et forcée ;
4. échoue fermée si le contexte tenant manque.

Les clés étrangères composites empêchent aussi les relations croisées.

La migration V3 applique désormais cette règle aux tables métier, d'identité,
de session, d'audit et d'outbox. `TenantTransactionContext` pose les réglages
avec `set_config(..., true)` et refuse une connexion en autocommit. Les services
reçoivent toujours `OrganizationId` depuis la session serveur : aucun header ou
paramètre client ne devient le contexte PostgreSQL.

La résolution précédant le tenant est bornée par des réglages distincts. Après
vérification de l'identité seulement, l'application pose l'email et le domaine
normalisés ; RLS ne laisse alors voir que l'invitation active exacte et le
rattachement de ce domaine. Le hash d'un lien magique ou d'une session ne rend
visible que sa propre ligne. Après résolution, toute mutation tenant exige
`app.organization_id`. Ce contrat est indépendant de l'adaptateur : le futur
OIDC l'utilisera après validation de `issuer`, `subject` et `email_verified`.

L'outbox utilise `outbox_dispatch`, index global sans payload ni email, pour
verrouiller le prochain identifiant et son tenant. Le worker pose ensuite le
contexte avant de lire `outbox_event`, protégé par RLS. Un retry recopie la même
échéance dans les deux tables.

RLS est une seconde barrière. Les tests de services et repositories restent
obligatoires. Le runtime de production doit être non propriétaire, non
superuser et sans `BYPASSRLS`. Un credential runtime compromis peut encore poser
un réglage arbitraire ; les requêtes paramétrées, l'autorisation objet et la
séparation des secrets restent donc indispensables. La décision et les
exceptions sont détaillées dans
[`ADR-0009`](../decisions/adr-0009-rls-et-contextes-tenant-transactionnels.md).

## Résolution de domaine

Risques :

- domaine gratuit ou jetable ;
- domaine partagé par plusieurs entités ;
- filiale et maison mère ;
- prestataire avec email du client ;
- changement de propriétaire d'un domaine ;
- adresse internationale ou homographe ;
- invitation destinée à une autre organisation.

Mesures :

- normalisation IDNA et casse sans réécriture de l'alias local ;
- liste versionnée de domaines personnels/jetables avec procédure de contestation ;
- invitation exacte prioritaire ;
- unicité transactionnelle d'un domaine actif ;
- aucun nom ou membre révélé avant vérification ;
- preuve de contrôle renforcée pour la première administration ;
- audit et procédure de séparation ou fusion à concevoir avant besoin réel.

Un domaine vérifié reste un signal organisationnel, pas une preuve de contrat de
travail.

## Autorisation

| Action | Membre | Titulaire concerné | Administrateur | Opérateur |
| --- | ---: | ---: | ---: | ---: |
| Lire les disponibilités de son tenant | Oui | Oui | Oui | Support autorisé uniquement |
| Réserver pour soi | Oui | Oui | Oui | Non |
| Publier pour une place | Non | Oui | Oui avec raison et règle explicite | Non |
| Modifier sa réservation | Oui | Oui | Oui avec audit | Non |
| Gérer sites et libellés | Non | Non | Oui | Non |
| Promouvoir un admin | Non | Non | Oui | Seulement récupération autorisée |
| Lire un autre tenant | Non | Non | Non | Seulement incident autorisé et audité |

Les contrôles portent sur l'objet et le tenant, pas seulement sur un rôle global.

## Menaces et contrôles

| Menace | Contrôle principal | Preuve attendue |
| --- | --- | --- |
| Énumération d'emails ou d'entreprises | Réponses et timings génériques | Tests publics comparatifs |
| Rejeu du flow passwordless | OIDC, nonce, état, PKCE et expiration | Rejeu refusé |
| Vol de session | Cookie sécurisé, rotation, TTL, révocation | Tests de cookie et logout |
| CSRF | SameSite, token CSRF et validation Origin | Mutations cross-site refusées |
| Fuite inter-tenant | Autorisation objet, clés composites, RLS | Matrice tenant A/B |
| Double réservation | Contrainte d'exclusion PostgreSQL | Test réellement concurrent |
| Escalade admin | Preuve de domaine et audit | Promotion/retrait testés |
| Spam d'invitations | Quotas, rate limit et révocation | Limites et alertes |
| Email indisponible | Outbox et retry | Réservation conservée |
| Secret dans un log | Redaction et tests de log | Scan des sorties |
| Migration destructive | Backup et restauration isolée | Preuve avant production |

## Données et rétention

Catégories :

- identité professionnelle ;
- adhésion et rôle ;
- affectation d'une place ;
- disponibilité et réservation ;
- audit de gouvernance ;
- événements de notification.

Avant un pilote réel, une décision doit fixer :

- durée d'une session ;
- rétention des invitations et demandes de connexion ;
- rétention de l'historique de réservation ;
- rétention et accès à l'audit ;
- export et suppression d'un compte ;
- anonymisation des métriques ;
- fondement et information des utilisateurs selon la juridiction cible.

Le motif d'absence n'est jamais collecté.

## Secrets

Secrets cibles :

- client secret et clés OIDC ;
- clé de chiffrement des cookies ou token state ;
- credentials PostgreSQL ;
- clé du fournisseur email ;
- credentials de sauvegarde et déploiement.

Ils sont injectés par un gestionnaire de secrets ou un mécanisme équivalent,
avec scopes séparés. `.env.example` documente les noms sans valeur réelle.

## Audit

Événements obligatoires :

- rattachement ou retrait d'un domaine ;
- promotion et révocation d'un administrateur ;
- suspension d'une adhésion ;
- création, contestation et réaffectation d'une place ;
- annulation administrative d'une réservation ;
- tentative inter-tenant refusée de forte valeur ;
- opération de récupération.

Un événement contient identifiants techniques, résultat et raison structurée,
pas un texte libre contenant des données personnelles inutiles.

## Tests de sortie

- email non vérifié incapable de créer une adhésion ;
- réponses publiques indifférenciables ;
- tenant A incapable de lire ou muter tenant B ;
- absence de contexte RLS égale refus ;
- rôle révoqué immédiatement effectif ;
- deux créations concurrentes du même domaine donnent un tenant ;
- deux réservations concurrentes donnent un succès ;
- session expirée et logout refusent les appels ;
- heure d'été et fuseau du site ;
- logs sans token, cookie ni email complet ;
- sauvegarde restaurée dans une cible isolée avant pilote.

## Références officielles

- [Authorization Code Flow Quarkus](https://quarkus.io/guides/security-oidc-code-flow-authentication)
- [Configuration OIDC Quarkus](https://quarkus.io/guides/security-oidc-configuration-properties-reference)
- [Vue d'ensemble de la sécurité Quarkus](https://quarkus.io/guides/security-overview)
- [Row-Level Security PostgreSQL 18](https://www.postgresql.org/docs/18/ddl-rowsecurity.html)
