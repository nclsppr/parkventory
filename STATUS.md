# STATUS.md

Snapshot de l'état réellement vérifié. Il ne remplace ni le contrat stable de
`PROJECT.md`, ni l'ordre de livraison de `ROADMAP.md`.

Ce snapshot a été capturé après la fusion de la PR #4 et avant le commit de
consolidation documentaire qui le décrit. Les SHA et digests ci-dessous sont
donc des preuves historiques. Chaque push ultérieur sur `main`, même limité à
la documentation, publie de nouveaux candidats statique et applicatif ; leur
état courant doit être résolu dans les workflows puis vérifié sur Atlas. Les
invariants durables restent l'activation statique et la désactivation Compose.

## Delta local non publié du 2026-08-23

La branche de préparation issue des candidats RLS et OIDC ajoute le parcours
minimal d'annulation et de retrait décrit par l'ADR-0013. Le réservataire peut
annuler avant le début ; le créneau redevient disponible et l'outbox notifie le
titulaire. Celui-ci peut ensuite retirer l'offre, tandis qu'une réservation
active bloque toujours le retrait. Les deux transitions sont idempotentes et
auditées.

Le test d'intégration Quarkus exerce également deux réservations HTTP
simultanées et observe exactement un succès et un conflit `409`. Deux
publications simultanées à la limite active produisent aussi un seul succès. La gate locale
complète `npm run verify` réussit sur le worktree final : 46 Markdown et builds
documentaires, 24 contrôles de contrat, 48 tests React, audit npm sans
vulnérabilité, builds frontend, migration V1 isolée, reprise V3 vers V5 non
vide et 41 tests Quarkus sur chacune des images PostgreSQL 17.10 et 18.3, puis
9 tests métier sous rôle runtime RLS sur chacune. Le smoke Compose repart sans
cache et couvre identité, partage, réservation, annulation, retrait,
notification et invitation. Ce delta ne constitue ni un push, ni une release,
ni une activation de production, ni une preuve publique. Les routes Partager
et Trouver ont aussi été relues dans Chromium à 390 × 844 et 1 280 × 720 :
aucun débordement horizontal, cibles d'action de 44 px minimum et aucune erreur
console observée. Safari et les technologies d'assistance réelles restent hors
de cette preuve.

## Référence

| Champ | Valeur |
| --- | --- |
| Vérifié le | 2026-08-18 |
| Par | Codex |
| Branche au snapshot | `main`, `origin/main` exact à `583e0e2b63701097aa4894ecc4fb3de8ad325346` après fusion de la PR #4 |
| Commits applicatifs | `e069d04` — backend persistant et Mailpit ; `9f7b9be` — frontend local réel ; `c748d32` — logo SVG canonique ; `47ee871` — routes Partager et Trouver ; `25d3197` — narration et interactions de la landing ; `835515a` — stabilisation du parcours CI ; `75c6a37` — thèmes sombre et clair sélectionnables ; `e53ae9a` — stabilisation de la gate et audit npm ; `c5b9dc5` — audit de lisibilité du thème clair ; `c61fb2e` — publication Nimbus filtrée ; `db088b8` — sécurisation du candidat statique Atlas ; `583e0e2` — publication des releases Atlas statique et full-stack immuables |
| Environnement | macOS Darwin 27.0.0 arm64, OrbStack 29.4.0, Node 24.18.0, npm 11.16.0, Python 3.12.13 |
| Version livrée | F02, F03 et F04 partielles ; démo statique Atlas active en HTTPS ; candidat OCI React/Java publié, mais application Compose désactivée et non déployée |

## Résumé

Dans ce snapshot du 2026-08-18, `origin/main` était exactement
`583e0e2b63701097aa4894ecc4fb3de8ad325346`. Les workflows Verify
`32071732726`, VPS release `32071732693`, Pages `32071732707` et Application
release `32071732734` ont tous réussi sur ce SHA.

La démo statique Atlas était la seule surface propriétaire de
`parkventory.com`. Le tuple observé sur Atlas contenait le site
`ghcr.io/nclsppr/parkventory-static-site@sha256:eb4596ac08e76bf59dc0c1ed6982f8cad6a25e98bc09b507790a78107e41553c`
et l'inventaire de routes
`ghcr.io/nclsppr/parkventory-static-routes@sha256:47673d6906494ed128616357efe305e7be372e06022f4a2a794dcdc164ecbe7a`.
L'apex `https://parkventory.com/` répond HTTP 200 et
`https://www.parkventory.com/` effectue une seule redirection vers l'apex, qui
répond ensuite HTTP 200. Cette surface reste compilée avec
`VITE_DEMO_MODE=true` : aucun backend, secret, compte ou stockage Parkventory
n'est exposé.

Le même SHA avait publié le premier candidat applicatif canonique
`ghcr.io/nclsppr/parkventory/application-release@sha256:384f736a81089a9a91a7ff55b21d552a6d803d65ab8e33daa296b54d990209a3`.
Il lie les images React et Java/Quarkus, le migrateur dédié et le bundle
`vps-integration`, et satisfait les validations du contrat d'admission. Cette
publication n'est pas une activation : dans `vps-infra`, Parkventory reste
`enabled: false` pour le contrôleur Compose, aucune base ni secret Parkventory
n'est provisionné et aucune migration de production n'a été exécutée.

Le contrôleur applicatif transactionnel est fusionné sur `vps-infra/main`, mais
la convergence live de cette révision n'est pas prouvée et aucun workflow
applicatif ne l'appelle tant que l'entrée reste désactivée. Le domaine et la
route restent donc exclusivement détenus par la démo statique jusqu'à une
bascule plateforme distincte et auditée.

Une gate de préparation vérifie maintenant les migrations V1 à V5 et les
tests Quarkus sur les images exactes PostgreSQL 17.10 et 18.3. L'ADR-0015
sélectionne PostgreSQL 17.10 sur le cluster partagé Atlas pour la bêta publique,
tandis que PostgreSQL 18.3 reste la baseline locale. Cette sélection ne crée
aucune base Atlas et ne remplace ni sauvegarde, ni restauration, ni cutover.

Le parcours local n'est plus une simulation. Docker Compose démarre
PostgreSQL 18.3, Mailpit 1.30.6, Java 25 / Quarkus 3.33.3 LTS et React/Vite.
Une adresse professionnelle reçoit un lien magique dans Mailpit ; sa
consommation crée une session serveur, résout l'organisation et permet de
déclarer, partager puis réserver une place. Les mutations et l'outbox sont
persistées dans PostgreSQL, et Mailpit reçoit invitations et notifications.

Le frontend local ne retombe jamais silencieusement sur les données fictives :
une session absente, une API indisponible et un tableau vide possèdent des états
explicites. GitHub Pages reste volontairement une démo statique, signalée et
sans backend.

Le Dashboard est désormais une synthèse. Les tâches complètes vivent sur
`/app/partager` et `/app/trouver`, dans le même shell responsive. Le premier
valide puis résume l'absence avant publication ; le second affiche l'agenda
PostgreSQL à sept jours et sépare sélection de la place et confirmation de la
réservation.

La landing dispose maintenant d'un récit au scroll progressif et dégradable :
les sections se révèlent une fois, le repère du processus et ses étapes utilisent
GSAP uniquement sur grand écran, et le contenu reste visible sans ce runtime.
Le header sticky, ses ancres et le lien d'évitement tiennent compte des safe
areas Safari ; l'aperçu produit porte explicitement son statut de démonstration.

Le thème sombre reste la signature et le choix initial. Une variante claire
ivoire couvre désormais la landing, l'authentification, l'application et les
routes d'erreur. Le sélecteur explicite clair/sombre est accessible au clavier,
appliqué avant le premier rendu et mémorisé localement sans dépendance au
backend ni bascule silencieuse selon le système.

Nimbus est maintenant publié sous `/parkventory/docs/`. Seule la collection
`product` classée `public` entre dans l'artefact ; les collections internes et
de référence restent réservées au build local complet. Les liens de navigation,
de recherche, de sitemap, Open Graph, Markdown et d'agents respectent le
sous-chemin Pages.

Project Foundation `v0.5.2` au commit
`708d7374f87060809a805c57abc2cf7e7b66c182` est adopté en pack `critical`.
`P18` impose commit et push des tranches validées ; `P19` impose Compose comme
graphe local intégré.

## Phases actives

| Phase roadmap | État observé | Preuve restante avant clôture | Responsable |
| --- | --- | --- | --- |
| F02 — Surface et squelette | `in_progress` | Générer le client OpenAPI et rejouer le démarrage depuis un clone propre | nclsppr |
| F03 — Identité et communauté | `in_progress` | Tenant Auth0/Resend, OTP et délivrabilité externes ; anti-abus, matrice tenant A/B et RLS sont vérifiés localement | nclsppr |
| F04 — Partager et réserver | `in_progress` | Parcours public réel et matrice heure d'été ; concurrence, annulation, retrait et fuseau API sont vérifiés localement | nclsppr |

## Livré et vérifié

| Capacité | Périmètre réel | Preuve | Limite connue |
| --- | --- | --- | --- |
| Identité locale | Lien 256 bits, hash en base, durée 15 min, consommation unique, session `HttpOnly` 7 jours | Tests Quarkus, smoke Compose, parcours navigateur | Endpoints supprimés du build `prod` |
| Identité OIDC sélectionnée | Auth0 EU Universal Login Email OTP, client confidentiel, PKCE/state/nonce, issuer/audience exacts, claims vérifiés et pont `app_session` tenant | Tests de profils, claims et provisioning PostgreSQL sous rôle runtime non propriétaire ; contrat adversarial et images de production | Tenant, secrets réels, callback public et flux OTP externe absents |
| Communauté | Invitation exacte prioritaire, sinon organisation communautaire unique par domaine | PostgreSQL réel et tests d'intégration | Domaine partagé/filiales et liste anti-abus à durcir |
| Application React | Connexion, dashboard de synthèse, routes dédiées de partage et recherche, réservation, annulation, retrait, invitation, chargements, erreurs, états vides et choix clair/sombre persistant | 48 tests Vitest, build, navigation History API et navigateur sans erreur console | Client OpenAPI encore manuel ; recherche limitée à l'agenda de sept jours |
| Identité visuelle | Master SVG fourni utilisé dans les huit emplacements React, les favicons, le header Nimbus et les cartes Open Graph ; palettes sombre et claire sémantiques ; plaque de contraste claire sans recoloration du master | Gate anti-dérive, tests de ratios et revue des deux thèmes desktop/mobile | Symbole seul ; aucun wordmark vectoriel ni variante monochrome |
| API Quarkus | Session, dashboard, place, partage borné, réservation/annulation/retrait idempotents et invitation | Migration V1 isolée, reprise V3 vers V5 non vide et 41 tests sur chacune des images exactes PostgreSQL 17.10 et 18.3, contrat OpenAPI `0.4.3` | Administration absente |
| PostgreSQL | Schéma multi-tenant, sessions, métier, outbox ordonnée par agrégat, audit, idempotence, exclusions GiST, index de gestion des offres et RLS forcée | V1 isolée, migration jusqu'à V5, `btree_gist`, trois exclusions, test adversarial et parcours sous rôle non propriétaire sur 17.10 et 18.3 | Rôle runtime et migrations Atlas restent à vérifier en live avant activation |
| Notifications | Invitation, réservation et annulation écrites avec l'outbox ordonnée puis livrées avec reprise bornée | Messages observés dans Mailpit | Délivrabilité Resend externe non prouvée |
| Environnement | Quatre services Compose, images par digest, healthchecks et volumes | Checker indépendant, smoke complet et stack locale saine | Docker ou OrbStack requis |
| Démo Pages | Landing animée, dashboard, partage et recherche statiques sous `/parkventory/` | Run Pages `32071732707` réussi sur `583e0e2` | Aucun compte, email ou stockage distant |
| Documentation Nimbus | Vision, parcours, rôles et règles produit sous `/parkventory/docs/` | Run Pages `31499873475`, routes publiques HTTP 200 et routes exclues HTTP 404 sur `c61fb2e` | Seule la collection produit est publique ; le corpus complet reste local |
| Producteur applicatif Atlas | Images backend/frontend amd64 non-root, migrateur dédié, Compose app-only, intégration déterministe et release canonique | Run Application release `32071732734` vert sur `583e0e2` ; digest canonique `sha256:384f736a81089a9a91a7ff55b21d552a6d803d65ab8e33daa296b54d990209a3` | Candidat publié et contractuellement admissible ; aucune admission live ni activation Compose |
| CI | Gate Foundation, docs, audit, React, Quarkus et smoke Compose ; publications statique et applicative | Run Verify `32071732726` réussi sur `583e0e2`, puis les deux workflows de release distants verts | Un run vert de publication ne vaut pas activation du candidat full-stack |
| Démo Atlas statique | Même démo construite sous `/`, avec routes directes et artefacts OCI déterministes | Source `583e0e2`, site `sha256:eb4596ac08e76bf59dc0c1ed6982f8cad6a25e98bc09b507790a78107e41553c`, routes `sha256:47673d6906494ed128616357efe305e7be372e06022f4a2a794dcdc164ecbe7a`, HTTPS public vérifié | Démo sans API ni persistance ; elle détient exclusivement la route tant que Compose reste désactivé |
| Contrôleur applicatif Atlas | Contrôleur transactionnel, migrations dédiées, probes et recovery présents dans `vps-infra/main` | Contrat central : Parkventory `enabled: false`, exclusion mutuelle avec la démo statique | Révision non prouvée convergée live ; aucune base, aucun secret, aucune migration et aucun cutover |

## État opérationnel

| Surface | URL ou accès | Santé au 2026-08-18 |
| --- | --- | --- |
| Landing locale | `http://127.0.0.1:5173/` | Fonctionnelle |
| Application locale | `http://127.0.0.1:5173/app` | Authentification et données réelles |
| Partage local | `http://127.0.0.1:5173/app/partager` | Publication PostgreSQL réelle |
| Recherche locale | `http://127.0.0.1:5173/app/trouver` | Agenda à sept jours et réservation réelle |
| Mailpit | `http://127.0.0.1:8025/`, SMTP `127.0.0.1:1025` | Healthy, messages persistés localement |
| API | `http://127.0.0.1:8080/api/v1` | Readiness `UP` |
| Swagger UI | `http://127.0.0.1:8080/q/swagger-ui` | Accessible |
| PostgreSQL | `127.0.0.1:5434` | Healthy, Flyway V2 |
| Démo publique | `https://nclsppr.github.io/parkventory/`, `/app/`, `/app/partager/` et `/app/trouver/` | Toutes les entrées HTTP 200 ; route inconnue HTTP 404 |
| Documentation publique | `https://nclsppr.github.io/parkventory/docs/` | Accueil, produit, recherche, agents et variantes Markdown HTTP 200 ; routes internes testées HTTP 404 |
| Premier candidat applicatif observé | `ghcr.io/nclsppr/parkventory/application-release@sha256:384f736a81089a9a91a7ff55b21d552a6d803d65ab8e33daa296b54d990209a3` | Publié, attesté et validé par le workflow ; Compose désactivé |
| Production applicative | Aucun accès public dynamique | Base, secrets, migrations et cutover non réalisés |
| Démo Atlas statique | `https://parkventory.com/` et `https://www.parkventory.com/` | Apex HTTP 200 ; `www` redirige une fois vers l'apex ; aucun backend dynamique |

Les projets Docker isolés des validations du 2026-08-17 ont été retirés par
leurs traps de nettoyage. Seul le site statique est actif : aucun service
Compose, PostgreSQL ou migrateur Parkventory n'a été démarré sur Atlas.

## Validations récentes

| Date | Commande ou contrôle | Résultat | Portée de la preuve |
| --- | --- | --- | --- |
| 2026-08-18 | `mise exec -- npm run production:images:test` | Images amd64 non-root, migrations V1/V2/V3, runtime sans DDL, routes magic-link absentes, redirection Auth0 avec PKCE/state/nonce, callback virtuel intercepté, révocation d’une `app_session` malgré un cookie OIDC invalide et expiration explicite des cookies | Conteneurs et fournisseur OIDC factice locaux ; le faux code prouve l’interception mais pas un échange Auth0 heureux, l’email OTP ni Atlas |
| 2026-08-18 | `mise exec -- ./mvnw test -Dtest=OidcIdentityClaimsTest,AuthProfileExposureTest,OidcIdentityServiceTest` | 10 tests réussis ; claims dégradés refusés, profils exclusifs, liaison et session tenant exercées sous rôle runtime non propriétaire, invitation OIDC sans token et logout idempotent sans token-state vérifiés | PostgreSQL 18.3 local éphémère ; aucune preuve fournisseur ou Atlas |
| 2026-08-18 | `mise exec -- npm run postgres:verify` | V1 puis V2/V3, 11 tests Quarkus et build sur chacune des images PostgreSQL 17.10/18.3 ; parcours métier 3/3 répété sous rôle runtime non propriétaire et sans `BYPASSRLS` | Matrice locale éphémère ; les tests OIDC complémentaires emploient leur propre PostgreSQL 18.3 et aucune preuve ne crée rôle, base ou migration sur Atlas |
| 2026-08-18 | `mise exec -- ./mvnw test -Dtest=TenantIsolationTest,DashboardResourceTest,PostgresCompatibilityTest` | Migration V3 appliquée ; RLS forcée, absence/mauvais contexte, tenant A/B, bootstrap invitation/domaine, retry outbox et parcours session/métier réussis sur PostgreSQL 18.3 | Preuve locale sous rôle non propriétaire, sans migration Atlas ni activation de production |
| 2026-08-18 | `mise exec -- ./scripts/verify.sh` après consolidation opérationnelle | Gate complète réussie : catalogue/Markdown, Nimbus, contrats de release, audit npm, 35 tests React, builds Pages/Atlas, PostgreSQL 17.10/18.3 et smoke Compose | Prouve la cohérence du dépôt et des documents modifiés ; ne change aucun état Atlas |
| 2026-08-18 | État Git et workflows du merge #4 | `origin/main` exact `583e0e2b63701097aa4894ecc4fb3de8ad325346` ; Verify `32071732726` et Pages `32071732707` réussis | Prouve la source canonique et ses gates, pas l'activation Compose |
| 2026-08-18 | Workflow VPS release `32071732693` | Publication statique réussie ; site `sha256:eb4596ac08e76bf59dc0c1ed6982f8cad6a25e98bc09b507790a78107e41553c` et routes `sha256:47673d6906494ed128616357efe305e7be372e06022f4a2a794dcdc164ecbe7a` | Artefacts immuables du SHA exact ; l'état live est contrôlé séparément |
| 2026-08-18 | Workflow Application release `32071732734` | Tous les jobs réussis ; release canonique `sha256:384f736a81089a9a91a7ff55b21d552a6d803d65ab8e33daa296b54d990209a3` publiée et attestée | Candidat full-stack uniquement ; aucune base, migration, route ni activation Compose |
| 2026-08-18 | État Atlas et probes HTTPS publics | Tuple statique exact actif ; `parkventory.com` HTTP 200 et `www.parkventory.com` redirige une fois vers l'apex puis HTTP 200 | Disponibilité ponctuelle de la démo statique ; pas une supervision ni une preuve de backend |
| 2026-08-17 | `mise exec -- ./scripts/verify.sh` | Gate complète réussie : 39 Markdown, Nimbus, 7 tests contractuels, audit npm, 35 tests React, builds statiques, Quarkus/PostgreSQL 17.10 et 18.3, puis parcours Compose | Preuve locale ; ne publie ni image, ni release, ni déploiement |
| 2026-08-17 | `mise exec -- npm run production:images:test` | Images backend/frontend amd64 construites depuis les digests verrouillés ; utilisateurs non-root, migrateur V1/V2 one-shot, runtime en lecture seule sain et rôle PostgreSQL runtime sans DDL | Conteneurs locaux éphémères ; pas de scan distant, SBOM ou attestation avant le workflow |
| 2026-08-17 | Tests contractuels, ORAS 1.3.0 en layout OCI local, `actionlint` 1.7.12 et validateurs `vps-infra` | Bundle et release déterministes ; manifests `vps-integration` et `application-release` exacts ; Compose rendu accepté avec les trois images attendues | Validation locale sans authentification ; aucun roundtrip GHCR ni admission live exécuté |
| 2026-08-12 | `scripts/test_postgres_compatibility_contract.sh` | Une décision de production falsifiée est rejetée avec un statut non nul avant Docker et aucun message de succès | Preuve négative du chemin shell ; les autres mutations invalides restent couvertes par les validations du même parseur |
| 2026-08-12 | Inspection des manifestes OCI et état de déploiement Atlas transmis par l'opérateur | Source `db088b831ad09092e07a42c5cf54ff28676c284c`, site `sha256:799d8dfa9e3a5b4b169e984575cea05a02b92522258531db267ada1f2472d614`, routes `sha256:d31ae39ba0a4399a637b8fdbcc0bf4d6a3595b29509e85fb3e75cfee219568fc`, matérialisation immuable et préflight HTTP réussis | Démo statique Atlas seulement ; DNS, HTTPS public, API et persistance non activés |
| 2026-08-12 | `mise exec -- npm run postgres:verify` | Test V1 dédié puis quatre tests V2, version serveur, `btree_gist` et exclusions réussis sur PostgreSQL 17.10 et 18.3 par digest exact | Compatibilité locale arm64 ; aucune décision de version, base Atlas, sauvegarde ou production |
| 2026-08-11 | GitHub Actions Verify `31499873532` et Pages `31499873475` sur `c61fb2e` | Deux workflows réussis au premier passage ; artefact combiné déployé | Gate distante complète et publication filtrée de Nimbus |
| 2026-08-11 | Probes Nimbus publiques après `c61fb2e` | Accueil, aperçu, quatre pages produit, recherche, agents, sitemap, `robots.txt`, favicon et variantes Markdown HTTP 200 ; `project` et `docs/internal/open-questions` HTTP 404 | Disponibilité publique ponctuelle et frontière d'audience de l'artefact ; pas une supervision continue |
| 2026-08-11 | `npm run check --prefix docs-nimbus` | 13 tests, 102 fichiers sans diagnostic, 46 pages de contenu générées depuis 37 Markdown et 47 fichiers lintés | Corpus local complet ; aucune preuve de publication |
| 2026-08-11 | `npm run pages:build` après filtrage Nimbus | Frontend construit ; 4 sources produit donnent 7 pages de contenu, 9 HTML et 93 fichiers sous `frontend/dist/docs/` | Artefact local public ; collections `internal`, `reference` et `archive` absentes |
| 2026-08-11 | Inspection des URL et audiences Nimbus publiques | Base `/parkventory/docs/` présente dans navigation, recherche, canonical, Open Graph, sitemap, Markdown et index d'agents ; routes `project`, `status`, `design`, décisions, documents internes et Foundation absentes | Inspection statique de l'artefact ; réponses HTTP distantes encore à vérifier |
| 2026-08-11 | Serveur statique local monté sous `/parkventory/` | Accueil Nimbus, index, quatre pages produit, agents, sitemap, Pagefind et favicon HTTP 200 ; `project` et `docs/internal/open-questions` HTTP 404 | Fidélité des chemins de l'artefact ; pas une preuve de disponibilité GitHub Pages |
| 2026-08-11 | GitHub Actions Verify `31490845653` et Pages `31490845612` sur `c5b9dc5` | Deux workflows réussis au premier passage ; Pages déployé | Gate distante complète et publication statique de l'audit de lisibilité ; ne couvre pas Safari iPhone réel |
| 2026-08-11 | Probes Pages après `c5b9dc5` | Landing et quatre routes directes HTTP 200, route inconnue HTTP 404 ; CSS publié contient le traitement `forced-colors` | Disponibilité publique ponctuelle, pas une supervision continue |
| 2026-08-11 | Axe Core `4.13.0`, six routes, deux thèmes et deux viewports | 24 audits WCAG A/AA, 2.1 AA et 2.2 AA sans violation ni erreur console | Chromium local ; outil temporaire hors dépendances du projet, pas une preuve Safari ou technologie d'assistance réelle |
| 2026-08-11 | Contrastes automatisés du thème clair | 13 vérifications de ratio : texte secondaire au moins 5,38:1, encres d'accent au moins 6,69:1, texte sur aplats au moins 14,09:1, plaque du logo au moins 9,77:1 et bordure forte au moins 3,03:1 | Calcul sRGB sur les tokens et couleurs du master ; ne mesure pas une photographie composite |
| 2026-08-11 | `npm run frontend:test`, trois passages consécutifs | 34 tests réussis à chaque passage | Ratios, clavier du thème, persistance, horaires inversés, absence de contrôle masqué tabulable et parcours React existants |
| 2026-08-11 | Revue claire après audit de lisibilité | Landing et application à 1 440 × 900, 390 × 844 et 320 × 568 ; focus des champs, couleurs forcées et absence de débordement vérifiés | Chromium local avec mouvement réduit ; Safari iPhone réel reste requis avant pilote |
| 2026-08-11 | GitHub Actions Verify `31483526624` et Pages `31483526656` sur `e53ae9a` | Deux workflows réussis au premier passage ; Pages déployé | Gate distante complète, puis publication statique ; ne couvre pas Safari iPhone réel |
| 2026-08-11 | Probes `https://nclsppr.github.io/parkventory/` et quatre routes directes | Cinq réponses HTTP 200 ; bootstrap de thème présent dans le HTML | Disponibilité publique ponctuelle après déploiement ; pas une supervision continue |
| 2026-08-11 | `npm audit --audit-level=high` après verrouillage de `nanoid` `3.3.18` | Aucun avis rapporté | Arbre npm verrouillé à cet instant ; ne prédit pas les avis futurs |
| 2026-08-11 | `npm run frontend:test` | 19 tests réussis | Sélecteur clair/sombre, choix initial, persistance, valeur invalide, routes et parcours React existants |
| 2026-08-11 | `npm run frontend:build` et `npm run pages:build` | Builds Vite réussis ; CSS initial 13,11 Ko gzip et JavaScript initial inférieur à 77 Ko gzip | Typecheck, bundle local et cinq entrées statiques Pages ; ne mesure pas le LCP réseau |
| 2026-08-11 | Revue des thèmes sombre et clair | Landing, application, partage et recherche à 1 440 × 900 et 390 × 844 ; contrôles de largeur à 320 px et 768 px, sans débordement ni erreur console | Chromium local ; Safari iPhone réel reste requis avant pilote |
| 2026-08-11 | Contrastes de la palette claire | Texte 18,25:1 ; textes secondaires et encres d'accent au moins 7,13:1 ; bordure de contrôle 3,42:1 ; texte sombre sur aplats d'accent au moins 14,49:1 | Calcul initial des paires canoniques, désormais complété par les tests de ratios et les 24 audits Axe ci-dessus |
| 2026-08-12 | `npm run pages:build`, puis `npm run atlas:build` | Bases `/parkventory/` et `/` construites séparément avec les cinq entrées HTML | Prouve les deux chemins statiques, pas leur publication |
| 2026-08-12 | double `scripts/build-vps-release.sh` | Archives et inventaires identiques byte à byte, routes directes présentes | Prouve le conditionnement déterministe local, pas la provenance distante |
| 2026-07-30 | `npm run brand:check` | Trois copies SVG exactes et dérivé PNG conformes au master | Détecte un fichier absent ou divergent |
| 2026-07-30 | `npm run frontend:test` | 15 tests réussis | Routes exactes, liens directs, navigation partagée, compatibilité des anciens intents, partage et réservation réels |
| 2026-07-30 | `npm run frontend:build` après revue motion | Build Vite réussi ; JavaScript initial 75,69 Ko gzip, GSAP 27,28 Ko gzip et ScrollTrigger 17,41 Ko gzip en chunks différés | Reste sous le budget initial de 180 Ko gzip ; ne mesure pas le LCP réseau |
| 2026-07-30 | Revue landing desktop et mobile | 1 440 × 900, 390 × 844 et 320 × 568 sans débordement ; ancres sous header, menu mobile, cibles 44 px et séparateurs vérifiés | Chromium local ; iPhone Safari réel reste requis avant pilote |
| 2026-07-30 | Profil dependency-change pour GSAP `3.13.0` | Version exacte, intégrité npm, origine GreenSock, licence, absence de transitive et retrait consignés ; audit npm à zéro résultat | Le scan est daté et ne garantit pas l'absence future de vulnérabilité |
| 2026-07-30 | `mise exec -- npm run verify` après revue motion | Gate complète réussie | 36 Markdown, Nimbus, audit, 15 tests React, build Pages, 3 tests Quarkus/PostgreSQL et parcours Compose complet |
| 2026-07-30 | `npm run pages:build` | Build Vite réussi sous `/parkventory/`, JS initial 74,57 Ko gzip et cinq entrées HTML contrôlées | Artefact local prêt à déployer |
| 2026-07-30 | Build et revue Nimbus | 47 pages générées, header/favicons et carte Open Graph avec le logo | Rendu local desktop/mobile |
| 2026-07-30 | Parcours navigateur du logo | Landing, connexion, dashboard et documentation à 1 440 px et 390 px | Aucun débordement horizontal, master visible aux tailles prévues |
| 2026-07-30 | `mise exec -- ./mvnw verify` dans `backend/` | 3 tests réussis sur PostgreSQL 18.3 | Identité, sessions, tenant, métier, conflits et outbox |
| 2026-07-30 | `npm run compose:verify` | Parcours PostgreSQL, Mailpit, Quarkus et Vite réussi | Projet et volumes de vérification isolés puis retirés |
| 2026-07-30 | `mise exec -- npm run verify` | Gate complète réussie | 36 Markdown catalogués, Nimbus vert, audit npm sans vulnérabilité, 15 tests React, 3 tests Quarkus et smoke Compose des routes directes |
| 2026-07-30 | Parcours navigateur des routes | `RR-30` partagé depuis `/app/partager`, puis sélectionné et réservé par un collègue depuis `/app/trouver` | Deux adresses synthétiques `.test`, données relues depuis PostgreSQL, aucune donnée réelle |
| 2026-07-30 | Parcours navigateur local | Lien Mailpit, session, `UI-30`, partage, collègue, réservation et notification observés | Trois adresses synthétiques `.test`, aucune donnée réelle |
| 2026-07-30 | Console navigateur | Aucune erreur ou alerte | Landing et application desktop locales |
| 2026-07-30 | GitHub Actions Verify `30536319811` | Réussi sur `c748d32` | CI distante, pas déploiement backend |
| 2026-07-30 | GitHub Pages `30536319671` | Build et déploiement réussis ; landing et app contrôlées | Démo statique uniquement |
| 2026-07-30 | GitHub Actions Verify `30542280025` | Réussi sur `47ee871` en 2 min 26 s | Rejoue notamment les 15 tests React, Quarkus/PostgreSQL et le smoke Compose |
| 2026-07-30 | GitHub Pages `30542280043` | Build et déploiement réussis ; landing, app, partage, recherche et callback HTTP 200 | Route inconnue HTTP 404 ; démo statique uniquement |
| 2026-07-30 | GitHub Actions Verify `30548090051` | Réussi sur `835515a` après la revue motion | Rejoue documentation, audit, 15 tests React, Quarkus/PostgreSQL et le smoke Compose complet |
| 2026-07-30 | GitHub Pages `30548089705` | Build et déploiement réussis sur `835515a` | Cinq routes HTTP 200, route inconnue HTTP 404, assets initiaux et chunks GSAP/ScrollTrigger HTTP 200 |

## Blocages externes

| Blocage | Impact | Propriétaire | Condition de reprise |
| --- | --- | --- | --- |
| Comptes Auth0 EU et Resend non provisionnés | Empêche toute connexion et délivrabilité réelle malgré les contrats acceptés | nclsppr | Tenant, domaine, callback et secrets installés hors Git, puis OTP, invitation et notification réels testés |
| Sauvegarde offsite et alertes non raccordées | Empêche de prouver restauration et détection d'incident avant le cutover | nclsppr | Stockage chiffré sélectionné, restauration isolée réussie et routage Alertmanager testé |
| Contrôleur Compose non activé et cutover plateforme non livré | Le candidat publié ne peut pas remplacer la démo statique en sécurité ; le code du contrôleur central est fusionné mais son entrée reste désactivée | nclsppr | Convergence live prouvée, base et secrets provisionnés, migration compatible, route transférée exclusivement sous le verrou partagé, rollback et probes publics testés |
| Privilèges PostgreSQL de production non provisionnés | Le migrateur possède le schéma et le runtime doit recevoir uniquement les droits DML/usage nécessaires, y compris les default privileges des migrations futures | nclsppr | Rôles, grants et rotation créés par Atlas puis test négatif DDL rejoué avec les identités de production |
| Mentions légales incomplètes | L'adresse postale et la forme juridique définitive ne sont pas publiées | nclsppr | Fournir les informations exactes sans les transmettre dans un canal public si elles doivent rester privées |

## Dérives et travaux ouverts

| Intention | Réalité observée | Risque | Action |
| --- | --- | --- | --- |
| Isolation Atlas en profondeur | RLS forcée et matrice A/B prouvées localement | Dérive des rôles ou ACL en production | Rejouer les preuves owner/migrator/runtime sur Atlas avant cutover |
| Client issu d'OpenAPI | Client TypeScript écrit à la main | Dérive de types | Générer et contrôler le diff avant clôture F02 |
| Défense anti-abus | Denylist versionnée, quotas et limites IP mono-instance | Spam distribué ou nouveau domaine jetable | Observer les abus réels puis distribuer ou ajuster les limites si nécessaire |
| Intégrité temporelle complète | Contraintes GiST, concurrence HTTP, annulation et retrait testés | Cas limites d'heure d'été | Compléter la matrice de fuseaux après ouverture |
| Recherche d'un intervalle arbitraire | Route dédiée alimentée par l'agenda réel à sept jours | Besoin non couvert au-delà de cette fenêtre | Ajouter un contrat de recherche borné avant d'afficher des filtres date/site |
| Identité de production | Auth0 retenu, adaptateur fail-closed intégré à la RLS ; local et OIDC exclusifs au build | Configuration distante incorrecte | Tenant réel, callback Caddy, anti-abus/CSRF et séquence identité → membership → `SET LOCAL` prouvés avant cutover |

## Risques et hypothèses

| Sujet | Type | Impact | Prochaine preuve | Responsable |
| --- | --- | --- | --- | --- |
| Domaine email équivalent à une entreprise | Hypothèse | Mauvais rattachement ou fuite de membres | Tests filiales, domaines partagés et invitations | nclsppr |
| Membre autorisé à déclarer une place | Risque produit | Offre illégitime | Recherche utilisateur et contestation | nclsppr |
| Direction visuelle issue des JPEG | Hypothèse partiellement validée | Densité inadéquate | Test utilisateur et audit accessibilité | nclsppr |
| Versions Quarkus/PostgreSQL/Mailpit | Hypothèse technique validée localement | Mise à jour ou faille future | Veille dépendances et CI régulière | nclsppr |
