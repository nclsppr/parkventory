# ADR-0005 : adaptateur d’identité et Mailpit pour le développement local

- Statut : remplacé par ADR-0017
- Statut d'implémentation : implémenté et vérifié en local
- Date : 2026-07-30
- Dernière vérification : Mailpit `v1.30.6` et Quarkus Mailer testés le 2026-07-30
- Propriétaire : nclsppr
- Domaine : développement, identité et notifications
- Remplace : aucune
- Remplacé par : [ADR-0017](adr-0017-cloudflare-native.md)

## Contexte

La cible de production acceptée dans
[`ADR-0003`](adr-0003-authentication-et-isolation.md) reste un fournisseur OIDC
passwordless. Ce fournisseur n'est pas encore choisi. Le parcours local doit
néanmoins exercer la vérification d’adresse, les sessions, PostgreSQL, les
invitations et les notifications sans dépendre d’un service distant.

Un formulaire qui simule l’envoi ou une API qui crée directement un compte ne
permet pas de vérifier les invariants `ORG-001`, le rejeu d’un lien ni le
comportement de l’outbox.

## Décision

Ajouter un adaptateur d’identité strictement local :

- Quarkus génère un jeton aléatoire de 256 bits ;
- seul son hash SHA-256 est conservé dans PostgreSQL ;
- le lien est valable quinze minutes et consommé atomiquement une seule fois ;
- aucun compte, organisation ou membership n’est créé avant cette consommation ;
- une session serveur de sept jours est référencée par un cookie `HttpOnly`,
  `SameSite=Lax` ;
- Mailpit capture les liens magiques, invitations et notifications via SMTP ;
- les invitations et réservations écrivent un `outbox_event` avec la mutation ;
- un worker Quarkus borné livre les événements avec reprise et backoff ;
- Mailpit `v1.30.6` est épinglé par son digest multi-architecture
  `sha256:7f33095f80e901f6ad08028f06ca284aa58fe84942be5496008d041d3b9f4d4d`
  dans `compose.yaml`.

Cet adaptateur n’est pas un fournisseur d’identité de production et ne remplace
pas l’ADR OIDC. Le cookie n’emploie pas `Secure` sur l’origine HTTP de boucle
locale ; toute surface HTTPS non locale doit utiliser la configuration OIDC et
un cookie sécurisé avant ouverture.

Depuis l’ADR-0010, la classe REST qui porte `/auth/requests` et `/auth/verify`
est supprimée au build du profil `prod`. L’adaptateur OIDC est inversement
absent des profils local et test : une release ne peut pas choisir les deux par
simple variable runtime.

## Conséquences

### Positives

- le parcours local est autonome et observable dans le navigateur ;
- les tables d’identité et de session sont réellement exercées ;
- aucun mot de passe ni jeton brut n’est persisté ;
- une panne SMTP peut être testée sans envoyer de données hors du poste ;
- Compose reste l’unique graphe local intégré.

### Négatives

- deux adaptateurs d’identité devront être maintenus jusqu’au branchement OIDC ;
- Quarkus porte temporairement la génération des liens en développement ;
- Mailpit ne prouve ni délivrabilité, ni réputation, ni sécurité d’un fournisseur
  de production.

### Risques et contrôles

| Risque | Contrôle local | Contrôle encore requis avant production |
| --- | --- | --- |
| Rejeu du lien | consommation atomique et test de second usage en `410` | contrat OIDC, nonce, état et PKCE |
| Vol du jeton | hash en base, durée courte, absence des logs | HTTPS, secrets et supervision |
| Abus de demande | domaine professionnel refusé selon une liste minimale | rate limit, anti-bot et liste versionnée |
| CSRF de session | cookie `SameSite=Lax`, même origine Vite/API | vérification Origin et protection complète |
| Fuite inter-tenant | filtre explicite par organisation et clés composites | RLS forcée et matrice adversariale |

## Vérification

- migration Flyway V2 sur PostgreSQL 18 réel ;
- tests Quarkus du lien, du rejeu, de l’invitation exacte, de la session, du
  partage, de l’idempotence et de la réservation ;
- smoke Compose du parcours complet dans Mailpit, de l'identité jusqu'à la
  notification de réservation et l'invitation ;
- parcours navigateur React avec session `HttpOnly`, données PostgreSQL et
  déduplication de la vérification sous `StrictMode` ;
- sélection OIDC, RLS et durcissement anti-abus restent des critères ouverts de
  F03.

## Retour arrière

Arrêter le service Mailpit et désactiver l’adaptateur local sans supprimer les
comptes métier. Révoquer les sessions locales lors du passage à OIDC. Les
migrations sont corrigées vers l’avant ; les tables locales peuvent être
retirées seulement après migration et vérification de toutes les sessions.

## Références

- [ADR-0003 : OIDC passwordless et isolation métier](adr-0003-authentication-et-isolation.md)
- [ADR-0010 : Auth0 EU et email OTP](adr-0010-auth0-email-otp-production.md)
- [Documentation Docker Mailpit](https://mailpit.axllent.org/docs/install/docker/)
- [Healthchecks Mailpit](https://mailpit.axllent.org/docs/integration/healthcheck/)
- [Quarkus Mailer](https://quarkus.io/guides/mailer-reference)
