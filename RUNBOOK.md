# Runbook Cloudflare

## Développement local

```bash
npm ci
install -m 600 .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

Ouvrir `http://127.0.0.1:8787`. Le site et l’API partagent la même origine.

## Validation proportionnée au MVP

```bash
npm run verify
```

Cette gate exécute les tests Worker/D1, les tests React, les deux typechecks, le
build statique, le contrôle de dérive des types Wrangler puis les dry-runs
préversion et production. Elle ne déploie rien et n’accède à aucune D1 distante.

## Préversion distante

```bash
npm run db:migrate:remote
npm run deploy
```

Avant le déploiement, vérifier que `APP_SECRET`, `TURNSTILE_SECRET_KEY` et, pour
le candidat godmode, `GODMODE_ADMIN_EMAIL_SHA256` sont des secrets Wrangler et
que le binding `EMAIL` est activé. Ne jamais passer une valeur secrète en
argument de commande ou dans Git.

## Production

```bash
npm run db:migrate:production
npm run deploy:production
```

La production utilise le Worker `parkventory-production`, la base D1
`parkventory-production`, les domaines personnalisés de l’apex et de `www`, le
binding `EMAIL` et les secrets `APP_SECRET`, `TURNSTILE_SECRET_KEY` et, une fois
le godmode activé, `GODMODE_ADMIN_EMAIL_SHA256`. Générer les types avec
`npm run cf:types` après toute modification de binding.

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
Cela inclut la migration `0006_user_locale.sql` : vérifier la colonne
`user_account.preferred_locale` sur la préversion puis la production avant que
le Worker qui la lit soit publié.

La migration `0005_tenant_administration.sql` doit être appliquée avant tout
Worker qui lit `logo_enabled` ou `email_erased_at`. Elle ajoute uniquement des
colonnes, index et triggers ; vérifier `membership_org_role_created_idx`,
`user_account_email_erased_idx`, `user_account_email_erasure_guard` et les deux
triggers `organization_branding_tenant_admin_*` en préversion puis en production.

## Préparer le candidat godmode

`GODMODE_ADMIN_EMAIL_SHA256` contient uniquement le SHA-256 hexadécimal de
l’adresse opérateur normalisée par suppression des espaces périphériques et
passage en minuscules. Calculer ce digest localement sans placer l’adresse dans
une ligne de commande, un terminal partagé ou un log, vérifier qu’il contient 64
caractères hexadécimaux, puis laisser Wrangler demander sa valeur sur l’entrée
standard :

```bash
npx wrangler secret put GODMODE_ADMIN_EMAIL_SHA256
npx wrangler secret put GODMODE_ADMIN_EMAIL_SHA256 --env production
```

La création ou rotation de ces secrets et tout envoi réel de magic link exigent
une autorisation explicite au moment de l’action. Aucun digest ni adresse ne doit
être recopié dans une preuve de livraison.

La migration `0004_godmode_admin.sql` dépend des tables existantes, crée
l’organisation `SYSTEM`, le registre `activity_event`, ses index, son backfill et
ses triggers.

Le numéro `0003` reste réservé au candidat de co-marque VBS. Si ce candidat est
fusionné, l’ordre distant attendu est `0003`, puis `0004` ; ne pas renuméroter
`0004` si `0003` n’est pas présent dans le checkout courant. Dans tous les cas,
aucun Worker qui lit le schéma godmode ne part avant l’application et la
vérification de toutes les migrations alors pendantes.

L’ordre sûr est :

1. exécuter `npm run verify` sur le candidat exact ;
2. appliquer la migration sur la D1 de préversion avec
   `npm run db:migrate:remote`, puis la lister et contrôler les tables, index,
   triggers et agrégats sans afficher de donnée personnelle ; vérifier notamment
   `activity_event_error_time_idx` et `availability_spot_active_window_idx` ;
3. appliquer et vérifier la même migration en production avec
   `npm run db:migrate:production` ;
4. seulement ensuite fusionner ou déployer le Worker qui lit
   `organization.kind` et `activity_event` ;
5. vérifier le Worker, les assets et le parcours authentifié séparément.

Le backfill porte `source = 'BACKFILL'` : il reconstruit les transitions depuis
les timestamps métier et ne doit pas être décrit comme une observation en temps
réel. Les événements postérieurs issus des triggers portent `TRIGGER`; les refus
et incidents classifiés écrits par le Worker portent `WORKER`.

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
11. Les routes privées localisées `/{locale}/app/admin`, `/{locale}/admin`,
    `/{locale}/admin/tenants`, `/{locale}/admin/users` et
    `/{locale}/admin/operations` répondent directement avec `noindex`; ce seul
    statut ne prouve pas l’autorisation godmode.
12. Un magic link réel arrive, ne fonctionne qu’une fois et expire après 15 min.
   En préversion contrôlée, cinq demandes concurrentes pour une même adresse
   doivent en accepter trois et en limiter deux, sans cinquième ligne ni envoi.
13. Deux membres du même domaine réalisent le parcours partage/réservation.
14. Deux réservations concurrentes avec des clés distinctes donnent un `200` et
   un `409`. Deux requêtes portant la même clé idempotente et la même offre
   donnent `200` et `200`, avec une seule ligne `reservation` et aucun faux refus
   métier dans `activity_event`.
15. Un membre d’un autre domaine ne voit aucune donnée du premier.
16. Sans session, `GET /api/v1/admin/overview` répond `401` ; une session tenant,
   y compris avec rôle `ADMIN`, reçoit `403`.
17. Une session réelle de l’identité système autorisée reçoit `200` sur les sept
   lectures admin, détail tenant et détail d’intégrité compris, et voit uniquement
   des organisations `TENANT` dans les métriques d’adoption. La même session
   reçoit `403` sur `GET /api/v1/dashboard`.
18. Les listes tenants, utilisateurs et activité paginent sans doublon ; un
   tenant inconnu répond `404`. Contrôler séparément que la table
   `activity_event`, les diagnostics et les logs ne contiennent ni adresse, ni
   token, ni cookie, ni hash d’authentification, ni erreur brute ; provoquer en
   test un conflit métier `409` et vérifier son événement `BUSINESS_RULE_REJECTED`
   dédupliqué avec route canonique et code ; les vues
   godmode utilisateurs, détail tenant et activité peuvent seulement enrichir
   les identifiants avec l’adresse de compte déjà conservée. Pour un contrôle
   d’intégrité en anomalie, ouvrir « Voir les lignes », paginer au moins deux pages
   si disponible, puis vérifier que tenant et références rejoignent les vues
   attendues sans exposer de donnée libre.
19. Les nouveaux liens placent le jeton dans le fragment `#token=`, jamais envoyé
    dans la requête de navigation ; le callback le retire immédiatement de l’URL.
    Les logs applicatifs structurés n’exposent que la route canonique et les logs
    d’invocation Cloudflare restent désactivés. Tester aussi la compatibilité
    transitoire avec un ancien lien query sans en recopier la valeur.
20. Sans session, `GET /api/v1/tenant-admin/overview` répond `401`; un membre
    simple reçoit `403`. Après nomination godmode, l’admin tenant reçoit `200`,
    ne voit que son domaine et ne peut fournir aucun autre tenant à l’API.
21. Sur des comptes de test uniquement, vérifier la modification des deux
    couleurs, l’opt-out du logo, puis l’effacement en deux étapes d’un membre :
    sessions et demandes de lien absentes, e-mail public `null`, adhésion et faits
    métier conservés. Ne jamais effectuer ce smoke sur une identité réelle.

## Investigation godmode

Depuis `/admin/operations`, commencer par la référence d’incident affichée ou
fournie par l’utilisateur. Elle est conservée comme identifiant interne de
l’événement `INCIDENT_RECORDED` ; utiliser son `request_id` associé pour
rapprocher les logs Workers, puis filtrer le journal par référence exacte, tenant,
utilisateur, type et sévérité. Regrouper les incidents avec le filtre exact de code
`UNHANDLED_<empreinte>` ; il représente une cause sans exposer la pile. Pour un
refus fonctionnel, rechercher `BUSINESS_RULE_REJECTED` et son code métier. Une
ligne `BACKFILL` prouve uniquement un état
historique dérivé. Ne copier dans un ticket ni adresse, ni token, ni corps de
requête.

Pour une anomalie d’intégrité, partir du compteur dans l’onglet Diagnostics,
ouvrir « Voir les lignes », puis suivre le tenant ou une référence interne vers
le journal. Un résultat `MISSING` décrit l’absence d’un état système attendu et
ne fabrique donc aucun identifiant cible.

Hormis la nomination bornée d’un administrateur de tenant, les données métier de
la console sont en lecture seule. Une correction D1 suit une procédure séparée
avec export ou bookmark Time Travel, requête bornée, contrôle avant/après et plan
de retour arrière. Ne jamais improviser une modification depuis le navigateur.

## Bascule et retour arrière

La bascule publique est un changement DNS unique après export et contrôle de
tous les records existants, notamment MX, SPF, DKIM et DMARC. Le rollback
web consiste à retirer les deux domaines personnalisés du Worker puis à recréer
les A de `parkventory.com` et `www.parkventory.com` vers `137.74.174.163`.
Ne jamais modifier les MX, SPF, DKIM, DMARC ou records `cf-bounce` pendant ce
rollback.

Après activation du godmode, supprimer ou remplacer le secret digest coupe les
nouveaux accès ; révoquer ensuite la session système concernée. La migration
`0004` est additive : un rollback applicatif peut ignorer ses colonnes et tables,
mais leur suppression exige une migration ultérieure et une sauvegarde vérifiée.
