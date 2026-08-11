# STATUS.md

Snapshot de l'état réellement vérifié. Il ne remplace ni le contrat stable de
`PROJECT.md`, ni l'ordre de livraison de `ROADMAP.md`.

## Référence

| Champ | Valeur |
| --- | --- |
| Vérifié le | 2026-08-11 |
| Par | Codex |
| Branche | `main` |
| Commits applicatifs | `e069d04` — backend persistant et Mailpit ; `9f7b9be` — frontend local réel ; `c748d32` — logo SVG canonique ; `47ee871` — routes Partager et Trouver ; `25d3197` — narration et interactions de la landing ; `835515a` — stabilisation du parcours CI ; `75c6a37` — thèmes sombre et clair sélectionnables ; `e53ae9a` — stabilisation de la gate et audit npm |
| Environnement | Local macOS, OrbStack 29.4.0 ; contrôles du thème sous Codex Linux, Node 24.14.0 et npm 11.9.0 ; CI GitHub Actions Ubuntu |
| Version livrée | F02, F03 et F04 partielles ; thèmes sombre et clair sélectionnables ; routes dédiées de partage et recherche ; démo publique GitHub Pages séparée |

## Résumé

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

Project Foundation `v0.5.2` au commit
`708d7374f87060809a805c57abc2cf7e7b66c182` est adopté en pack `critical`.
`P18` impose commit et push des tranches validées ; `P19` impose Compose comme
graphe local intégré.

## Phases actives

| Phase roadmap | État observé | Preuve restante avant clôture | Responsable |
| --- | --- | --- | --- |
| F02 — Surface et squelette | `in_progress` | Générer le client OpenAPI et rejouer le démarrage depuis un clone propre | nclsppr |
| F03 — Identité et communauté | `in_progress` | Matrice tenant A/B, RLS, anti-abus et adaptateur OIDC de production | nclsppr |
| F04 — Partager et réserver | `in_progress` | Test réellement concurrent, annulation, fuseaux et heure d'été | nclsppr |

## Livré et vérifié

| Capacité | Périmètre réel | Preuve | Limite connue |
| --- | --- | --- | --- |
| Identité locale | Lien 256 bits, hash en base, durée 15 min, consommation unique, session `HttpOnly` 7 jours | Tests Quarkus, smoke Compose, parcours navigateur | Adaptateur HTTP local, pas OIDC de production |
| Communauté | Invitation exacte prioritaire, sinon organisation communautaire unique par domaine | PostgreSQL réel et tests d'intégration | Domaine partagé/filiales et liste anti-abus à durcir |
| Application React | Connexion, dashboard de synthèse, routes dédiées de partage et recherche, réservation, invitation, chargements, erreurs, états vides et choix clair/sombre persistant | 34 tests Vitest, build, navigation History API et navigateur sans erreur console | Client OpenAPI encore manuel ; recherche limitée à l'agenda de sept jours |
| Identité visuelle | Master SVG fourni utilisé dans les huit emplacements React, les favicons, le header Nimbus et les cartes Open Graph ; palettes sombre et claire sémantiques ; plaque de contraste claire sans recoloration du master | Gate anti-dérive, tests de ratios et revue des deux thèmes desktop/mobile | Symbole seul ; aucun wordmark vectoriel ni variante monochrome |
| API Quarkus | Session, dashboard, place, partage, réservation idempotente et invitation | Tests sur PostgreSQL 18.3 et contrat OpenAPI `0.2.0` | Annulation et administration absentes |
| PostgreSQL | Schéma multi-tenant, sessions, outbox, audit, idempotence et exclusions GiST | Flyway V1 + V2 et relecture après mutations | RLS et rôle applicatif non propriétaire non livrés |
| Notifications | Invitation et réservation écrites avec l'outbox puis livrées avec reprise bornée | Messages observés dans Mailpit | Délivrabilité externe non prouvée |
| Environnement | Quatre services Compose, images par digest, healthchecks et volumes | Checker indépendant, smoke complet et stack locale saine | Docker ou OrbStack requis |
| Démo Pages | Landing animée, dashboard, partage et recherche statiques sous `/parkventory/` | Run Pages `30548089705` et cinq routes publiques HTTP 200 sur `835515a` | Aucun compte, email ou stockage distant |
| CI | Gate Foundation, docs, audit, React, Quarkus et smoke Compose | Run Verify `30548090051` réussi sur `835515a` | Aucune gate de production |

## État opérationnel

| Surface | URL ou accès | Santé au 2026-07-30 |
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
| Production | Aucune URL | Non provisionnée |

La stack locale de développement est laissée active à la fin de cette
livraison. `npm run compose:down` l'arrête en conservant les volumes.

## Validations récentes

| Date | Commande ou contrôle | Résultat | Portée de la preuve |
| --- | --- | --- | --- |
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
| Fournisseurs OIDC et email non choisis | Interdit de présenter l'identité locale comme prête pour la production | nclsppr | ADR, contrat, région, coût et retrait validés |
| Infrastructure non choisie | Bloque toute URL de production | nclsppr | Architecture d'exploitation et autorité de provisionnement |
| Droits des cinq JPEG non documentés | Interdit leur publication comme assets servis | nclsppr | Confirmer origine et droits ; le site sert une création originale |

## Dérives et travaux ouverts

| Intention | Réalité observée | Risque | Action |
| --- | --- | --- | --- |
| Isolation en profondeur | Filtres tenant et clés composites, sans RLS | Contournement en cas de défaut repository | Rôle non propriétaire, `SET LOCAL`, RLS forcée et matrice A/B |
| Client issu d'OpenAPI | Client TypeScript écrit à la main | Dérive de types | Générer et contrôler le diff avant clôture F02 |
| Défense anti-abus | Refus minimal de domaines personnels | Spam et tenant indésirable | Rate limit, liste versionnée et réponses/timings comparés |
| Intégrité temporelle complète | Contraintes GiST et conflits testés séquentiellement | Course, annulation ou DST mal traitée | Tests parallèles, annulation et matrice de fuseaux |
| Recherche d'un intervalle arbitraire | Route dédiée alimentée par l'agenda réel à sept jours | Besoin non couvert au-delà de cette fenêtre | Ajouter un contrat de recherche borné avant d'afficher des filtres date/site |
| Identité de production | Adaptateur local Mailpit | Mauvais usage hors boucle locale | OIDC, cookie `Secure`, PKCE, CSRF et révocation de migration |

## Risques et hypothèses

| Sujet | Type | Impact | Prochaine preuve | Responsable |
| --- | --- | --- | --- | --- |
| Domaine email équivalent à une entreprise | Hypothèse | Mauvais rattachement ou fuite de membres | Tests filiales, domaines partagés et invitations | nclsppr |
| Membre autorisé à déclarer une place | Risque produit | Offre illégitime | Recherche utilisateur et contestation | nclsppr |
| Direction visuelle issue des JPEG | Hypothèse partiellement validée | Densité inadéquate | Test utilisateur et audit accessibilité | nclsppr |
| Versions Quarkus/PostgreSQL/Mailpit | Hypothèse technique validée localement | Mise à jour ou faille future | Veille dépendances et CI régulière | nclsppr |
