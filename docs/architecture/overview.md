# Architecture

Parkventory est une application Cloudflare-native monolithique : un Worker sert
les assets React et l’API `/api/v1`, avec D1 comme unique base. Cette topologie
réduit un changement d’image ou de texte à un build et un déploiement atomique.

## Composants

- Workers Static Assets : SPA React, fallback des routes directes ;
- Worker TypeScript avec Hono : auth, autorisation et règles métier ;
- D1 : identités, sessions, places, disponibilités et réservations ;
- Email Service : magic links ;
- Turnstile : anti-abus avant toute demande d’e-mail ;
- Observability Workers : journaux JSON sans adresses ni jetons.

Les chemins `/api/*` exécutent toujours le Worker. Les autres chemins sont
servis comme assets, avec fallback SPA. Aucun service réseau privé ni conteneur
n’est nécessaire.
