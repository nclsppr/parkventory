# Changelog

Ce fichier trace chaque changement livré avec son impact observable. Git reste
la source du diff technique et les ADR expliquent les décisions importantes.

## Non publié

### Ajouté

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

### Limites

- la démo GitHub Pages reste volontairement statique, sans compte ni email ;
- la recherche locale expose l'agenda réel des sept prochains jours ; le filtre
  d'un intervalle arbitraire attend encore son contrat API dédié ;
- aucun hébergement ou domaine de production n'est livré ;
- les droits de publication des cinq JPEG restent à confirmer ; le SVG fourni
  ne contient ni wordmark vectoriel ni variante monochrome ;
- le fournisseur OIDC, le fournisseur d'email et l'infrastructure de production
  ne sont pas choisis ; Mailpit est réservé au développement.
