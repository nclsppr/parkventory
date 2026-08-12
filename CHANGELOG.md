# Changelog

Ce fichier trace chaque changement livré avec son impact observable. Git reste
la source du diff technique et les ADR expliquent les décisions importantes.

## Non publié

### Ajouté

- matrice PostgreSQL liée aux digests exacts 17.10 et 18.3, avec application
  isolée de V1 puis V2, vérification de `btree_gist` et des exclusions GiST, et
  exécution complète des tests Quarkus sur chaque version ;
- contrat lisible par machine qui conserve la décision de production bloquée
  malgré la compatibilité technique du candidat Atlas PostgreSQL 17.10 ;
- documentation Nimbus publique sous `/parkventory/docs/`, reliée depuis le
  README et construite dans le même artefact Pages que la démo ;
- interface Nimbus, métadonnées, recherche et surfaces Markdown/agents
  harmonisées en français sous le chemin GitHub Pages ;
- allowlist de publication limitée à la collection `product`, avec rejet des
  collections non publiques, des liens Markdown relatifs directs vers des
  sources exclues et des routes internes dans l'artefact final ;
- thème clair ivoire pour la landing, l'authentification, l'application et les
  routes d'erreur, sans modifier le thème sombre historique par défaut ;
- sélecteur explicite clair/sombre accessible sur les surfaces publiques et
  applicatives, appliqué avant le premier rendu et mémorisé localement entre
  les routes et les visites ;
- palette sémantique séparant les aplats vert acide et bleu glacier de leurs
  encres accessibles sur fond clair, avec tests React et revue responsive des
  deux thèmes ;
- build statique Atlas à la racine, séparé du build GitHub Pages sous
  `/parkventory/`, avec mode démo obligatoire et routes directes ;
- archive et inventaire de routes déterministes pour une publication OCI par
  digest, workflow de provenance GitHub et intégration Caddy partagée ;
- espaces GHCR propres à ces artefacts, créés et reliés par le workflow du
  dépôt pour éviter un ancien namespace sans droit GitHub Actions ;
- refus local des liens magiques sur la démo, sans requête vers une API absente ;
- ADR-0007 qui borne `parkventory.com` à une démo sans backend, secret, port
  applicatif ou donnée persistée ;
- verrouillage transitif de `nanoid` en `3.3.18` pour corriger l'alerte de
  sécurité du générateur personnalisé sans changer l'API applicative ;
- attente CI ciblée et bornée pour le parcours d’affectation d’une place, qui
  couvre sa mutation puis le rechargement du tableau de bord sans modifier les
  délais de toute la suite de tests ;
- transitions narratives de la landing avec révélations uniques, progression
  de lecture, profondeur légère du hero, étapes synchronisées au scroll et
  micro-interactions limitées aux pointeurs compatibles ;
- header public sticky, ancres compensées et lien « Aller au contenu » compatible
  avec les safe areas Safari et la Dynamic Island ;
- GSAP `3.13.0` chargé en différé uniquement sur la landing, avec mouvement
  réduit, fallback `IntersectionObserver` et procédure de retrait documentée ;
- aperçu produit explicitement signalé comme démonstration et remplacement du
  compteur illustratif non prouvé par un état qualitatif ;
- routes produit dédiées `/app/partager` et `/app/trouver`, reliées à un shell
  applicatif commun et accessibles depuis les navigations desktop et mobile ;
- parcours de partage concentré sur l'intervalle d'absence, avec fuseau,
  validation et résumé avant publication ;
- parcours de recherche sur les disponibilités réelles des sept prochains
  jours, avec sélection distincte de la confirmation de réservation ;
- compatibilité des anciens liens `/app?intent=share|find`, vraie page 404 et
  artefacts GitHub Pages déterministes pour chaque route directe ;
- navigation mobile limitée aux destinations réellement livrées, avec tiroir
  piégeant le focus, cibles tactiles de 44 px et suppression des fausses
  affordances ;
- consolidation de l'ancien CSS du Dashboard dans la nouvelle grammaire de
  surfaces, espacements et couleurs sémantiques ;
- couverture React portée à 15 tests et smoke Compose étendu aux routes
  applicatives directes ;
- master SVG transparent fourni pour le symbole Parkventory, utilisé dans tous
  les lockups React, les favicons, le header et les cartes Open Graph Nimbus,
  avec synchronisation déterministe et gate anti-dérive ;
- adaptateur d’identité local par lien magique à usage unique, sessions
  `HttpOnly` et rattachement invitation/domaine persistés dans PostgreSQL ;
- Mailpit `v1.30.6` intégré à Docker Compose pour les liens de connexion,
  invitations et notifications de réservation ;
- API Quarkus persistante pour déclarer une place, publier une disponibilité,
  réserver avec idempotence et inviter un collègue ;
- outbox transactionnelle et worker Quarkus avec reprise bornée pour les emails
  métier ;
- migration Flyway V2 pour les liens magiques, sessions et l’exclusion des
  offres qui se chevauchent ;
- tests d’intégration PostgreSQL du parcours autonome, du rejeu de lien, de
  l’invitation exacte et des conflits d’affectation/réservation ;
- frontend React local branché sans repli silencieux sur la session Quarkus et
  les données PostgreSQL, avec déclaration, partage, réservation et invitation
  réelles ;
- écrans explicites de connexion par Mailpit, validation du lien magique,
  chargement, erreur et première place, avec déduplication du jeton sous
  `StrictMode` ;
- adoption de Project Foundation `v0.5.2` et de l'invariant `P19` ;
- parcours local intégré PostgreSQL, Mailpit, Quarkus et Vite entièrement
  piloté par Docker Compose avec images par digest et healthchecks ;
- checker Compose, smoke test isolé et gate CI contre les contournements ;
- adoption de Project Foundation `v0.4.0` en pack critique avec l'invariant
  `P18` et les profils web,
  backend/données, production, dépendances et artefacts générés ;
- documentation canonique de la vision, des rôles, des parcours, des règles
  métier, du modèle de domaine et de la sécurité multi-tenant ;
- choix documenté d'un frontend React et d'un backend Java 25 / Quarkus 3.33
  LTS en monolithe modulaire sur PostgreSQL 18 ;
- direction artistique sombre avec vert acide, bleu glacier et photographie
  tramée, accompagnée d'exigences d'accessibilité et de performance ;
- conservation locale des cinq références visuelles originales, exclues de Git,
  avec hashes et provenance ;
- roadmap dépendance-par-dépendance, runbook cible et preuve de livraison.
- landing et tableau de bord React 19 / TypeScript 7 / Vite 8 fidèles aux
  références, responsives et interactifs ;
- API de démonstration Java 25 / Quarkus 3.33.3 LTS avec santé, OpenAPI,
  validation et tests REST ;
- PostgreSQL 18 local, migration Flyway du modèle multi-tenant et contraintes
  d'exclusion temporelle ;
- environnement reproductible mise/Compose, gate complète et workflow GitHub
  Actions épinglé ;
- publication du frontend en démo statique sur GitHub Pages, avec routage sous
  `/parkventory/`, fallback des routes et actions locales sans requête backend ;
- illustration de parking originale générée pour le projet, master PNG,
  dérivé WebP et provenance.

### Corrigé

- audit de lisibilité du thème clair : logo original protégé par une plaque
  sombre, placeholders et focus de champs renforcés, frontières d'accent
  mesurables, états actifs compatibles avec les couleurs forcées et aperçu
  produit mobile recomposé sans réduction illisible ;
- parcours de partage débarrassé d'un champ masqué encore tabulable, avec erreur
  d'horaires inversés visible et reliée aux deux champs avant toute requête ;
- stabilisation du test d'affectation d'une place sur la saisie contrôlée, la
  création puis la relecture du dashboard, sans relever les délais de toute la
  suite ;
- verrouillage de la dépendance de build transitive `nanoid` en `3.3.18` pour
  corriger l'avis `GHSA-2v37-7h3g-55p8` détecté par la gate npm, sans ajouter de
  dépendance directe ni modifier le runtime applicatif.

### Limites

- les démos GitHub Pages et Atlas restent volontairement statiques, sans compte
  ni email ;
- la recherche locale expose l'agenda réel des sept prochains jours ; le filtre
  d'un intervalle arbitraire attend encore son contrat API dédié ;
- aucun backend ou domaine de production applicative n'est livré ; la cible
  Atlas statique exige encore promotion, DNS, TLS et probe public ;
- les droits de publication des cinq JPEG restent à confirmer ; le SVG fourni
  ne contient ni wordmark vectoriel ni variante monochrome ;
- le fournisseur OIDC, le fournisseur d'email et l'infrastructure de production
  ne sont pas choisis ; Mailpit est réservé au développement.
