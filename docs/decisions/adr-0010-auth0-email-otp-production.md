# ADR-0010 — Auth0 EU et email OTP pour l’identité de production

- Statut : accepté
- Statut d'implémentation : candidat intégré à la RLS et localement vérifié ; tenant et preuve externe absents
- Date : 2026-08-18
- Dernière vérification : Quarkus 3.33.3, tests de profils, claims et PostgreSQL le 2026-08-18
- Décideur : nclsppr, le 2026-08-23
- Portée : identité de production ; provisionnement et activation restent des étapes vérifiées séparément
- Précise : [ADR-0003](adr-0003-authentication-et-isolation.md)

## Contexte

L’ADR-0003 impose un Authorization Code Flow OIDC terminé côté Quarkus, mais ne
choisissait ni fournisseur ni contrat de configuration. L’adaptateur local de
l’ADR-0005 ne peut pas être exposé : Parkventory porterait alors lui-même les
jetons passwordless, l’anti-abus et la délivrabilité.

Auth0 propose un tenant régional européen et un parcours Passwordless Email
dans Universal Login. Ce parcours utilise un code à usage unique ; le magic
link Auth0 appartient au Classic Login et n’est pas le contrat retenu.

## Décision

Retenir Auth0 EU comme premier fournisseur OIDC de production afin de minimiser
le délai d'ouverture de la bêta publique. Cette décision ne prétend pas qu'un
tenant existe déjà et n'autorise pas une activation sans preuve externe.

- Le backend est une application confidentielle Quarkus `web-app`. Le secret
  client reste côté serveur et aucun token OIDC n’est donné au JavaScript.
- La requête d’autorisation fixe `connection=email` et `prompt=login`.
  Universal Login collecte l’adresse et vérifie l’OTP à chaque nouveau code
  flow, même si un cookie Auth0 existe encore dans le navigateur.
- Quarkus exige PKCE S256, `state`, `nonce`, HTTPS, cookie `Secure`, issuer
  exact, audience égale au client ID, sujet présent et signature RS256.
- La découverte est désactivée ; les chemins Auth0 `/authorize`,
  `/oauth/token` et `/.well-known/jwks.json` sont déclarés explicitement.
- Le token state Quarkus ne conserve que l’ID token et est chiffré par un secret
  dédié. Le secret de `state` est distinct du secret client et du secret de
  chiffrement.
- Le backend n’accepte l’identité que si `iss`, `sub`, `email` et le booléen
  `email_verified=true` sont présents et cohérents. La chaîne `"true"` est
  refusée.
- Le compte interne est lié à une clé opaque et stable dérivée du couple
  `(issuer, subject)`. L’email vérifié sert au rattachement initial, jamais
  comme identifiant OIDC durable.
- L’invitation exacte est prioritaire ; sinon le domaine professionnel résout
  ou crée l’organisation communautaire. Une adhésion suspendue ou quittée
  n’est jamais réactivée automatiquement.
- L’email d’invitation de production ne crée aucun magic-link Parkventory : il
  pointe vers `/api/v1/auth/oidc/login`, puis l’email vérifié par le fournisseur
  permet de réclamer l’invitation en base. Le lien local avec token reste
  confiné aux profils hors production.
- Une `app_session` serveur reste le pont vers le code métier existant. Son
  cookie est `HttpOnly`, `Secure`, `SameSite=Lax` et aucune donnée OIDC n’est
  accessible à la SPA.

Les adaptateurs sont mutuellement exclusifs au build :

- `LocalAuthResource` existe hors profil `prod` seulement ; les routes
  `/auth/requests` et `/auth/verify` sont donc absentes de l’image de production ;
- `OidcAuthResource` et `OidcIdentityService` existent dans le profil `prod`
  seulement ; `/auth/oidc/login` et `/auth/oidc/logout` sont absents en local.

La déconnexion de cette tranche révoque l’`app_session`, expire son cookie et
supprime seulement le token-state OIDC local géré par Quarkus. Elle reste
idempotente lorsque ce token-state est déjà absent ou expiré ; la révocation
Parkventory ne dépend donc jamais d’un cookie fournisseur encore valide. La
réponse demande aussi au navigateur d’effacer les cookies de la même origine.
L’authentification proactive Quarkus est désactivée explicitement dans les trois
profils construits et le code flow est sélectionné sur le seul endpoint de
login : un cookie OIDC invalide ne peut ainsi intercepter le POST public de
déconnexion. Une permission HTTP dédiée force aussi le callback virtuel à
passer dans le mécanisme `code`, même en authentification différée. Le logout
expire explicitement `q_session` et ses éventuels cookies fragmentés, en plus
de `Clear-Site-Data`.
Sans `end-session-path`, `OidcSession.logout()` ne visite pas Auth0 et le cookie IdP
peut rester dans le navigateur. Ce n’est donc pas un logout global. Le risque
de reconnexion silencieuse sur un poste partagé est traité par
`connection=email` et `prompt=login`, qui redemandent le parcours email OTP à
chaque nouveau code flow. Si SSO, social login ou fédération sont ajoutés, un
logout fournisseur via `/v2/logout`, avec `returnTo` HTTPS allowlisté, devra
être décidé et testé séparément.

## Configuration et secrets

Les valeurs non secrètes requises sont `PARKVENTORY_OIDC_AUTH_SERVER_URL`,
`PARKVENTORY_OIDC_ISSUER` et `PARKVENTORY_OIDC_CLIENT_ID`. Les deux URL doivent
être des origines HTTPS identiques avec slash terminal.

Compose monte trois fichiers distincts, lisibles uniquement par le runtime :

- `/etc/vps/secrets/parkventory/parkventory-oidc-client-secret` ;
- `/etc/vps/secrets/parkventory/parkventory-oidc-state-secret` ;
- `/etc/vps/secrets/parkventory/parkventory-oidc-token-encryption-secret`.

L’entrypoint exige une ligne ASCII imprimable et au moins 32 caractères pour
chaque secret cryptographique. Les expressions Quarkus n’ont aucune valeur par
défaut en production : même en contournant l’entrypoint, le JAR refuse de
démarrer si issuer, client ID ou secrets manquent.

Le tenant Auth0 devra autoriser exactement le callback
`https://parkventory.com/api/v1/auth/oidc/callback`. Cette valeur est une
précondition, pas une configuration distante déjà appliquée.

## Contrat avec l’isolation PostgreSQL

Le candidat est intégré au contrat de l’ADR-0009 dans une seule transaction
exécutée par le rôle runtime non propriétaire :

1. Quarkus valide cryptographiquement l’identité OIDC, puis l’application exige
   `issuer`, `subject`, l’email professionnel et `email_verified=true` ;
2. l’application pose par `SET LOCAL` l’email et le domaine déjà vérifiés ;
   les policies bootstrap ne rendent alors visibles que leurs lignes exactes ;
3. elle résout le compte par cet email, pose l’identifiant utilisateur local,
   puis lie ou vérifie la clé opaque dérivée de `(issuer, subject)` ; un sujet
   déjà lié à un autre email, ou l’inverse, produit un conflit explicite ;
4. elle résout une invitation exacte ou un domaine professionnel, choisit
   l’organisation issue de la base et pose `SET LOCAL app.organization_id` ;
5. elle relit ou crée l’adhésion active dans ce tenant ; une adhésion suspendue
   ou quittée reste refusée ;
6. elle crée enfin l’`app_session`, liée par clé étrangère composite au
   triplet organisation, adhésion et utilisateur.

Une requête protégée sans identité vérifiée, utilisateur interne, adhésion
active ou contexte `SET LOCAL` doit échouer fermée.

## Conséquences et limites

Le mode local Mailpit reste autonome. Le frontend de l’image VPS affiche
uniquement « Continuer par e-mail » et ne contient aucun appel aux routes
magic-link locales.

La préparation locale ne prouve pas :

- la création, la région effective ou la configuration du tenant Auth0 ;
- la délivrabilité OTP, les quotas, l’anti-bot ou la récupération de compte ;
- la rotation réelle des trois secrets ;
- le callback public derrière Caddy ;
- l’exécution sur le rôle runtime Atlas ni l’absence de fuite dans la
  configuration live ;
- le logout d’une future session SSO fournisseur.

L’activation reste interdite tant que le tenant, ces contrôles, les conditions
commerciales applicables et le traitement des données Auth0 ne sont pas
vérifiés dans l'environnement réel.

## Vérification et retour arrière

Les tests refusent les claims dégradés, construisent le profil `prod`, prouvent
que les routes locales y répondent `404`, prouvent que l’OIDC répond `404` hors
production, vérifient la liaison/provisionnement idempotents et l’`app_session`
tenant sur PostgreSQL avec un rôle non propriétaire, non-superuser et sans
`BYPASSRLS`. Ils prouvent aussi qu’une invitation de production pointe vers
l’entrée OIDC sans créer de magic-link, et que le logout révoque une
`app_session` même sans cookie OIDC. Le contrat de configuration muté s’assure
qu’un downgrade est rejeté. Le test d’image contrôle la redirection Auth0, le
logout idempotent et la présence de `connection=email`, `prompt=login`, PKCE,
nonce et state.

Le retour arrière consiste à ne pas activer Compose ou à publier une release
descendante qui désactive les nouvelles connexions. Il ne faut jamais réexposer
l’adaptateur local en production. Les comptes et adhésions internes sont
conservés ; une migration de fournisseur devra lier le nouvel issuer/subject
par procédure contrôlée et révoquer les sessions existantes.

## Références

- [Quarkus — Authorization Code Flow](https://quarkus.io/guides/security-oidc-code-flow-authentication)
- [Quarkus — référence OIDC](https://quarkus.io/guides/security-oidc-configuration-properties-reference)
- [Quarkus — Auth0](https://quarkus.io/guides/security-oidc-auth0-tutorial)
- [Auth0 — Passwordless avec Universal Login](https://auth0.com/docs/authenticate/passwordless/passwordless-with-universal-login)
- [Auth0 — Passwordless Email ou SMS](https://auth0.com/docs/authenticate/login/auth0-universal-login/passwordless-login/email-or-sms)
