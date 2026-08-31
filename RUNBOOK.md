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

Workers Builds suit la branche `main` du dépôt `nclsppr/parkventory`. Après
fusion, Cloudflare exécute `npm run build`, puis
`npx wrangler deploy --env production`. Le token nommé
`Parkventory Workers Builds` reste exclusivement dans Cloudflare et ne doit
jamais être copié dans Git ou dans un ticket. Les fichiers `*.md` et `docs/**`
sont exclus du déclenchement ; une modification de code ou d’image reste
déployée normalement.

Workers Builds n'applique pas les migrations D1. Toute migration créant une
table utilisée par le Worker doit donc être appliquée et vérifiée dans
l'environnement ciblé avant la fusion sur `main`, qui déclenche le déploiement.
Cela inclut la migration `0004_user_locale.sql` : vérifier la colonne
`user_account.preferred_locale` sur la préversion puis la production avant que
le Worker qui la lit soit publié.

## Vérifications après déploiement

1. `GET /api/v1/health` répond `200` avec `{"status":"ok"}`.
2. `/` négocie la langue par cookie puis `Accept-Language` ; les douze pages
   accueil, confidentialité et mentions légales sous `/fr`, `/en`, `/de` et
   `/lb` répondent `200` avec le bon `Content-Language`, leur canonical, cinq
   alternates et un contenu visible dans le HTML initial.
3. Une route inconnue répond `404` avec `noindex`; un asset pointé mais absent
   répond aussi `404` en `text/plain`, jamais avec le shell HTML.
4. `robots.txt`, `sitemap.xml`, `llms.txt`, les quatre manifestes, les icônes et
   cartes sociales répondent avec leur MIME attendu. Le sitemap contient
   exactement les douze pages indexables.
5. Les routes applicatives localisées — par exemple `/fr/app/partager`,
   `/en/app/share`, `/de/app/suchen` et `/lb/auth/callback` — répondent
   directement et restent hors index.
6. Un magic link réel arrive, ne fonctionne qu’une fois et expire après 15 min.
7. Deux membres du même domaine réalisent le parcours partage/réservation.
8. Deux réservations concurrentes donnent un `200` et un `409`.
9. Un membre d’un autre domaine ne voit aucune donnée du premier.
10. Sur une session connectée, le sélecteur n’apparaît que dans le profil, y
    compris après retour sur la landing, les pages légales ou une 404 ; un
    changement persiste après reconnexion, tandis que ces mêmes surfaces
    déconnectées conservent leur propre sélecteur.

## Bascule et retour arrière

La bascule publique est un changement DNS unique après export et contrôle de
tous les records existants, notamment MX, SPF, DKIM et DMARC. Le rollback
web consiste à retirer les deux domaines personnalisés du Worker puis à recréer
les A de `parkventory.com` et `www.parkventory.com` vers `137.74.174.163`.
Ne jamais modifier les MX, SPF, DKIM, DMARC ou records `cf-bounce` pendant ce
rollback.
