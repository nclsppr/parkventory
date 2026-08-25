# État vérifié — 25 août 2026

## Production Cloudflare active

- La réécriture Cloudflare-native est sur `origin/main` depuis la PR #13,
  fusionnée au SHA `bd95f98ab73d7644fcc20a2f8d717ca16c3c8ff0`.
- La base D1 `parkventory-production` est créée en juridiction UE sous
  l’identifiant `07118826-b935-4f87-9fca-a5d1e6a01218` ; la migration
  `0001_cloudflare_mvp.sql` est appliquée. Un bookmark Time Travel de production
  a été relevé sans exécuter de restauration.
- Le Worker `parkventory-production` est déployé avec D1, les assets React,
  Email Service et les deux secrets requis. La version active est
  `34d054a0-fd64-4822-ba54-93bbec3c8070`.
- Workers Builds suit `nclsppr/parkventory` sur `main`, avec cache de build et
  déploiement `--env production`. Le merge de la PR #19 au SHA
  `a59c990fdc948acb7fbb4fd5debe27be099d4f8b` a déclenché le build
  `ad5426a3-bc75-4268-ad11-7fb5e2ac4035`, terminé avec le résultat `success`,
  puis publié cette version. Les changements limités aux Markdown sont exclus
  des builds.
- La production sert les assets `index-DyVCfZHi.css` et `index-CsZhO9kn.js` :
  le header public et sa zone sûre Safari sont opaques, le logo connecté reste
  dans `/app` et les libellés produit n’exposent plus D1.
- Turnstile est configuré en mode géré pour l’apex, `www` et l’adresse
  `workers.dev`. Sa clé publique est versionnée ; sa clé privée reste un secret
  Worker.
- Email Service est actif pour `parkventory.com`, avec un quota observé de
  200 messages par jour. Son return-path, son SPF et son DKIM dédiés sont prêts.
  Un premier magic link a été livré dans les indésirables le 25 août : il n’y a
  ni suppression ni plainte Cloudflare, mais les en-têtes d’authentification du
  message reçu restent à contrôler et le domaine d’envoi est encore sans
  réputation observable.
- Les domaines personnalisés `parkventory.com` et `www.parkventory.com` pointent
  vers le Worker. `www` redirige vers l’apex en `308` en conservant le chemin.
- 9 tests Worker/D1, 36 tests React, le typecheck Worker, le build et le dry-run
  Wrangler de la gate réussissent.

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

- sortie réelle d’un magic link vérifiée, mais classement en boîte principale
  et consommation unique non vérifiés ;
- parcours authentifié à deux membres, partage puis réservation non vérifié ;
- exercice réel de restauration D1 et réactivation DNSSEC Cloudflare non
  prouvés.

L’infrastructure dynamique est active sur les serveurs Cloudflare autoritatifs,
mais ces gates interdisent encore de qualifier le produit MVP de prêt.
