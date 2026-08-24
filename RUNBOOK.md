# Runbook Cloudflare

## Développement local

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

Ouvrir `http://127.0.0.1:8787`. Le site et l’API partagent la même origine.

## Validation proportionnée au MVP

```bash
npm run verify
```

Cette gate exécute les tests Worker/D1, les tests React, le build statique et un
dry-run Wrangler. Elle ne déploie rien.

## Préversion distante

```bash
npm run db:migrate:remote
npm run deploy
```

Avant le déploiement, vérifier que `APP_SECRET` et `TURNSTILE_SECRET_KEY` sont
des secrets Wrangler et que le binding `EMAIL` est activé. Ne jamais passer une
valeur secrète en argument de commande ou dans Git.

## Production

```bash
npm run db:migrate:production
npm run deploy:production
```

La production utilise le Worker `parkventory-production`, la base D1
`parkventory-production`, les domaines personnalisés de l’apex et de `www`, le
binding `EMAIL` et les secrets `APP_SECRET` et `TURNSTILE_SECRET_KEY`. Générer
les types avec `npm run cf:types` après toute modification de binding.

## Vérifications après déploiement

1. `GET /api/v1/health` répond `200` avec `{"status":"ok"}`.
2. Les routes `/`, `/app`, `/app/partager`, `/app/trouver` et
   `/auth/callback` répondent directement.
3. Un magic link réel arrive, ne fonctionne qu’une fois et expire après 15 min.
4. Deux membres du même domaine réalisent le parcours partage/réservation.
5. Deux réservations concurrentes donnent un `200` et un `409`.
6. Un membre d’un autre domaine ne voit aucune donnée du premier.

## Bascule et retour arrière

La bascule publique est un changement DNS unique après export et contrôle de
tous les records existants, notamment MX, SPF, DKIM et DMARC. Le rollback
web consiste à retirer les deux domaines personnalisés du Worker puis à recréer
les A de `parkventory.com` et `www.parkventory.com` vers `137.74.174.163`.
Ne jamais modifier les MX, SPF, DKIM, DMARC ou records `cf-bounce` pendant ce
rollback.
