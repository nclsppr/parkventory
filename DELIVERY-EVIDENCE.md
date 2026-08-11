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

## Extension : master SVG du logo du 2026-07-30

Cette unité remplace les reconstructions provisoires du symbole par le SVG
transparent fourni explicitement pour Parkventory. Elle ne modifie ni la
géométrie, ni les couleurs du master.

### Source et dérivés

| Artefact | Preuve |
| --- | --- |
| Master | `assets/brand/parkventory-logo-transparent.svg`, 554 × 560, SHA-256 `f145d51082b3e934a23a80096494809ab1a3b6c96f6ba64ebca1ef0597089316` |
| Copies SVG | Frontend nommé, favicon frontend et favicon Nimbus byte-identiques au master |
| Dérivé raster | PNG 256 × 259, SHA-256 `7a003de1e8274bf80ce045045e2e303372007c4fde3dd64296091e078720fbfb`, réservé aux cartes Open Graph |
| Reproductibilité | `npm run brand:sync` avec Sharp `0.35.3` ; `npm run brand:check` dans la gate globale |

Le composant React partagé couvre les headers, footers, écrans
d'authentification, états du dashboard, sidebar, barre mobile et aperçu produit.
Nimbus utilise le même SVG dans son header et comme favicon. Le PNG n'est créé
que parce que le moteur CanvasKit d'`astro-og-canvas` ne décode pas directement
le SVG fourni.

### Validations locales

| Contrôle | Résultat observé |
| --- | --- |
| XML et hashes | Quatre SVG valides ; master et copies au même SHA-256 |
| `npm run brand:check` | Tous les dérivés correspondent au master |
| `npm run frontend:test` | 7 tests réussis, dont variantes complète et compacte du logo |
| Build Pages | Base `/parkventory/`, favicon et URL du logo correctement préfixés ; build réussi |
| Nimbus | 4 tests, 98 fichiers sans diagnostic, 47 pages générées et 46 fichiers lintés |
| Carte Open Graph | Logo visible dans le PNG 1 200 × 630 généré |
| Navigateur | Landing, connexion, dashboard et documentation revus à 1 440 × 1 000 et 390 × 844 sans débordement horizontal |
| `mise exec -- npm run verify` | Gate complète réussie : documentation, audit npm, 7 tests React, 3 tests Quarkus/PostgreSQL et parcours Compose avec Mailpit |

### Preuves distantes

| Contrôle | Résultat observé |
| --- | --- |
| Commit et push | `c748d3212e5285e410b1d56975958b1398efed8e` poussé sur `main` |
| GitHub Actions Verify | Run `30536319811` réussi, incluant la gate complète et le smoke Compose |
| GitHub Pages | Run `30536319671` réussi, jobs build et déploiement verts |
| Probes publiques | Landing et `/app/` répondent HTTP 200 ; le favicon cible `/parkventory/parkventory-logo-transparent.svg` |
| Intégrité publique | Le SVG servi porte le SHA-256 canonique `f145d51082b3e934a23a80096494809ab1a3b6c96f6ba64ebca1ef0597089316` |
| Revue publique | Landing et dashboard contrôlés à 390 × 844, logo visible et aucun débordement horizontal |

### Limites exactes

- le SVG fourni contient le symbole seul : le mot `Parkventory` reste du texte
  accessible dans les lockups ;
- aucune variante monochrome ou wordmark vectoriel n'a été fourni ;
- la provenance juridique externe n'a pas été auditée indépendamment ; cette
  unité s'appuie sur l'instruction explicite du propriétaire du projet ;
- les cinq JPEG historiques conservent leur statut de références non
  publiables sans confirmation distincte.

## Extension : routes produit dédiées du 2026-07-30

Cette tranche remplace les formulaires concurrents du Dashboard par deux
parcours focalisés, sans dupliquer la session, les données ou la navigation.

### Contrat de navigation

| URL | Tâche | Comportement vérifié |
| --- | --- | --- |
| `/app` | Comprendre l'état puis choisir une action | Dashboard de synthèse, liens réels, disponibilité prioritaire et invitation |
| `/app/partager` | Publier l'absence du titulaire | Déclaration initiale si nécessaire, intervalle, fuseau, validation et résumé |
| `/app/trouver` | Réserver une disponibilité d'un collègue | Agenda PostgreSQL à sept jours, sélection distincte puis confirmation idempotente |

Le shell React commun conserve le contexte chargé pendant la navigation et
utilise l'API History avec des liens natifs : ouverture dans un nouvel onglet,
boutons précédent/suivant et accès direct restent fonctionnels. Les anciens
liens `?intent=share|find` sont remplacés par les routes canoniques. Une URL
inconnue rend une vraie page 404. La navigation mobile ne fabrique pas de lien
Réservations : cette destination sera ajoutée avec sa propre route.

### Preuves locales

| Contrôle | Résultat observé |
| --- | --- |
| `npm run frontend:test` | 15 tests réussis : routes exactes, session, liens, navigation, anciens intents, partage et réservation |
| `npm run pages:build` | Cinq entrées HTML cohérentes : app, partage, recherche, callback et 404 ; base `/parkventory/` contrôlée |
| `mise exec -- npm run verify` | Documentation, audit npm, React, Vite, Java 25 / Quarkus, Flyway/PostgreSQL et Compose verts |
| Smoke Compose | Les routes `/app`, `/app/partager`, `/app/trouver` et `/auth/callback` sont servies directement avant le parcours métier |
| Navigateur local | Le propriétaire synthétique publie `RR-30` depuis Partager ; un collègue du même tenant le choisit puis le réserve depuis Trouver |
| Console et géométrie desktop | Aucune erreur ; aucun débordement horizontal à 1 280 × 720 ; formulaires et résumés alignés |
| Géométrie mobile | Dashboard, Partager et Trouver contrôlés à 390 × 844 ; largeur de document égale au viewport à 320 px, cibles à 44 px minimum et navigation sans libellé tronqué |
| Clavier mobile | À l'ouverture du tiroir, le focus entre dans la navigation, Tab reste borné, Échap ferme puis rend le focus au déclencheur |

### Limites exactes

- GitHub Pages sert toujours des données de démonstration statiques et ne
  remplace pas l'application locale connectée à Quarkus.
- La route Trouver reflète le contrat actuel du Dashboard, soit les sept
  prochains jours. Un intervalle arbitraire et un filtre de site exigent une
  évolution API avant d'apparaître dans l'interface.
- L'annulation, la récurrence et le plan interactif restent hors de cette
  tranche.

### Preuves distantes

| Contrôle | Résultat observé |
| --- | --- |
| Commit et push | `47ee871653e29af9d092b1f3f7eff31dff0671da` poussé directement sur `main` |
| GitHub Actions Verify | Run `30542280025` réussi en 2 min 26 s, gate complète et smoke Compose inclus |
| GitHub Pages | Run `30542280043` réussi, build et déploiement verts |
| Probes publiques | Landing, `/app/`, `/app/partager/`, `/app/trouver/` et `/auth/callback/` répondent HTTP 200 |
| Route inconnue | `/route-inconnue/` répond HTTP 404 et charge le shell 404 dédié |

## Extension : narration et interactions de la landing du 2026-07-30

Cette tranche améliore uniquement la landing et son accès clavier. Elle ne
modifie ni l'API, ni les données, ni les routes produit.

### Besoin et choix

Les transitions précédentes reposaient uniquement sur des états de survol
isolés : le passage entre le hero, les bénéfices et le fonctionnement manquait
de continuité. `IntersectionObserver` et CSS restent utilisés pour les
révélations simples. GSAP avec ScrollTrigger est ajouté pour le scrubbing de la
progression, la profondeur du hero et la séquence des étapes, opérations dont
une implémentation locale complète aurait dupliqué gestion responsive,
rafraîchissement et nettoyage.

Le consommateur unique est `frontend/src/hooks/useLandingMotion.ts`, sous la
responsabilité de nclsppr. L'ajout ne justifie pas d'ADR : il ne structure pas
plusieurs modules, ne modifie aucun contrat ni donnée et possède un retrait
local borné.

### Gate de dépendance

| Dimension | Observation datée |
| --- | --- |
| Classe | Dépendance runtime navigateur, facultative pour comprendre et utiliser la landing |
| Identité et origine | Package officiel `gsap` GreenSock, [release `3.13.0`](https://github.com/greensock/GSAP/releases/tag/3.13.0) et [installation officielle](https://gsap.com/docs/v3/Installation/) recoupées le 2026-07-30 |
| Version et intégrité | `3.13.0` exacte ; tarball npm verrouillé par `sha512-QL7MJ2WMjm1PHWsoFrAQH/J8wUeqZvMtHO58qdekHpCfhvhSL4gSiz6vJf5EeMP0LOn3ZCprL2ki/gjED8ghVw==` |
| Licence | Le manifeste du package déclare la licence Standard « no charge » ; la release officielle 3.13 annonce la gratuité, y compris commerciale. Compatible avec l'usage actuel, à réexaminer si le produit ou la licence change |
| Transitifs et scripts | Aucun package transitif, aucun script d'installation déclaré par GSAP, aucune permission ou binaire supplémentaire |
| Données et réseau | Aucune donnée lue, stockée ou transmise ; aucun secret, cookie, endpoint, quota ou sous-traitant ajouté |
| Vulnérabilités | `npm audit --json` retourne zéro résultat sur 172 dépendances le 2026-07-30 ; ce résultat ne prédit pas les vulnérabilités futures |
| Coût mesuré | Bundle initial 75,69 Ko gzip ; chunks différés GSAP 27,28 Ko et ScrollTrigger 17,41 Ko gzip, chargés uniquement sur la landing avec mouvement normal |
| Mode dégradé | Les contenus sont rendus avant animation. Sans GSAP, `IntersectionObserver` conserve les révélations ; sans observateur ou avec mouvement réduit, tout reste visible immédiatement |
| Mise à jour | Réexaminer version, licence, audit et poids à chaque changement de GSAP et avant F05 |
| Retrait | Supprimer le bloc GSAP de `useLandingMotion`, conserver les révélations CSS/observateur, exécuter `npm uninstall gsap --workspace @parkventory/frontend`, reconstruire et rejouer la matrice visuelle |

### Résultat d'interface observé

- progression de lecture dans le header sticky ;
- transition typographique continue entre partage, disponibilité et réservation ;
- révélations uniques des sections et profondeur légère de l'aperçu produit ;
- repère éditorial épinglé et trois étapes synchronisées sur grand écran ;
- micro-interactions de cartes, liens, boutons et formulaire limitées aux
  pointeurs compatibles ;
- compteur illustratif non prouvé retiré et aperçu clairement nommé « démo » ;
- `viewport-fit=cover`, header et lien « Aller au contenu » positionnés avec
  les safe areas hautes et latérales de Safari.

### Contrôles locaux

| Contrôle | Résultat observé | Limite |
| --- | --- | --- |
| `npm run frontend:test` | 15 tests réussis, dont lien d'évitement et statut démo | Ne calcule pas la géométrie CSS |
| `npm run frontend:build` | TypeScript et Vite réussis ; chunks différés mesurés | Mesure locale, pas réseau 4G |
| Compose | Service frontend recréé, `npm ci` dans son volume puis santé rétablie | Stack de développement, pas production |
| Desktop 1 440 × 900 | Hero, bento, bandeau, ancre compensée, progression et séquence des étapes sans débordement | Chromium local |
| Mobile 390 × 844 | Hero, menu, ancre, fermeture du menu, séparateurs verticaux et largeur égale au viewport | Safe area réelle non simulée |
| Mobile 320 × 568 | Titre contenu, CTA de 48 px, menu de 44 px et largeur égale au viewport | Hauteur volontairement scrollable |
| Safe area Safari | Meta viewport, calculs `env(safe-area-inset-*)`, cible 44 px et ordre DOM contrôlés | Un iPhone Safari réel reste requis avant F05 |
| `mise exec -- npm run verify` | 36 Markdown, Nimbus, audit npm, 15 tests React, build Pages, 3 tests Quarkus/PostgreSQL et smoke Compose complet réussis | Exécution locale, pas encore le run CI du commit final |

Le commit, le push, les runs GitHub Actions et les probes Pages ci-dessous ont
été consignés seulement après leur observation.

### Preuves distantes et publication

| Contrôle | Résultat observé |
| --- | --- |
| Tranche d'interface | Commit `25d3197a05d97f6baf9b8c7115ab9f2f3a5f7ece` poussé directement sur `main` |
| Signal CI traité | Le premier run Pages `30547692642` a expiré sur l'attente de mutation puis rechargement d'une place ; l'attente ciblée a été bornée à trois secondes dans `835515af5534d0366940a876ba756f923bcaa7ed`, sans relâcher les autres tests |
| GitHub Actions Verify final | Run `30548090051` réussi sur `835515a`, avec documentation, audit, React, Quarkus/PostgreSQL et smoke Compose |
| GitHub Pages final | Run `30548089705` réussi sur `835515a`, jobs build et déploiement verts |
| Routes publiques | Landing, `/app/`, `/app/partager/`, `/app/trouver/` et `/auth/callback/` répondent HTTP 200 ; `/app/inconnue/` répond HTTP 404 avec le shell courant |
| Assets publics | JavaScript et CSS finaux, SVG canonique, GSAP et ScrollTrigger différés répondent HTTP 200 ; le bundle principal référence explicitement les deux chunks motion |
| Frontière de preuve | La géométrie safe-area est publiée et contrôlée par le code, le build et Chromium ; le focus sous Dynamic Island doit encore être observé sur un iPhone Safari réel avant F05 |

## Extension : thème clair sélectionnable du 2026-08-11

Cette tranche conserve le thème sombre comme signature et premier choix, puis
ajoute une variante claire ivoire explicitement sélectionnable. Elle couvre la
landing, l'authentification, l'application, les routes de partage et recherche
ainsi que la page 404. La préférence binaire est appliquée avant le premier
rendu, stockée dans le navigateur et ne dépend ni du backend ni du thème du
système.

### Contrôles de l'interface

| Contrôle | Résultat observé | Limite |
| --- | --- | --- |
| React | 19 tests réussis : défaut sombre, sélection claire, persistance, valeur invalide et parcours existants | JSDOM ne calcule pas les contrastes ni la géométrie |
| Vite et Pages | TypeScript et cinq entrées statiques construits ; JavaScript initial inférieur à 77 Ko gzip | Mesure locale, pas réseau réel |
| Revue responsive | Deux thèmes revus à 1 440 × 900 et 390 × 844 ; absence de débordement contrôlée à 320 px et 768 px | Chromium local, pas Safari iPhone réel |
| Palette claire | Texte principal 18,25:1, encres d'accent au moins 7,13:1, bordure de contrôle 3,42:1 et texte sur aplats au moins 14,49:1 | Calcul sRGB des paires canoniques, pas audit automatisé de chaque composant |
| Accessibilité | Deux boutons nommés avec `aria-pressed`, cibles 44 px, focus visible et anneau d'état contrasté | Une revue avec technologies d'assistance réelles reste requise avant pilote |

### Verrou de dépendance déclenché par la CI

Le premier commit de l'interface, `75c6a3784617dca016a485c5dc3b31aded7a446e`,
a déclenché l'avis npm `GHSA-2v37-7h3g-55p8` sur `nanoid < 3.3.17` dans la
gate Verify. La dépendance n'est pas importée par Parkventory : elle est
transitive, limitée au build frontend via PostCSS et Vite. Une mise à jour
globale de Vite aurait élargi le risque ; le lockfile est donc seul déplacé de
`nanoid` `3.3.16` vers la version compatible `3.3.18`.

| Dimension | Observation datée |
| --- | --- |
| Besoin | Lever l'avis de disponibilité élevée signalé par la gate npm sans changement de contrat ni de runtime applicatif |
| Origine et propriétaire | Package officiel npm `nanoid`, dépôt `ai/nanoid`, maintenu par son projet amont ; consommateur local : PostCSS `8.5.25` dans la chaîne Vite |
| Version et intégrité | `3.3.18`, tarball npm verrouillé par `sha512-DTg4MJbGMWkfi6VZFdNt2/caMbQy4Ou+Op/hJQvGEWcnVfoA1QA+xzRKAzw9jD6+GVOOeYr/mIcuDSdug6F6+w==` |
| Licence | MIT, inchangée et compatible avec la distribution actuelle |
| Scripts, permissions et binaires | Aucun package direct ni permission ajouté ; le binaire npm existant reste celui de la dépendance transitive de développement |
| Données, réseau et coût | Aucune donnée, requête runtime, rétention, secret, quota ou coût externe ajouté |
| Compatibilité | PostCSS accepte `^3.3.16` ; `3.3.18` reste dans la même ligne majeure et conserve les moteurs Node déclarés |
| Audit | `npm audit --audit-level=high`, npm `11.9.0`, exécuté le 2026-08-11 contre la base d'avis du registre npm : aucun avis dans le lockfile racine ; le lockfile Nimbus séparé et les avis futurs restent hors de cette preuve |
| Retrait et rollback | Le retrait suit celui de PostCSS/Vite ; revenir à `3.3.16` réintroduirait l'avis et exige donc une dérogation explicite ou une autre version 3.x corrigée |
| Réexamen | Rejouer l'audit à chaque changement de lockfile et avant chaque livraison |

Les runs initiaux `31481985053` (Verify) et `31481985170` (Pages) ont aussi
exposé l'attente déjà connue du test d'affectation d'une place. Son rejeu Pages
a réussi sans changement de code ; le second passage Verify a franchi React et
s'est arrêté uniquement sur l'avis npm ci-dessus. Aucun délai global de test
n'a été relâché. Le test émet désormais des changements déterministes sur les
deux champs contrôlés, vérifie l'activation du bouton, le `POST /spots` puis la
seconde lecture de `/dashboard` avant d'attendre le formulaire de partage. Sa
synchronisation reste ainsi bornée sur les états et effets réseau attendus.

### Publication corrigée

| Preuve distante | Résultat du 2026-08-11 |
| --- | --- |
| Commit | `e53ae9abcdc8ced2b6b9b47ebbd11452c302b921` — stabilisation du test et verrouillage de `nanoid` `3.3.18` |
| Verify | [Run 31483526624](https://github.com/nclsppr/parkventory/actions/runs/31483526624) réussi au premier passage : documentation, audit npm, 19 tests React, builds, Quarkus/PostgreSQL et parcours Docker Compose |
| Pages | [Run 31483526656](https://github.com/nclsppr/parkventory/actions/runs/31483526656) réussi au premier passage et déployé |
| Probes publiques | Landing, `/app/`, `/app/partager/`, `/app/trouver/` et `/auth/callback/` répondent HTTP 200 ; le HTML servi contient la clé de préférence et le `theme-color` |

## Extension : audit de lisibilité du thème clair du 2026-08-11

Le skill externe `design-taste-frontend` a été utilisé comme grille consultative
pour challenger la hiérarchie et les couleurs. Le contrat local est resté
prioritaire : vert acide pour l'action, glacier pour la disponibilité, thème
sombre initial et SVG de marque inchangé.

L'audit a confirmé la solidité des encres sémantiques, puis isolé les défauts
de mise en œuvre : couleurs fixes du logo sur blanc, placeholders dépendants du
navigateur, anciennes bordures alpha, focus de champs neutralisé, état actif
perdu en couleurs forcées et aperçu mobile réduit à une miniature.

### Preuves locales

| Contrôle | Résultat observé | Frontière de preuve |
| --- | --- | --- |
| Ratios automatisés | 13 vérifications lisent les tokens CSS réels ; texte secondaire au moins 5,38:1, encres vert/cyan au moins 6,69:1, aplats au moins 14,09:1, plaque du SVG au moins 9,77:1 et frontière forte au moins 3,03:1 | Calcul sRGB ; la photographie tramée est contrôlée visuellement et par Axe |
| Axe Core `4.13.0` | 24 passages sans violation : six routes, clair/sombre, 1 440 × 900 et 390 × 844, règles WCAG A/AA, 2.1 AA et 2.2 AA | Chromium local ; scanner temporaire hors arbre npm du projet |
| Focus et contraste élevé | Champs à anneau cyan 2 px avec offset 3 px ; choix de thème et route active distincts sous `forced-colors: active` | Émulation Chromium, pas Windows High Contrast sur appareil réel |
| Responsive | Landing sans débordement à 320 et 390 px ; aperçu produit recomposé sans `scale()` ; sombre inchangé | Captures Chromium avec mouvement réduit |
| Partage au clavier | Aucun contrôle `.sr-only` tabulable ; horaires inversés annoncés et reliés aux deux champs, action disponible sans requête invalide | Test React et parcours navigateur statique |
| Tests React | 34 tests réussis sur trois passages consécutifs | JSDOM ne remplace pas un lecteur d'écran réel |
| Builds | TypeScript, Vite et les cinq entrées Pages construits ; CSS initial 13,43 Ko gzip, JavaScript initial 77,00 Ko gzip | Mesure locale, sans latence réseau |

Le master `parkventory-logo-transparent.svg` n'est ni recoloré ni modifié. En
clair seulement, les instances UI reçoivent une plaque `#080a08` ; le vert du
master atteint 15,98:1 et le glacier 9,77:1 sur cette plaque. Le bloc
photographique final reste une surface inverse volontaire, dont les textes
dépassent 6,16:1.

### Publication vérifiée

| Preuve distante | Résultat du 2026-08-11 |
| --- | --- |
| Commit applicatif | [`c5b9dc524e35e514973953956c7e91c5b1a671a7`](https://github.com/nclsppr/parkventory/commit/c5b9dc524e35e514973953956c7e91c5b1a671a7) poussé directement sur `main` |
| Verify | [Run 31490845653](https://github.com/nclsppr/parkventory/actions/runs/31490845653) réussi au premier passage avec documentation, audit npm, 34 tests React, Quarkus/PostgreSQL et smoke Compose |
| Pages | [Run 31490845612](https://github.com/nclsppr/parkventory/actions/runs/31490845612) réussi et déployé |
| Probes publiques | Landing, `/app/`, `/app/partager/`, `/app/trouver/` et `/auth/callback/` répondent HTTP 200 ; `/app/inconnue/` répond HTTP 404 |
| Artefact publié | La feuille `index-BF7UhOiP.css` contient les règles de couleurs forcées et les corrections du thème clair |

## Extension : publication Nimbus filtrée du 2026-08-11

La documentation produit doit être accessible depuis le README sur la même
surface GitHub Pages que la démo. Le build Nimbus local complet contient aussi
des audiences `internal` et `reference` ; il n'a donc pas été copié directement.
L'ADR-0006 retient une allowlist explicite et un artefact Pages unique.

### Périmètre prêt à publier

| Élément | Valeur vérifiée localement |
| --- | --- |
| URL cible | `https://nclsppr.github.io/parkventory/docs/` |
| Collection autorisée | `product`, visibilité `public` |
| Sources | 4 Markdown : vision, parcours, rôles et règles métier |
| Sortie Nimbus | 7 pages de contenu indexées, 9 fichiers HTML et 93 fichiers publics |
| Artefact Pages | `frontend/dist/` avec la démo à la racine et Nimbus sous `docs/` |
| Décision | `docs/decisions/adr-0006-publication-nimbus-github-pages.md` |

### Contrôles locaux

| Contrôle | Résultat | Frontière de preuve |
| --- | --- | --- |
| Tests d'adaptateur Nimbus | Tests réussis : allowlist, rejet non public, variable vide, lien Markdown relatif exclu, index synthétique, base path et structures de navigation | Tests Node ; le rendu final est contrôlé séparément |
| Gate Nimbus publique | Typecheck sans diagnostic, build, recherche Pagefind et 8 fichiers lintés | Variables Pages fixées par `scripts/build_pages.sh` |
| Audience | Aucune front matter `internal`, `reference` ou `archive` dans la collection générée | Les visibilités restent éditoriales, pas un contrôle d'accès au dépôt public |
| Routes interdites | `project`, `status`, `design`, `delivery-evidence`, décisions, documents internes, Foundation et maintenance Nimbus absents | Contrôle de l'arbre généré avant copie |
| URL sous chemin | Navigation, recherche, canonical, Open Graph, sitemap, `robots.txt`, `llms.txt`, `llms-full.txt`, `index.md` et `index.mdx` utilisent `/parkventory/docs/` ; serveur statique local : routes autorisées HTTP 200 et deux routes exclues HTTP 404 | Artefact monté sous `/parkventory/` ; disponibilité distante encore à prouver |
| Corpus local complet | 37 Markdown donnent 46 pages de contenu ; 102 fichiers sans diagnostic et 47 fichiers lintés | Ce corpus complet n'entre jamais dans l'artefact Pages |

Le workflow Pages installe les lockfiles frontend et Nimbus, teste le frontend,
exécute `npm run pages:build`, puis charge l'unique dossier `frontend/dist`.
La preuve de publication distante sera ajoutée après le premier déploiement de
cette unité ; elle ne doit pas être déduite du build local.
