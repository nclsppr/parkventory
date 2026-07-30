# Parkventory

Parkventory permet aux collègues d'une même entreprise de partager leur place
de parking pendant une absence, puis de réserver une disponibilité sans qu'un
administrateur soit nécessaire au démarrage.

Le dépôt contient désormais une landing page et un tableau de bord React,
une API locale Java 25 / Quarkus 3.33.3 LTS et un schéma PostgreSQL 18 migré
par Flyway. Les données et mutations visibles sont explicitement signalées
comme une démonstration locale : l'authentification et la persistance métier
arriveront dans les phases suivantes.

## Démarrer en local

Prérequis : [mise](https://mise.jdx.dev/) et Docker ou OrbStack démarré.

```bash
mise install
npm ci
npm run dev
```

La commande démarre PostgreSQL, attend la santé de Quarkus, puis lance Vite :

- landing : `http://127.0.0.1:5173/` ;
- application : `http://127.0.0.1:5173/app` ;
- santé Quarkus : `http://127.0.0.1:8080/q/health/ready` ;
- Swagger UI : `http://127.0.0.1:8080/q/swagger-ui`.

Un `Ctrl-C` arrête les processus et le conteneur PostgreSQL tout en conservant
son volume. Pour supprimer volontairement les données locales :

```bash
npm run db:reset
```

## Vérifier

Avec Docker démarré :

```bash
mise exec -- npm run verify
```

Cette gate rejoue le catalogue et le build Nimbus, l'audit npm, les tests et le
build React, puis les tests Quarkus contre un vrai PostgreSQL 18 éphémère avec
la migration Flyway.

## Périmètre actuel

- React 19, TypeScript 7 et Vite 8 pour la landing et l'application responsive ;
- Java 25 et Quarkus LTS pour `/api/v1`, SmallRye Health et OpenAPI ;
- PostgreSQL 18 avec contraintes temporelles d'affectation et de réservation ;
- Compose et runtimes épinglés par `mise.toml` / `mise.lock` ;
- images générées propres au projet, avec source et provenance documentées ;
- aucun email réel, aucune authentification et aucun déploiement de production.

## Documentation essentielle

- [`PROJECT.md`](PROJECT.md) : contrat stable et architecture ;
- [`STATUS.md`](STATUS.md) : état réellement vérifié ;
- [`ROADMAP.md`](ROADMAP.md) : séquencement et sorties ;
- [`DESIGN.md`](DESIGN.md) : direction artistique et règles UX ;
- [`docs/product/vision.md`](docs/product/vision.md) : vision produit ;
- [`docs/product/roles-and-governance.md`](docs/product/roles-and-governance.md) : fonctionnement communautaire ;
- [`docs/architecture/domain-model.md`](docs/architecture/domain-model.md) : modèle et invariants ;
- [`docs/references/visual-sources.md`](docs/references/visual-sources.md) : références et provenance ;
- [`DELIVERY-EVIDENCE.md`](DELIVERY-EVIDENCE.md) : preuves et limites de livraison.

## Statut juridique

Le dépôt public ne contient actuellement aucun fichier de licence. Son
accessibilité ne vaut pas autorisation de réutilisation. Les références JPEG
fournies restent locales et sont ignorées par Git ; l'application sert
uniquement l'illustration originale générée pour Parkventory.
