# ADR-0003 : OIDC passwordless et isolation métier

- Statut : accepté
- Statut d'implémentation : RLS implémentée et candidat Auth0 préparé ; décision externe et activation absentes
- Date : 2026-07-30
- Dernière vérification : contrat Quarkus/Auth0 et tests de profils le 2026-08-18
- Propriétaire : nclsppr
- Domaine : sécurité et données
- Remplace : aucune
- Remplacé par : aucune
- Proposition de précision : [ADR-0010](adr-0010-auth0-email-otp-production.md)

## Contexte

Le service doit permettre une self-registration par email professionnel sans
mot de passe. Une adresse vérifiée permet de démarrer le rattachement, mais les
droits d'organisation et d'administration appartiennent au domaine métier
Parkventory.

Une SPA qui conserve un bearer token accessible au JavaScript augmente
l'impact d'une faille XSS. Une implémentation maison complète du passwordless
augmente la surface cryptographique et opérationnelle.

## Problème à décider

Comment authentifier par email et isoler les organisations sans confier les
autorisations métier au frontend ou au fournisseur d'identité ?

## Critères

- email effectivement vérifié ;
- anti-énumération et résistance au rejeu ;
- aucun token accessible au JavaScript applicatif ;
- fournisseur d'identité remplaçable ;
- rôles et tenants contrôlés par Parkventory ;
- défense en profondeur PostgreSQL ;
- zéro admin possible sans perte de sécurité.

## Options considérées

### Option A : liens magiques entièrement implémentés dans Quarkus

Parkventory génère, hash, envoie et consomme ses propres jetons puis crée une
session. Le contrôle est maximal, mais expiration, délivrabilité, anti-abus et
maintenance de sécurité deviennent notre responsabilité directe.

### Option B : OIDC Authorization Code Flow avec fournisseur passwordless

Le fournisseur authentifie l'email. Quarkus agit comme client confidentiel,
termine le code flow et garde l'état dans un cookie sécurisé. Parkventory
conserve comptes, adhésions, tenants et rôles.

### Option C : bearer token géré par la SPA

Le navigateur reçoit et stocke directement les tokens puis appelle l'API.
L'intégration est courante, mais expose davantage les tokens au JavaScript et
complique la révocation et la protection du même-origin.

### Option minimale : comptes créés manuellement

L'opérateur invite et crée chaque personne. Cette option évite un flux public
mais contredit la self-registration.

## Décision

Adopter l'option B.

- Quarkus OIDC en `web-app` et Authorization Code Flow.
- Auth0 EU et Universal Login Email OTP sont le candidat technique de
  l’ADR-0010, qui reste à approuver ; le fournisseur n’est pas choisi tant que
  cette décision externe, le coût et les conditions ne sont pas acceptés.
- PKCE, nonce, état et validation de l'issuer/audience.
- Cookie de session `HttpOnly`, `Secure` et SameSite approprié.
- Compte interne lié au couple issuer + subject.
- Claim email utilisé seulement s'il est marqué vérifié.
- Tenant et rôle chargés depuis PostgreSQL à chaque contexte pertinent.
- RLS et clés composites comme seconde barrière.
- Organisation Parkventory distincte d'un tenant OIDC.

## Conséquences

### Positives

- protocole standard et support Quarkus ;
- pas de mot de passe ni bearer token dans la SPA ;
- fournisseur remplaçable derrière OIDC ;
- autorisation métier sous contrôle local ;
- possibilité future de SSO sans réécrire le domaine.

### Négatives

- dépendance à un fournisseur pour le flux cœur ;
- besoin de configurer cookies, PKCE, logout et rotation de clés ;
- les claims varient selon les fournisseurs ;
- coût et résidence des données restent à décider.

### Risques

- fournisseur ne garantissant pas le claim `email_verified` ;
- confusion entre tenant OIDC et organisation métier ;
- rôle provenant d'un token accepté sans recoupement ;
- cookie mal configuré derrière le reverse proxy ;
- indisponibilité du fournisseur bloquant les nouvelles sessions.

## Mise en œuvre

1. Approuver ou rejeter le candidat Auth0 EU décrit par l’ADR-0010.
2. Après approbation seulement, valider et provisionner le tenant.
3. Injecter et tester les secrets sans les exposer au dépôt.
4. Appliquer clés composites, RLS forcée et contexte transactionnel.
5. Tester anti-énumération, rejeu, révocation et tenant A/B.
6. Documenter et exercer rotation des secrets et mode d'indisponibilité.

L'étape 6 est implémentée par
[`ADR-0009`](adr-0009-rls-et-contextes-tenant-transactionnels.md). Elle reste
indépendante du fournisseur d'identité : un futur endpoint OIDC devra poser le
même contexte seulement après validation de l'identité et résolution de
l'adhésion.

## Vérification

- Commandes : tests de claims, profils et PostgreSQL réussis, contrat d’image
  ajouté mais à rejouer ; matrice RLS et test avec un tenant Auth0 réel encore
  requis.
- Environnements : fournisseur de test ou émulateur contractuel, Testcontainers,
  préproduction.
- Résultat attendu : email non vérifié refusé, session sécurisée, aucun accès
  inter-tenant et rôle révoqué immédiatement.
- Preuve observée : configuration fail-closed et contrat du code flow testés ;
  claims et provisioning testés sur PostgreSQL.
- Limites de la preuve : aucun tenant Auth0 ni flux OTP externe n'est testé.

## Rollback

Le compte interne et les adhésions restent indépendants du fournisseur. Une
migration change issuer/subject via une procédure vérifiée, révoque les
anciennes sessions et conserve l'historique. En cas d'incident, suspendre les
nouvelles connexions plutôt que basculer vers un flux maison non testé.

## Réexamen

Réexaminer si :

- aucun fournisseur acceptable ne supporte le passwordless ;
- le coût ou la résidence devient incompatible ;
- un pilote impose son propre SSO ;
- Quarkus modifie le modèle de token state ou de cookie ;
- une menace justifie une authentification renforcée.

## Références

- [Authorization Code Flow Quarkus](https://quarkus.io/guides/security-oidc-code-flow-authentication)
- [Configuration OIDC Quarkus](https://quarkus.io/guides/security-oidc-configuration-properties-reference)
- [Row-Level Security PostgreSQL](https://www.postgresql.org/docs/18/ddl-rowsecurity.html)
- [Sécurité et isolation](../architecture/security-and-tenancy.md)
