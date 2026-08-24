# État vérifié — 24 août 2026

## Candidat Cloudflare

- Réécriture active sur la branche `codex/cloudflare-native-rewrite`, depuis
  `origin/main` au SHA `6865ae2b74e281cadf8fc7f4d7e3656d10f3dcbd`.
- Worker TypeScript, assets React et migration D1 initiale présents localement.
- Base distante `parkventory-preview` créée en juridiction UE :
  `9623bf62-4144-48c5-aa32-343f393e926a`.
- Migration `0001_cloudflare_mvp.sql` appliquée localement et sur cette base.
- Préversion déployée sur `https://parkventory.nclsppr.workers.dev`, version
  `7cbd0d19-edba-40a6-aeef-b0e75e1607fb`.
- 5 tests Worker/D1 et 32 tests React réussis ; build et dry-run Wrangler réussis.
- Landing desktop et connexion mobile revues dans Chromium sans erreur console ;
  sept routes directes et `/api/v1/health` répondent `200`, une API inconnue `404`.

## Production publique

La production dynamique n’est pas activée. `parkventory.com` reste servi par la
démo statique Atlas existante et son DNS reste chez OVH. Aucun enregistrement
DNS, MX, SPF ou routage public n’a été modifié par cette réécriture.

## Gates encore ouvertes

- offre Workers Paid et Email Service non activées ;
- domaine expéditeur Email Service non validé ;
- widget Turnstile de production et secrets Worker non créés ;
- test réel de délivrabilité, parcours authentifié complet et bascule DNS absents ;
- base D1 de production et preuve de restauration absentes.

Ces limites interdisent de qualifier le produit de prêt ou de dynamique en
production.
