# État vérifié — 31 août 2026

## Candidat SEO et i18n — non fusionné, non déployé

- La branche `codex/seo-i18n-four-locales`, créée sur
  `origin/main@938c3a40aef5e65affaf19d6a1c546cbfa5a78f1`, porte le candidat français,
  anglais, allemand et luxembourgeois. Elle n’a encore modifié ni `main`, ni la
  base D1 distante, ni le Worker public.
- Douze pages publiques ont des URLs stables, un canonical auto-référent, cinq
  alternates (`fr`, `en`, `de`, `lb`, `x-default`) et un contenu visible dans
  le HTML initial. Les routes privées et 404 restent hors index.
- La racine négocie le cookie puis `Accept-Language`; un choix explicite dans
  l’URL reste prioritaire. L’API, les erreurs, les dates, les e-mails et les
  routes de callback suivent la locale choisie.
- La fenêtre de partage et la date proposée utilisent le fuseau du parking. Les
  valeurs temporelles brutes restent dans le contrat API et les libellés sont
  formatés côté client avec `Intl`.
- La gate `npm run verify` réussit avec 6 tests de marque, 99 tests Worker/D1,
  93 tests React, le typecheck Worker, le build Vite et le dry-run Wrangler. La
  matrice Worker traverse réellement le binding Assets pour les douze pages,
  les `HEAD`, 404 conditionnelles, fichiers SEO, manifestes et images.
- Les assets raster et le favicon carré ont été contrôlés. Une revue locale
  dans Chrome a couvert les douze pages publiques, les écrans connectés, la
  connexion, les callbacks, les pages introuvables et les menus mobiles à
  320 × 568 et 1 440 × 900, complétée par des vues à 390 × 844. Elle a permis
  de confirmer la correction du repli anglais observé sur les dates, heures et
  fuseaux `lb-LU`, de deux débordements allemands et de la cible réelle de 42 px
  du sélecteur. Safari, Firefox, Edge et un iPhone réel restent requis par la
  matrice avant le pilote.
- La PR #28 de palette VBS reste ouverte et verte sur le même `origin/main`.
  Si elle fusionne avant ce candidat, il faudra rebaser et résoudre ses fichiers
  communs avant toute fusion.

## Production publique observée le 31 août 2026

- `https://parkventory.com/en/` répond encore avec le titre français ;
  `sitemap.xml` ne contient encore que `/`, `/confidentialite` et
  `/mentions-legales`.
- `manifest-lb.webmanifest` et un asset JavaScript inexistant répondent encore
  `200 text/html`. Ces sondes confirment que le contrat multilingue et les vraies
  404 de ce candidat ne sont pas encore en production.

## Production Cloudflare active — snapshot historique du 26 août 2026

- La réécriture Cloudflare-native est sur `origin/main` depuis la PR #13,
  fusionnée au SHA `bd95f98ab73d7644fcc20a2f8d717ca16c3c8ff0`.
- La base D1 `parkventory-production` est créée en juridiction UE sous
  l’identifiant `07118826-b935-4f87-9fca-a5d1e6a01218` ; la migration
  `0001_cloudflare_mvp.sql` et la migration additive
  `0002_organization_branding.sql` sont appliquées. Cette dernière a été
  vérifiée d'abord en préversion puis en production avant le déploiement du
  Worker qui la consomme. Un bookmark Time Travel de production a été relevé
  sans exécuter de restauration.
- Le Worker `parkventory-production` est déployé avec D1, les assets React,
  Email Service et les deux secrets requis. La version active est
  `be066191-cc08-4bd3-ac0f-e9b7ff59b08a`, à 100 % du trafic.
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
  version 13 automatiquement.
- La production sert les assets `index-F71pvGtu.css` et `index-CkISoqqV.js` ;
  le JavaScript est byte-identique au build vérifié, avec le SHA-256
  `8ae8173be9d482732ccbc3089a9fd168549336920294e0a5f1eb087d2880253f`.
  Le logo Victor Buck Services répond en
  `image/svg+xml`, sur 12 978 octets, avec le SHA-256
  `396e6f894adc6eac6a6b9318a42ad13b216536b51320f94d88c7f7736b1dfc89`.
  Le thème d'organisation et son opt-out sont actifs par égalité exacte sur
  `victorbuckservices.com`. Les mêmes couleurs sont appliquées à l'e-mail de
  connexion quand leur contraste est sûr, avec retour atomique à la palette
  Parkventory sinon. Le rendu connecté a été contrôlé localement à 1440, 390 et
  320 px et l'e-mail à 1280 et 390 px, mais pas encore au moyen d'une session VBS
  réelle en production.
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
- 20 tests Worker/D1, 47 tests React, le typecheck Worker, le build et le dry-run
  Wrangler de la gate réussissent. Le test de régression du callback vérifie que
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
- exercice réel de restauration D1 et réactivation DNSSEC Cloudflare non
  prouvés.

L’infrastructure dynamique est active sur les serveurs Cloudflare autoritatifs,
mais ces gates interdisent encore de qualifier le produit MVP de prêt.
