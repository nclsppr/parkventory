# ROADMAP.md

Source canonique de l'ordre de livraison.

## Résultat produit

Permettre à une entreprise de créer spontanément une communauté Parkventory,
puis à ses membres de partager et réserver sans collision les places inutilisées,
avec une administration optionnelle et une cartographie ajoutée seulement
lorsqu'elle améliore un usage déjà validé.

## Principes de séquencement

- Prouver d'abord le flux utile, puis enrichir l'administration.
- Faire précéder chaque capacité par sa frontière de sécurité et de données.
- Garder un monolithe et une seule base tant qu'une mesure ne justifie pas plus.
- Ne jamais simuler une donnée, un client ou une carte future sur une surface canonique.
- Chaque phase produit une preuve observable et nomme ses exclusions.
- L'état courant détaillé vit dans `STATUS.md`.

## Vue d'ensemble

| Ordre | ID | Phase | Résultat utilisateur ou opérationnel | État macro | Critère de sortie | Preuve observée | Sortie le |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | F01 | Cadrage et socle | Le produit peut être compris et repris sans invention | `done` | Foundation, ADR, docs et Nimbus vérifiés | Snapshot identique ; `verify` vert ; rendu desktop/mobile revu | 2026-07-30 |
| 2 | F02 | Surface et squelette exécutable | La landing et l'app shell fonctionnent sur une stack reproductible | `in_progress` | React, API santé, PostgreSQL, CI et design tokens démarrent ensemble | Builds/tests, CI, clone propre et démo Pages verts ; client généré et démarrage depuis clone à prouver | |
| 3 | F03 | Identité et communauté | Un email pro vérifié rejoint ou crée une organisation sans admin | `planned` | Magic link, session et isolation inter-tenant testés | | |
| 4 | F04 | Partager et réserver | Une place assignée devient réservable sans double booking | `planned` | Parcours vertical E2E et concurrence PostgreSQL prouvés | | |
| 5 | F05 | Pilote fiable | Des collègues utilisent le flux sur mobile et desktop | `planned` | Notifications, accessibilité, observabilité et pilote contrôlé | | |
| 6 | F06 | Administration optionnelle | Une organisation peut nommer des admins et enrichir son inventaire | `planned` | Premier admin prouvé, rôles auditables, aucun admin requis au quotidien | | |
| 7 | F07 | Plan de parking | Les places peuvent être localisées sur un plan versionné | `planned` | Placement accessible, versionné et utile sur un site pilote | | |

États autorisés : `planned`, `in_progress`, `blocked`, `done`, `cancelled`.

## Phase F01 : cadrage et socle

### Objectif

Transformer le brief et les références en sources canoniques, décisions
réversibles et gates reproductibles.

### Dépendances

- Dépôt GitHub cloné.
- Project Foundation `v0.5.2` publié et vérifié.
- Références visuelles fournies.

### Inclus

- pack critique et profils durables ;
- vision, rôles, parcours, règles et questions ouvertes ;
- architecture, sécurité, modèle de domaine et quatre ADR ;
- design system provisoire et registre de provenance ;
- Nimbus, catalogue et preuve de livraison.

### Exclu

- code applicatif, CI, infrastructure et publication ;
- master SVG du logo ;
- décision du fournisseur d'email.

### Critère de sortie

- `./scripts/verify.sh` réussit ;
- le snapshot Foundation correspond au commit épinglé ;
- Nimbus est revu localement ;
- `STATUS.md` et `DELIVERY-EVIDENCE.md` consignent les limites.

### Retour arrière ou abandon

Le dépôt peut revenir à son état Git vide tant qu'aucun commit initial n'a été
publié ; conserver séparément les références fournies si leur origine doit être
réévaluée.

## Phase F02 : surface et squelette exécutable

### Objectif

Livrer la landing page fidèle à `DESIGN.md` et un socle React/Quarkus/PostgreSQL
minimal qui prouve installation, santé et migration.

### Inclus

- React + TypeScript + Vite ;
- Java 25 + Quarkus 3.33 LTS et première frontière REST ;
- PostgreSQL 18, Flyway et environnement local Compose pour React, Quarkus et la base ;
- tokens, logo de travail explicitement provisoire, responsive et accessibilité ;
- OpenAPI minimal, client TypeScript typé et CI appelant `verify`.

### Exclu

- métriques présentées comme réelles ou preuve d'un usage client ;
- authentification réelle et persistance métier des partages/réservations ;
- production.

### Critère de sortie

Depuis un clone propre, une commande documentée démarre landing, app shell,
healthcheck et PostgreSQL ; CI et tests sont verts ; mobile et desktop ont été
revus visuellement.

### Retour arrière ou abandon

Retirer les modules applicatifs et revenir au commit documentaire F01 sans
modifier le snapshot Foundation.

## Phase F03 : identité et communauté

Objectif : vérifier un email professionnel par lien magique, créer ou rejoindre
atomiquement une organisation communautaire et établir une session serveur.

Critère de sortie : rejeu et expiration refusés, réponse anti-énumération,
création concurrente d'un domaine unique et matrice inter-tenant testée.

Exclusions : administration, SSO et domaines personnels.

## Phase F04 : partager et réserver

Objectif : déclarer une place assignée, publier un intervalle, le rechercher et
le réserver.

Critère de sortie : deux réservations simultanées produisent exactement un
succès ; annulation, fuseaux, heure d'été et idempotence sont testés ; le flux
E2E fonctionne sans administrateur.

Exclusions : récurrence complexe, carte et gamification.

## Phase F05 : pilote fiable

Objectif : rendre le flux exploitable par un petit groupe réel, avec emails,
états vides, erreurs, accessibilité et diagnostic.

Critère de sortie : pilote autorisé, parcours mobile/desktop/clavier vérifié,
notifications par outbox, restauration isolée et runbook exécutable.

Exclusions : croissance commerciale et statistiques non prouvées.

## Phase F06 : administration optionnelle

Objectif : permettre la preuve du premier administrateur, la nomination de
plusieurs admins et l'enrichissement de sites, membres et places.

Critère de sortie : promotion et révocation auditables, contrôle du domaine
prouvé, retrait du dernier admin ramenant l'organisation au mode communautaire.

## Phase F07 : plan de parking

Objectif : versionner un fond de plan et associer des coordonnées normalisées aux
places stables sans remplacer la liste accessible.

Critère de sortie : un site pilote retrouve et réserve une place depuis le plan,
avec fallback liste, zoom clavier/tactile et rollback de version.

## Règle de mise à jour

- Mettre à jour l'état d'une phase uniquement avec sa preuve.
- Reporter blocages et versions observées dans `STATUS.md`.
- Créer une ADR si le séquencement change pour une raison structurante.
- Ne pas créer de seconde roadmap dans le README, une issue ou un outil tiers.
