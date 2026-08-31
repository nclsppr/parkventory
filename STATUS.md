# État vérifié — 31 août 2026

## Production Cloudflare active

- La réécriture Cloudflare-native et les interfaces d'administration générale
  et de tenant sont sur `origin/main`. La PR #31 est fusionnée au SHA
  `28b6561c175d1e7334ddc6ea3a23b43377e104b7`.
- La base D1 `parkventory-production` est créée en juridiction UE sous
  l’identifiant `07118826-b935-4f87-9fca-a5d1e6a01218` ; la migration
  `0001_cloudflare_mvp.sql` à `0005_tenant_administration.sql` sont appliquées.
  Les migrations additives `0003`, `0004` et `0005` ont été vérifiées d'abord
  en préversion puis en production avant les Workers qui les consomment. Les
  colonnes, index et triggers de `0005` ont été relus sans consulter de donnée
  personnelle. Un bookmark Time Travel de production a été relevé sans
  exécuter de restauration.
- Le Worker `parkventory-production` est déployé avec D1, les assets React,
  Email Service et les secrets requis. La version active est
  `53f53692-3483-49ae-b6c2-200cc167858a`, à 100 % du trafic, via le déploiement
  `607fb4f9-9c83-49b7-8a0e-6bad45b485bd`.
- Workers Builds suit `nclsppr/parkventory` sur `main`, avec cache de build et
  déploiement `--env production`. Le merge de la PR #19 au SHA
  `a59c990fdc948acb7fbb4fd5debe27be099d4f8b` a déclenché le build
  `ad5426a3-bc75-4268-ad11-7fb5e2ac4035`, terminé avec le résultat `success`.
  Le merge de la PR #21 au SHA `6b9c38ec867d5a83afd437817da02f148bf2d84b`
  a ensuite déclenché le build `e89d4cee-738d-4984-bbea-aba2212520de`, lui
  aussi terminé avec le résultat `success`, puis publié la version 11. La PR
  #23, fusionnée au SHA `5cf5594b68595f7252eb1a4cdc0ced71d2ed3a4f`, a
  ensuite passé la gate post-merge. Le build Workers Builds
  `6c365414-e7ad-490e-98a8-f7633c9f7b2c` s'est terminé avec le résultat
  `success` et a publié automatiquement la version 12. Les changements limités
  aux Markdown sont exclus des builds. La PR #25, fusionnée au SHA
  `5e5fa96c69b9bf8a54157c89019f331ac1f0a427`, a passé la gate post-merge ; le
  build Workers Builds `821fcbe9-c4c9-49a7-886a-5267d4fec98e` a déployé la
  version 13 automatiquement. Les PR #28, #30 et #31 ont ensuite livré la
  palette VBS, le godmode puis l'administration limitée au tenant. La gate
  post-merge de la PR #31, run `33354231242`, est verte sur le SHA exact.
- La production sert les assets `index-DbzKT7VO.css` et `index-Uq2c5rPJ.js` ;
  leurs SHA-256 publics sont respectivement
  `259db7d3ede54e09dc50ef98be1216303011eba8b0dcb46b84b33313bcb220ec` et
  `13ca6d8c2094545fc09491b4c25c51b837f7259c47e80f2b00f206c1b876816a`.
  Le logo Victor Buck Services répond en
  `image/svg+xml`, sur 12 978 octets, avec le SHA-256
  `396e6f894adc6eac6a6b9318a42ad13b216536b51320f94d88c7f7736b1dfc89`.
  Le thème d'organisation et son opt-out sont actifs par égalité exacte sur
  `victorbuckservices.com`. Les mêmes couleurs sont appliquées à l'e-mail de
  connexion quand leur contraste est sûr, avec retour atomique à la palette
  Parkventory sinon. Le rendu connecté a été contrôlé localement à 1440, 390 et
  320 px et l'e-mail à 1280 et 390 px, mais pas encore au moyen d'une session VBS
  réelle en production. Un ADMIN de tenant peut désormais consulter uniquement
  ses statistiques et membres, régler la palette et l'usage du logo déjà
  approuvé, et effacer l'adresse d'un membre sous les gardes documentées. Seul
  le godmode peut attribuer ou révoquer ce rôle.
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
  vers le Worker. `www` redirige vers l’apex en `308` en conservant le chemin et
  la requête.
- Le sitemap public répond en `application/xml` et ne contient que `/`,
  `/confidentialite` et `/mentions-legales`. Le `robots.txt` servi par
  Cloudflare conserve ses règles gérées et annonce
  `https://parkventory.com/sitemap.xml`.
- 50 tests Worker/D1, 76 tests React, 2 tests de marque, le typecheck Worker, le
  build et les dry-runs Wrangler préversion/production réussissent, soit 128
  tests. Le test de régression du callback vérifie que
  l'API de vérification n'est appelée qu'une fois, que le token disparaît de
  l'URL et que l'écran de succès ne rebascule pas vers « lien incomplet ».

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

- sortie réelle d’un magic link vérifiée, mais classement en boîte principale,
  consommation unique et rendu co-marqué de l'e-mail non revérifiés en
  production après la PR #25 ;
- parcours authentifié à deux membres, partage puis réservation non vérifié ;
- rendu co-marqué vérifié sur le candidat exact et les assets publics, mais pas
  encore observé dans une session VBS réelle en production ;
- nomination d'un admin VBS, parcours authentifié `/app/admin` et effacement
  d'une adresse non exercés sur des comptes réels en production ;
- exercice réel de restauration D1 et réactivation DNSSEC Cloudflare non
  prouvés.

L’infrastructure dynamique est active sur les serveurs Cloudflare autoritatifs,
mais ces gates interdisent encore de qualifier le produit MVP de prêt.
