# Changelog

Ce fichier trace chaque changement livré avec son impact observable. Git reste
la source du diff technique et les ADR expliquent les décisions importantes.

## Non publié

### Ajouté

- migration Flyway V3 activant et forçant RLS sur les tables d'identité,
  session et données tenant, avec contexte `SET LOCAL` transactionnel et rôle
  runtime non propriétaire testé ;
- matrice adversariale prouvant l'absence de lecture sans contexte, le refus
  d'un mauvais tenant, et l'impossibilité pour le tenant A de lire, modifier ou
  créer une ligne du tenant B ;
- reprise Flyway V1 vers V3, suite Quarkus et parcours métier répétés sur
  PostgreSQL 17.10 et 18.3, y compris sous rôle runtime non propriétaire et sans
  `BYPASSRLS` ; cette preuve reste locale et ne migre pas Atlas ;
- bootstrap borné pour l'email et le domaine déjà vérifiés, réutilisable par le
  futur adaptateur OIDC sans couplage au lien magique local ;
- file `outbox_dispatch` globale limitée aux UUID techniques et à l'échéance,
  tandis que les payloads restent sous RLS et que les retries synchronisent les
  deux échéances ;
- ADR-0009 documentant le contrat RLS, les rôles PostgreSQL, les exceptions
  bootstrap/outbox et les limites face à un credential runtime compromis ;
- candidat d’authentification de production Auth0 EU Universal Login Email OTP,
  proposé sans activation ni provisionnement fournisseur : client confidentiel
  Quarkus OIDC fail-closed, PKCE/state/nonce, claims vérifiés, pont
  `app_session`, secrets Compose par fichiers et adaptateurs local/production
  mutuellement exclusifs au build ;
- interface de production limitée à « Continuer par e-mail », sans Mailpit ni
  routes magic-link locales, avec contrat adversarial de configuration,
  d’exposition des profils et de liaison/provisionnement PostgreSQL ;
- clarification du cadenceur de réconciliation Atlas : planification toutes les
  dix minutes en best-effort, avec retards GitHub possibles, et dispatch manuel ;
- publication de la PR #4 sur `main` au SHA
  `583e0e2b63701097aa4894ecc4fb3de8ad325346`, avec les workflows Verify,
  Pages, release statique et release applicative tous réussis ;
- enregistrement du snapshot de mise en service Atlas, antérieur à cette
  consolidation documentaire, avec le site statique
  `sha256:eb4596ac08e76bf59dc0c1ed6982f8cad6a25e98bc09b507790a78107e41553c`
  et de ses routes
  `sha256:47673d6906494ed128616357efe305e7be372e06022f4a2a794dcdc164ecbe7a`,
  avec apex HTTPS 200, redirection `www` unique et réconciliation automatique
  désormais active ; les prochains pushes produisent de nouveaux tuples ;
- première release applicative canonique publiée et attestée au digest
  `sha256:384f736a81089a9a91a7ff55b21d552a6d803d65ab8e33daa296b54d990209a3`,
  distincte de toute activation Compose ;
- consolidation opérationnelle de l'état Atlas, des preuves de publication,
  des statuts `ready`/`pending`/`blocked`, du dispatch, de la suspension, de la
  recovery, de la rotation de clé et du cutover exclusif statique vers Compose ;
- producteur applicatif Atlas séparé de la démo statique, avec images OCI
  backend Java/Quarkus et frontend React `linux/amd64`, non-root et construites
  depuis des bases verrouillées par digest ;
- migrateur Flyway dédié dans la même image backend, runtime explicitement sans
  migration automatique et test du rôle PostgreSQL runtime privé de DDL ;
- Compose VPS app-only sans port, build ni volume, avec secrets fichiers,
  réseaux externes, healthchecks, ressources et logs bornés ;
- bundle `vps-integration` déterministe lié au SHA, inventaires exacts des
  migrations V1 à V3 et probes, puis descripteur canonique
  `vps-infra.application-release.v1` liant tous les digests ;
- workflow de publication après gate complète, scans bloquants, SBOM,
  provenance et attestations, avec revalidation des images réellement poussées
  avant `Publish immutable application release` ;
- ADR-0008 qui sépare explicitement la publication d'un candidat full-stack de
  tout cutover de la démo statique ou déploiement live ;
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

- attente du processus PostgreSQL final, et pas du serveur temporaire de
  l'entrypoint, avant de tester les images réellement poussées, avec timeout et
  journaux explicites en cas d'échec ;
- attente de la base PostgreSQL de compatibilité par une requête réelle sur la
  base cible, au lieu d'un simple signal serveur qui pouvait précéder sa
  création en CI, avec refus explicite de Python antérieur à 3.9 et propagation
  du rejet d'un contrat invalide jusqu'au statut de la gate ;
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
- aucun backend ou domaine de production applicative n'est livré ;
  `parkventory.com` sert publiquement la démo Atlas statique en HTTPS ;
- le contrôleur applicatif est fusionné dans `vps-infra`, mais Parkventory reste
  désactivé, sa convergence live n'est pas prouvée et aucune base, aucun secret,
  aucune migration ou bascule Compose n'a été exécuté ;
- les droits de publication des cinq JPEG restent à confirmer ; le SVG fourni
  ne contient ni wordmark vectoriel ni variante monochrome ;
- Auth0 EU n’est qu’un candidat OIDC proposé : le sous-traitant, le coût, le
  tenant, le fournisseur d'email et l'infrastructure de production ne sont pas
  approuvés ; Mailpit est réservé au développement.
