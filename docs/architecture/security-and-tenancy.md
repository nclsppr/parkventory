# Sécurité et isolation

## Authentification

- Turnstile est validé côté Worker avant l’envoi d’un lien.
- Le magic link contient 256 bits aléatoires ; seul son SHA-256 est stocké.
- Le jeton des nouveaux liens est placé dans le fragment URL, absent de la
  requête de navigation, puis retiré immédiatement de l’adresse par la SPA.
- Le lien expire après 15 minutes, est consommé par `POST` et ne fonctionne
  qu’une fois afin que les scanners d’e-mail ne le consomment pas en `GET`.
- Le cookie de session est opaque, `HttpOnly`, `SameSite=Lax`, `Secure` hors
  développement et expire après 7 jours.
- Les mutations refusent une origine différente.
- Les quotas de demandes de magic link sont imposés par un insert conditionnel
  D1 unique, afin que des requêtes concurrentes ne dépassent pas le plafond.
- L’unique identité godmode est comparée au digest secret
  `GODMODE_ADMIN_EMAIL_SHA256` en temps constant ; un binding absent ou invalide
  ferme l’accès.
- Le formulaire opérateur porte une intention `admin`; une adresse non autorisée,
  une limite atteinte ou une configuration indisponible produisent le même `202`
  public, sans onboarding tenant accidentel.

## Tenancy

L’organisation est déterminée après validation de l’adresse professionnelle.
Chaque requête métier charge la session, le membre et `organization_id` côté
serveur. Toutes les lectures et mutations lient explicitement l’organisation ;
des contraintes et triggers D1 refusent aussi les écritures métier dans `SYSTEM`
et les discordances entre tenant, membre, place, offre et réservation.

`organization.kind` sépare les espaces `TENANT` de l’organisation interne
`SYSTEM`. Les routes métier exigent `TENANT`. Les routes godmode exigent à la fois
une session active, le digest opérateur exact, `SYSTEM` et le rôle `ADMIN`. Un
administrateur de tenant reste borné à son organisation ; le booléen `godmode`
retourné au frontend ne remplace jamais la garde serveur.

La console globale est en lecture seule. Elle accepte des recherches et curseurs
bornés, mais aucune instruction SQL, impersonation, promotion, révocation ou
mutation de données métier.

## Minimisation

Les tokens, cookies et adresses ne sont jamais journalisés. Parkventory ne
collecte ni motif d’absence, ni plaque, ni calendrier, ni géolocalisation. Les
réponses de demande de lien restent génériques pour limiter l’énumération ; le
traitement D1 et e-mail du cas admin autorisé est effectué hors du chemin de
réponse, de sorte qu’une panne ou sa latence ne distingue pas cette identité.
Les logs d’invocation Cloudflare sont désactivés ; les logs applicatifs structurés
conservent uniquement des routes canoniques internes, jamais chemin ou query string
bruts. Les refus godmode partagent le bucket `/api/v1/admin/*` et sont dédupliqués
sur cinq minutes pour éviter l’amplification ou l’injection dans le registre.

Le registre `activity_event` ne contient que des types et codes bornés, des
identifiants internes et des timestamps. Il exclut l’adresse opérateur, les
adresses membres, les hashes de tokens ou d’IP, les corps de requête et les
messages d’erreur bruts. L’adresse d’un membre n’est renvoyée que par la liste
utilisateurs, le détail tenant ou l’activité enrichie, après autorisation
godmode et sous `Cache-Control: no-store`. Elle ne fait pas partie du registre
brut ni des diagnostics.
