# AGENTS.md

Règles locales pour toute intervention sur Parkventory.

## Ordre de lecture

1. `PROJECT.md`, puis `STATUS.md` et `ROADMAP.md`.
2. `docs/decisions/adr-0017-cloudflare-native.md`.
3. `CHANGELOG.md` et `DESIGN.md` selon le périmètre.

## Autorité

L’instruction explicite de la tâche prime sur les conventions du dépôt. Le code
et la configuration prouvent ce qui existe ; `STATUS.md` borne ce qui est
effectivement vérifié. Ne jamais présenter une préversion ou un build vert comme
une production activée.

## Règles d’intervention

- Préserver les changements sans rapport et ne jamais modifier `docs/foundation/`.
- Garder une seule architecture active : React, Cloudflare Worker et D1.
- Ajouter une migration D1 pour toute évolution de schéma déjà déployée.
- Ajouter une ADR pour toute décision coûteuse à renverser et une entrée au
  `CHANGELOG.md` pour chaque livraison.
- Exécuter `npm run verify` avant commit. Les tests restent centrés sur le flux
  MVP, l’isolation tenant et l’unicité des réservations.
- Générer les types Cloudflare avec `npm run cf:types` après tout changement de
  bindings.
- Ne jamais versionner `.dev.vars`, un jeton, une adresse utilisateur réelle ou
  un secret. Ne jamais afficher une valeur secrète dans un log ou une réponse.
- Un déploiement public, un achat, un changement DNS ou la création d’un secret
  exige l’autorité explicite correspondante.
- Après validation, committer puis pousser sur `main` si l’écriture directe est
  autorisée, sinon sur une branche dédiée. Aucun force-push sur `main`.

## Produit MVP

Le produit n’est prêt que lorsqu’un utilisateur peut vérifier son e-mail
professionnel, déclarer et partager sa place, puis qu’un collègue du même domaine
peut la réserver sans double attribution. Invitations, administration, cartes,
paiements et statistiques de croissance sont hors MVP.
