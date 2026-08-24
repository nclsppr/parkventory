# État vérifié — 24 août 2026

## Production Cloudflare active

- La réécriture Cloudflare-native est sur `origin/main` depuis la PR #13,
  fusionnée au SHA `bd95f98ab73d7644fcc20a2f8d717ca16c3c8ff0`.
- La base D1 `parkventory-production` est créée en juridiction UE sous
  l’identifiant `07118826-b935-4f87-9fca-a5d1e6a01218` ; la migration
  `0001_cloudflare_mvp.sql` est appliquée. Un bookmark Time Travel de production
  a été relevé sans exécuter de restauration.
- Le Worker `parkventory-production` est déployé avec D1, les assets React,
  Email Service et les deux secrets requis. La version active est
  `ff307a0c-57ce-42a3-ac50-e05805cf4de2`.
- Workers Builds suit `nclsppr/parkventory` sur `main`, avec cache de build et
  déploiement `--env production`. Le push du SHA
  `ea02cd50aeaeaa005fd7c55a434bef79885bcbe3` a déclenché automatiquement un
  build réussi et publié cette version. Les changements limités aux Markdown
  sont exclus des builds.
- Turnstile est configuré en mode géré pour l’apex, `www` et l’adresse
  `workers.dev`. Sa clé publique est versionnée ; sa clé privée reste un secret
  Worker.
- Email Service est actif pour `parkventory.com`, avec un quota observé de
  200 messages par jour. Son return-path, son SPF et son DKIM dédiés sont prêts.
- Les domaines personnalisés `parkventory.com` et `www.parkventory.com` pointent
  vers le Worker. `www` redirige vers l’apex en `308` en conservant le chemin.
- 6 tests Worker/D1, 32 tests React, le typecheck Worker, le build et les deux
  dry-runs Wrangler réussissent.

## Bascule DNS en propagation

- La zone Cloudflare `9ee7ea06d816690c53c09c0a463df42d` est active avec
  `armfazh.ns.cloudflare.com` et `uma.ns.cloudflare.com`.
- La délégation du registre `.com` porte ces deux serveurs et ne publie plus
  l’ancien DS OVH. Cloudflare DNSSEC reste désactivé pendant la propagation.
- Les serveurs Cloudflare autoritatifs servent le Worker ; les routes publiques
  principales et `/api/v1/health` répondent `200`, une API inconnue `404`, et
  `www` répond `308` vers l’apex.
- Les trois MX OVH, le SPF racine OVH/Scaleway et le DMARC `p=none` sont
  inchangés. Email Service a seulement ajouté ses records sous `cf-bounce`.
- Certains caches locaux peuvent encore joindre la démo Atlas à
  `137.74.174.163` jusqu’à expiration de l’ancienne délégation. Cette cible est
  conservée comme rollback web.

## Gates produit encore ouvertes

- réception réelle d’un magic link et consommation unique non vérifiées ;
- parcours authentifié à deux membres, partage puis réservation non vérifié ;
- exercice réel de restauration D1 et réactivation DNSSEC Cloudflare non
  prouvés.

L’infrastructure dynamique est active sur les serveurs Cloudflare autoritatifs,
mais ces gates interdisent encore de qualifier le produit MVP de prêt.
