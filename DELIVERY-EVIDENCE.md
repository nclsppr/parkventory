# Preuve de livraison : cadrage initial de Parkventory

Ce document consigne ce qui a été observé pour l'unité documentaire du
2026-07-30. Il ne crée aucune norme et n'étend aucune autorité.

## Référence

| Champ | Valeur |
| --- | --- |
| Unité de travail | Clone, adoption Foundation et documentation initiale |
| Demande ou autorité source | Brief utilisateur du 2026-07-30 et contrainte Quarkus ajoutée pendant l'exécution |
| Auteur | Codex |
| Vérificateur | Codex, contrôles locaux |
| Date | 2026-07-30 |
| Branche | `main` sans commit initial |
| Commit final | Non applicable, aucun commit demandé ou créé |
| Artefact final | Markdown canoniques, cinq JPEG de référence et build Nimbus local vérifié |
| Profils applicables | Pack `critical` avec `documentation-nimbus`, `web`, `backend-data`, `infrastructure-production`, `dependency-change`, `generated-artifacts` |

Le profil `infrastructure-production` est durablement activé, mais ses gates de
mutation et déploiement ne s'appliquent pas : aucune infrastructure n'a été
créée ou modifiée.

## Périmètre

### Cible demandée

Cloner le dépôt Parkventory vide, adopter Project Foundation, comprendre le
produit et les cinq références, choisir une architecture React + backend
Quarkus, puis créer une documentation exploitable avant le site.

### Résultat actuel observé

Le dépôt local contient le pack critique Foundation, les documents produit,
architecture, sécurité, design et décisions, ainsi que les références visuelles
originales. Aucun code applicatif ni service externe n'est créé.

### Exclusions

- frontend React et backend Quarkus ;
- CI, hébergement, DNS, fournisseur OIDC ou email ;
- SVG final du logo ;
- commit, push et publication.

### Limites de preuve

- Les droits de publication des JPEG ne sont pas établis.
- La stack cible est documentée mais pas installée ni exécutée.
- Aucune preuve locale ne vaut preuve de production.

## État initial

| Élément | Observation | Preuve |
| --- | --- | --- |
| Worktree et changements sans rapport | Dépôt distant cloné vide, aucun fichier hors `.git` | Clone Git et état initial inspecté |
| Version ou SHA initial | Aucun commit Parkventory ; `origin` configuré | `git status --short --branch`, `git remote -v` |
| Environnement | Bash 3.2.57, Python 3.9.6, Node 24.18.0, npm 11.16.0, Git 2.54.0 | Sorties locales du 2026-07-30 |
| Surface cible | Aucune application ou documentation publiée | Arborescence et absence d'URL |

## Sources et dérivés

| Concept ou artefact | Source canonique | Dérivé ou consommateur | Alignement vérifié par |
| --- | --- | --- | --- |
| Socle | Project Foundation `v0.3.1` et SHA épinglé | `docs/foundation/`, scripts, Nimbus | Comparaison byte à byte du noyau et des six profils |
| Documentation | Markdown classés par `documentation.json` | Catalogue et site Nimbus | Génération, tests, typecheck, build et lint réussis |
| Références visuelles | JPEG fournis le 2026-07-30 | Aucun asset de production | Dimensions et SHA-256 |
| Architecture | ADR-0002 à ADR-0004 | Futurs backend, migrations et client | Aucun consommateur applicatif |
| Design | `DESIGN.md` | Futurs tokens et composants React | Aucun consommateur applicatif |

## Gates appliquées

| Gate ou source | Applicable | Motif si non applicable | Contrôle réalisé | Environnement | Résultat | Preuve |
| --- | --- | --- | --- | --- | --- | --- |
| Noyau commun | Oui | | État, sources, ADR, changelog et limites relus | Local | Succès | Diff du worktree et présente preuve |
| Documentation Nimbus | Oui | | Catalogue, liens, tests, typecheck, build et lint | Local | Succès | `./scripts/verify.sh` |
| Profil web | Partiel | Aucune application créée | Design documenté et rendu Nimbus revu sur deux viewports | Local | Succès pour le périmètre documentaire | `DESIGN.md` et contrôle navigateur |
| Profil backend-data | Partiel | Architecture seulement | Règles, schéma cible, concurrence et isolation | Local | Documenté | ADR et documents architecture |
| Profil dependency-change | Partiel | Choix sans scaffold applicatif | Alternatives, version cible et retrait décrits | Documentation officielle | Documenté | ADR-0002 et ADR-0003 |
| Profil generated-artifacts | Oui | JPEG et catalogue | Provenance, dimensions, hashes et consommateurs | Local | Succès | Registre visuel et catalogue |
| Profil infrastructure-production | Non | Aucune mutation externe | Runbook laissé bloqué tant que la cible manque | Local | Non applicable | `RUNBOOK.md` |

## Contrôles automatisés

| Commande exacte | Répertoire | Environnement | Résultat | Portée | Preuve |
| --- | --- | --- | --- | --- | --- |
| `shasum -a 256 docs/assets/references/*.jpg` | Racine | macOS | Succès, cinq hashes | Intégrité des copies, pas les droits | `docs/references/visual-sources.md` |
| `python3 scripts/documentation_catalog.py --write` | Racine | Python 3.9.6 | Succès, 35 Markdown classés | Exhaustivité des collections déclarées | `DOCUMENTATION-CATALOG.md` |
| `./scripts/verify.sh` | Racine | Versions listées plus haut | Succès | 4 tests, 98 fichiers sans diagnostic, 44 contenus, 46 pages, 45 fichiers lintés | Sortie locale du 2026-07-30 |
| Comparaisons `cmp -s` avec Foundation | Racine | Snapshot local v0.3.1 | Succès, noyau et six profils identiques | Intégrité des fichiers Foundation consommés | Sortie locale du 2026-07-30 |

Le premier passage de `verify` a correctement refusé deux liens Markdown vers
les JPEG, que Nimbus aurait interprétés comme des pages à publier. Les chemins
ont été rendus informatifs sans exposer les fichiers dans le site, puis la gate
a été rejouée avec succès.

## Contrôles manuels ou perceptifs

| Surface | Scénario | Environnement | Observation | Résultat | Preuve |
| --- | --- | --- | --- | --- | --- |
| Cinq références | Analyse de landing, dashboard, texture et logo | Fichiers JPEG locaux | Direction sombre, acide et glacier synthétisée | Succès documentaire | `DESIGN.md` et registre |
| Nimbus desktop | Accueil, architecture, hiérarchie et lecture | Navigateur local, 1280×720 | Identité Parkventory, contraste sombre, vert acide et navigation à trois colonnes lisibles | Succès | Revue visuelle locale |
| Nimbus mobile | Architecture, absence de débordement et ouverture du menu | Navigateur local, 390×844 | `scrollWidth` inférieur au viewport, menu accessible et contenu lisible | Succès | Revue visuelle locale |
| Console navigateur | Accueil et page architecture | Navigateur local | Aucune erreur ni alerte | Succès | Journaux navigateur |

## Actions externes et checkpoints

| Action | Cible exacte | Autorité ou checkpoint | Exécutée | Résultat | Rollback disponible | Preuve |
| --- | --- | --- | --- | --- | --- | --- |
| Clone Git | `https://github.com/nclsppr/parkventory` vers le workspace | Demande explicite | Oui | Dépôt vide cloné | Dossier local supprimable sans affecter le remote | Remote Git |
| Push | Remote Parkventory | Non demandé | Non | Aucun changement distant | Non applicable | État sans commit |
| Déploiement | Aucune cible | Aucune autorité | Non | Aucune production | Non applicable | `STATUS.md` |

## Rollback, sauvegarde et restauration

| Contrôle | Cible isolée | Commande ou procédure | Résultat | Date | Preuve | Limite |
| --- | --- | --- | --- | --- | --- | --- |
| Sauvegarde | Non applicable | Aucune donnée ou production | Non applicable | 2026-07-30 | État du dépôt | Les JPEG originaux restent dans les pièces jointes de la session |
| Restauration | Non applicable | Aucune base | Non applicable | 2026-07-30 | `STATUS.md` | Ne prouve rien pour la future production |
| Rollback | Worktree sans commit | Retirer uniquement les fichiers créés ou recloner le dépôt vide | Non testé car non demandé | 2026-07-30 | Git non initialisé par un commit | Action destructive à autoriser explicitement |

## Artefact et surface finale

| Surface | Environnement | SHA, digest, version ou fichier | Contrôle final | Observé le | Preuve |
| --- | --- | --- | --- | --- | --- |
| Documentation source | Local | 35 Markdown et `documentation.json` | Catalogue et Markdown valides | 2026-07-30 | `./scripts/verify.sh` |
| Documentation Nimbus | Local | `docs-nimbus/dist/` dérivé | Build, lint et revue responsive réussis | 2026-07-30 | Gate et navigateur local |
| Application | Absente | Aucun artefact | Non applicable | 2026-07-30 | `STATUS.md` |

## Diff et livraison

- Fichiers du résultat : contrats Foundation, documentation Parkventory,
  scaffold Nimbus, scripts et cinq JPEG.
- Changements sans rapport préservés : aucun changement préexistant observé.
- Source, dérivés et consommateurs : sources et références présentes ; catalogue
  et build régénérés pendant la gate finale.
- Commit, push ou déploiement requis : non demandés.
- État final du worktree : nouveaux fichiers non suivis ; dérivés Nimbus et
  dépendances correctement ignorés.

## Conclusion

| Champ | Valeur |
| --- | --- |
| Statut observé | Livré pour l'unité documentaire F01 |
| Résultat prouvé | Clone, socle critique, cadrage, architecture Quarkus, références et Nimbus vérifiés |
| Risques restants | Droits visuels, fournisseur OIDC/email, règles de domaine et production |
| Validations non réalisées | Application, infrastructure, accessibilité complète et production, toutes hors F01 |
| Actions externes restantes | Aucune dans cette unité ; choix futurs par nclsppr |
| Mise à jour de `STATUS.md` ou `ROADMAP.md` | F01 marquée `done`, F02 reste `planned` |

## Extension : prototype local F02 du 2026-07-30

Cette extension consigne l'unité applicative réalisée après la preuve F01
ci-dessus. Les observations historiques de F01 restent volontairement intactes.

### Référence applicative

| Champ | Valeur |
| --- | --- |
| Unité de travail | Landing, dashboard et squelette React/Quarkus/PostgreSQL |
| Autorité source | Demande utilisateur de créer le site local et contrainte Quarkus non négociable |
| Branche et commit | `main`, aucun commit initial |
| Surface finale | Localhost uniquement, aucune publication |
| Statut roadmap | F02 `in_progress` ; implémentation locale vérifiée, CI distante non observée |

### Résultat et frontières

Le frontend sert une landing et un dashboard proches des références fournies,
avec les parcours locaux de partage, recherche, réservation, invitation et
inscription. Le client appelle réellement Quarkus. L'API démarre avec une base
PostgreSQL 18.3 et Flyway, mais ses mutations de démonstration restent en
mémoire et les réponses portent `demo: true`.

Restent exclus de cette unité : authentification, envoi d'email, rattachement
réel à une entreprise, persistance des actions utilisateur, RLS, concurrence
applicative F04, hébergement et production.

### Sources, dérivés et dépendances

| Concept | Source | Dérivé ou consommateur | Preuve |
| --- | --- | --- | --- |
| Interface | React/TypeScript et `frontend/src/styles.css` | Build Vite statique | Tests, build et navigateur |
| Contrat local | `api/openapi/parkventory.yaml` et ressources Quarkus | Client TypeScript écrit à la main | Appels observés ; génération encore à faire |
| Schéma | `V1__baseline.sql` | Base Compose et base Testcontainers | Flyway appliqué sur PostgreSQL 18.3 |
| Runtimes | `mise.toml` | `mise.lock` multi-plateforme | Node, Java et Python épinglés |
| Maven | `backend/.mvn/wrapper/maven-wrapper.properties` | Maven 3.9.16 | Distribution protégée par SHA-256 |
| PostgreSQL | Digest OCI dans `compose.yaml` | Volume local isolé | Santé Compose et connexion Quarkus |
| Illustration | `parking-halftone-source.png` | `parking-halftone.webp` | Hashes, poids et retrait documentés |
| CI | Workflow YAML | Job Ubuntu futur | Actions épinglées par SHA, aucun run distant |

Le premier démarrage Compose a détecté le changement de chemin de données de
PostgreSQL 18. Le conteneur et son volume nouvellement créés, encore vides, ont
été retirés ; le montage a été corrigé de `/var/lib/postgresql/data` vers
`/var/lib/postgresql`, puis la santé a été vérifiée. Aucune donnée utilisateur
n'a été supprimée.

### Contrôles automatisés

| Contrôle | Résultat observé | Limite |
| --- | --- | --- |
| `mise exec -- npm run verify` | Succès complet le 2026-07-30 | Exécution locale, pas GitHub Actions |
| Catalogue et Markdown | 35 sources classées, liens valides | Ne prouve pas la justesse produit |
| Nimbus | 4 tests, 98 fichiers sans diagnostic, 46 pages, 45 fichiers lintés | Site documentaire local |
| Audit npm | 0 vulnérabilité rapportée | Base npm à l'instant du contrôle |
| Vitest | 3 tests réussis | Pas une suite E2E multi-navigateur |
| Vite | Build réussi, JavaScript initial 69,70 Ko gzip | Pas de mesure LCP 4G réelle |
| Quarkus | 4 tests réussis, build JVM réussi | Mutations métier encore en mémoire |
| Flyway | V1 validée et appliquée sur PostgreSQL 18.3 | Pas de restauration de production |
| `npm run dev` | PostgreSQL healthy, Quarkus prêt, frontend HTTP 200 | Commande locale avec Docker requis |
| SmallRye Health | `UP`, connexion base `UP` | Probe observée localement |

### Contrôles perceptifs et fonctionnels

| Surface ou scénario | Environnement | Résultat |
| --- | --- | --- |
| Landing desktop | 1440 × 900 | Composition 43/57, hero, aperçu produit et palette conformes à la direction |
| Dashboard desktop | 1440 × 900 | Rail, actions dominantes, statistiques et disponibilités proches des références |
| Landing et menu mobile | 390 × 844 | Reflow lisible, menu fonctionnel, aucune largeur excédentaire |
| Dashboard et rail mobile | 390 × 844 | Formulaires empilés et navigation latérale fonctionnels |
| Reflow minimal | 320 × 568 | `scrollWidth` égal au viewport sur landing et application |
| Partage | Navigateur vers Quarkus | Confirmation observée et compte mis à jour |
| Réservation | Navigateur vers Quarkus | Place passée de Disponible à Réservée |
| Invitation | Navigateur vers Quarkus | Adresse professionnelle acceptée, aucun email réel envoyé |
| Inscription locale | Navigateur React | Domaine personnel refusé, domaine professionnel reconnu en démo |
| Console | Toutes les surfaces inspectées | Aucune erreur ni alerte observée |

### État de livraison

| Champ | Valeur |
| --- | --- |
| Résultat prouvé | Site local fonctionnel sur React, Quarkus et PostgreSQL |
| Résultat non prouvé | CI distante, production, authentification et persistance métier |
| Action Git distante | Aucune ; ni commit, ni push, ni PR demandés |
| Processus laissés actifs | Aucun ; frontend, Quarkus et conteneur ont été arrêtés après contrôle |
| Données locales | Volume PostgreSQL conservé après arrêt de la commande canonique |
| Prochaine décision | Commit/push pour exécuter la CI, puis génération du client avant clôture F02 |

## Extension : Foundation v0.4.0 et publication initiale du 2026-07-30

Cette unité remplace sans édition locale le noyau Foundation `v0.3.1` par la
release `v0.4.0` au SHA
`7a5204a60eaf01cbaf38c86f56175751e36a0dad`. Elle fusionne l'adaptateur local
et la politique Parkventory avec l'invariant `P18`.

| Champ | Valeur observée avant commit |
| --- | --- |
| Branche canonique | `main` |
| Protection GitHub | Aucune protection ni ruleset observé le 2026-07-30 |
| Stratégie retenue | Push direct sur `main`, branche dédiée si la politique change |
| Snapshot | Trois fichiers du noyau et six profils identiques à `v0.4.0` |
| Validation requise | `mise exec -- npm run verify` avant commit |
| Publication requise | Commit initial puis push immédiat ; SHA distant à consigner dans l'unité de suivi |

Les cinq JPEG fournis restent dans le workspace local et sont exclus de Git :
leurs droits de publication ne sont pas établis. Les quatre créations originales
et le dérivé WebP Parkventory font partie de l'unité publiable.

Les preuves de push, de CI et de clone propre ne sont pas anticipées dans ce
commit. Elles seront ajoutées après observation depuis le remote afin de ne pas
présenter une action future comme déjà réussie.

## Extension : push initial, CI et démo GitHub Pages du 2026-07-30

Cette extension ferme les preuves distantes laissées ouvertes par l'unité
précédente. Elle ne transforme pas la démo statique en environnement de
production et ne clôt pas F02.

### Git et clone public

| Contrôle | Résultat observé | Preuve |
| --- | --- | --- |
| Publication initiale | Commit `5ee0f90d3d1e49edc2937f3ba81be1e24a82fedf` poussé directement sur `main` | `origin/main` identique après push |
| Protection de branche | Aucun ruleset ni protection observé avant le push | API GitHub interrogée le 2026-07-30 |
| CI initiale | Run `30516904650` réussi | Gate canonique complète sur Ubuntu 24.04 |
| Clone propre | Clone public isolé au SHA `5ee0f90`, runtimes et dépendances réinstallés | `mise exec -- npm run verify` réussi ; répertoire temporaire retiré après contrôle |

### Publication Pages

| Champ | Valeur observée |
| --- | --- |
| Autorité | Demande explicite d'activer GitHub Pages |
| Configuration | Site Pages créé avec `build_type: workflow`, HTTPS forcé |
| Commit applicatif | `372810f9f9044df56e436f9e080e77c33ca55339` |
| Workflow Pages | Run `30517358844`, jobs `build` et `deploy` réussis |
| Workflow de vérification | Run `30517358828` réussi sur le même SHA |
| Landing | `https://nclsppr.github.io/parkventory/`, HTTP 200 |
| Application | `https://nclsppr.github.io/parkventory/app/`, HTTP 200 après redirection canonique |

Le build public fixe `VITE_BASE_PATH=/parkventory/` et
`VITE_DEMO_MODE=true`, copie le shell React pour `/app/` et le fallback 404,
puis publie uniquement `frontend/dist`. Les cinq JPEG de référence restent
ignorés et absents de l'artefact ; seules les créations originales Parkventory
sont servies.

### Contrôles publics

| Contrôle | Observation | Limite |
| --- | --- | --- |
| HTML et assets | Landing, application, JavaScript, CSS et image utilisent le préfixe `/parkventory/` | Probe HTTP, pas mesure de performance réseau |
| Navigation | Le lien « Se connecter » ouvre le dashboard public | Route statique, pas de session réelle |
| Signalement | Landing et dashboard affichent explicitement « Démo publique » | L'utilisateur doit conserver ce contexte |
| Console | Aucune erreur ni alerte sur le dashboard public inspecté | Une session navigateur et un viewport desktop |
| Mutations | Le client court-circuite les appels API et répond localement | Aucun partage, réservation ou email réellement créé |

### État après preuve

F02 reste `in_progress` : le client TypeScript OpenAPI est encore écrit à la
main et `npm run dev` n'a pas été rejoué depuis le clone public propre. Les
preuves Git, CI et Pages sont acquises ; elles ne prouvent ni authentification,
ni persistance métier, ni isolation inter-tenant, ni production.

## Extension : Foundation v0.5.2 et Compose intégral du 2026-07-30

Cette unité adopte Project Foundation `v0.5.2` au commit immuable
`708d7374f87060809a805c57abc2cf7e7b66c182`. Elle applique le nouvel invariant
`P19` : Docker Compose est le chemin local intégré obligatoire et ne peut pas
être remplacé par des processus React ou Quarkus lancés uniquement sur l'hôte.

### Socle et enforcement

| Contrôle | Résultat observé | Limite |
| --- | --- | --- |
| Publication Foundation | Tag annoté `v0.5.2`, run `main` `30525884714` et run tag `30525894423` réussis | Le tag n'est pas signé |
| Snapshot Parkventory | Noyau Foundation et six profils identiques au SHA adopté | Les adaptateurs restent propres au projet |
| Gate Compose | `scripts/check_compose.py` valide Docker Compose >= 2.20, les services, les digests, les healthchecks et le pack | Un mainteneur autorisé peut encore modifier simultanément code et workflow |
| Intégration CI | Le workflow appelle directement le checker puis la gate canonique, qui le rejoue et exécute le smoke Compose | La protection de branche n'est pas activée |

### Graphe local vérifié

| Service | Image ou runtime | Santé et dépendances |
| --- | --- | --- |
| `postgres` | PostgreSQL 18.3 Alpine épinglé par digest | `pg_isready`, volume de développement, premier service prêt |
| `backend` | Maven 3.9.16 et Temurin 25 épinglés par digest | Attend PostgreSQL, applique Flyway V1, expose la readiness Quarkus |
| `frontend` | Node 24.18 épinglé par digest | Attend Quarkus, lance Vite et proxyfie `/api` et `/q` vers le backend |

Le montage du dépôt frontend reste en lecture seule. Deux volumes Compose
séparés masquent les répertoires `node_modules` racine et workspace afin que
`npm ci` et le cache Vite n'écrivent jamais dans les sources hôte.

### Validations locales

| Commande ou contrôle | Résultat |
| --- | --- |
| `python3 scripts/check_compose.py` | Pack `critical`, Docker Compose 5.1.2 et trois services valides |
| `docker compose config --quiet` | Configuration normalisée sans erreur |
| `npm run compose:verify` | PostgreSQL, Quarkus et Vite healthy ; landing, readiness et contrat dashboard accessibles via Vite |
| `mise exec -- npm run verify` | Gate complète verte : 45 fichiers Nimbus lintés, 4 tests React, build Vite, 4 tests Quarkus/Flyway et smoke Compose |
| Nettoyage du smoke | Aucun conteneur ni volume du projet `parkventory-verify` laissé actif |

Mailpit n'est ni utilisé ni simulé dans cette unité : aucun envoi d'email réel
n'existe encore. Il reste la cible locale de F03 pour les liens magiques et
notifications, et devra alors rejoindre le même graphe Compose avec healthcheck
et image épinglée par digest.

### Preuves distantes Parkventory

| Contrôle | Résultat observé |
| --- | --- |
| Commit et push | `b3d908b5f54d19ef6229393568cdb984216e83c8` poussé directement sur `main`, branche non protégée et sans ruleset observé |
| CI | Run `30526141976` réussi ; contrôle Compose direct puis gate complète, incluant le smoke des trois services |
| Pages | Run `30526141993` réussi, jobs build et deploy verts |
| Probes | `https://nclsppr.github.io/parkventory/` et `/app/` répondent HTTP 200 |

Les workflows signalent la dépréciation de Node.js 20 dans certaines actions
tierces, que GitHub force actuellement sous Node.js 24. Cet avertissement ne
rend pas les runs rouges, mais devra être résolu par une mise à jour épinglée
des actions concernées.

## Extension : identité, persistance et emails locaux du 2026-07-30

Cette extension remplace les limites historiques « mutations en mémoire » et
« aucun email » des prototypes précédents. Elle prouve un environnement local
fonctionnel ; elle ne constitue pas une preuve de production.

### Unités Git

| Unité | Commit poussé sur `main` | Contenu |
| --- | --- | --- |
| Backend et données | `e069d04a70c62c814345947dfb6e26fb0d890070` | Mailpit, Flyway V2, identité locale, sessions, API persistante, outbox et smoke |
| Frontend réel | `9f7b9bef3e85815c40a48af914e0130dc6a6665c` | Connexion, callback, dashboard PostgreSQL, mutations réelles et états explicites |

Les workflows Verify `30531390825` et `30532444607`, ainsi que Pages
`30531390795` et `30532444836`, ont réussi sur ces deux unités.

### Graphe Compose vérifié

| Service | Responsabilité | État observé |
| --- | --- | --- |
| `postgres` | Identités, sessions, organisations, places, offres, réservations, outbox et audit | Healthy, migrations V1 et V2 |
| `mailpit` | SMTP local et lecture des liens, invitations et notifications | Healthy, stockage local persistant |
| `backend` | Java 25 / Quarkus 3.33.3 LTS, API et worker d'outbox | Readiness `UP` |
| `frontend` | React/Vite et proxy même origine vers `/api` et `/q` | Healthy sur `127.0.0.1:5173` |

Les quatre images externes sont épinglées par digest et les quatre services
portent un healthcheck. Le smoke utilise des ports aléatoires et des volumes
isolés, puis retire uniquement son propre projet Compose.

### Parcours automatisé

`npm run compose:verify` :

1. demande un lien pour un propriétaire synthétique en `.test` ;
2. lit le message avec l'API Mailpit et consomme le jeton ;
3. vérifie le cookie de session ;
4. déclare et partage `A-24` ;
5. connecte un collègue du même domaine ;
6. réserve avec une clé d'idempotence ;
7. relit le statut `RESERVED` depuis PostgreSQL ;
8. observe la notification du propriétaire ;
9. invite une adresse synthétique externe et observe l'invitation.

### Parcours navigateur

Le 2026-07-30, le navigateur a reproduit le flux sur la stack persistante :

- demande et réception d'un lien dans Mailpit ;
- création de l'espace communautaire seulement après validation ;
- déclaration de `UI-30` au niveau de test ;
- publication du créneau du lendemain ;
- authentification d'un collègue du même domaine ;
- visibilité puis réservation de `UI-30` ;
- compteurs et statut relus après chaque mutation ;
- invitation et notification de réservation reçues dans Mailpit ;
- aucune erreur ou alerte console observée.

La revue a révélé que les effets doublés de React `StrictMode` vérifiaient deux
fois le même jeton à usage unique. Le frontend déduplique désormais la promesse
de vérification ; un test rend ce comportement non régressif. Un lien frais a
ensuite conduit une seule fois jusqu'à `/app`.

### Gate canonique après documentation

| Contrôle | Résultat observé |
| --- | --- |
| Catalogue et Markdown | 36 sources maintenues classées, liens valides |
| Nimbus | 4 tests, 98 fichiers sans diagnostic, 45 pages générées, 46 fichiers lintés |
| Audit npm | 0 vulnérabilité rapportée |
| React | 6 tests réussis et build Vite réussi |
| Quarkus | 3 tests réussis, build JVM réussi, Flyway V1 et V2 sur PostgreSQL 18.3 |
| Compose | Quatre services sains et parcours identité, partage, réservation, notification et invitation réussi |
| Commande globale | `mise exec -- npm run verify` réussie le 2026-07-30 |

### Limites exactes

- GitHub Pages reste une démo statique sans backend.
- Mailpit est limité au développement et ne prouve aucune délivrabilité.
- L'adaptateur local ne remplace pas OIDC, PKCE, cookie `Secure` ou protection
  CSRF complète.
- RLS, matrice inter-tenant, rate limiting, concurrence réellement parallèle,
  annulation et heure d'été restent ouverts.
- Aucun service de production, domaine, sauvegarde ou restauration n'est
  provisionné.

### État laissé au propriétaire

La stack de développement est laissée active avec ses volumes :

- `http://127.0.0.1:5173/` ;
- `http://127.0.0.1:5173/app` ;
- `http://127.0.0.1:8025/` ;
- `http://127.0.0.1:8080/q/swagger-ui`.

`npm run compose:down` arrête les conteneurs sans supprimer les données.
