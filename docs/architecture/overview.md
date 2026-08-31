# Architecture

Parkventory est une application Cloudflare-native monolithique : un Worker sert
les assets React et l’API `/api/v1`, avec D1 comme unique base. Cette topologie
réduit un changement d’image ou de texte à un build et un déploiement atomique.

## Composants

- Workers Static Assets : SPA React, fallback des routes directes ;
- Worker TypeScript avec Hono : auth, autorisation tenant, garde godmode et règles métier ;
- D1 : identités, sessions, places, disponibilités, réservations et registre
  d’activité redacted ;
- Email Service : magic links ;
- Turnstile : anti-abus avant toute demande d’e-mail ;
- Observability Workers : journaux JSON sans adresses ni jetons.

Les chemins `/api/*` exécutent toujours le Worker. Les autres chemins sont
servis comme assets, avec fallback SPA. Aucun service réseau privé ni conteneur
n’est nécessaire.

## Deux frontières d’autorisation

Les routes métier chargent une session et lient chaque requête à une organisation
`TENANT`. Les routes `/api/v1/admin/*` utilisent une garde distincte qui exige le
digest secret exact, l’organisation interne `SYSTEM` et le rôle `ADMIN`. Un rôle
d’administration tenant n’est donc jamais global et l’identité système ne peut
pas emprunter les routes métier.

La console `/admin` lit des agrégats D1, des listes paginées et
`activity_event`. Les transitions métier sont enregistrées atomiquement par des
triggers ; les refus et incidents classifiés le sont par le Worker. Les logs
Cloudflare complètent ce registre pour le diagnostic technique sans devenir la
source des métriques produit.
