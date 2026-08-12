<!-- Généré par scripts/documentation_catalog.py. Ne pas modifier à la main. -->

# Catalogue documentaire

Tous les fichiers Markdown maintenus par le projet sont classés ici depuis `documentation.json`.

Moteur déclaré : `nimbus`.

| Collection | Visibilité | Fichiers |
| --- | --- | ---: |
| Contrat du projet | `internal` | 12 |
| Produit | `public` | 4 |
| Architecture et sécurité | `internal` | 3 |
| Questions de travail | `internal` | 1 |
| Décisions | `internal` | 7 |
| Références visuelles | `reference` | 1 |
| Socle vendorisé | `reference` | 9 |
| Maintenance Nimbus | `reference` | 1 |

## Contrat du projet

- [AGENTS.md](AGENTS.md)
- [CHANGELOG.md](CHANGELOG.md)
- [DELIVERY-EVIDENCE.md](DELIVERY-EVIDENCE.md)
- [DESIGN.md](DESIGN.md)
- [DOCUMENTATION-CATALOG.md](DOCUMENTATION-CATALOG.md)
- [DOCUMENTATION.md](DOCUMENTATION.md)
- [FOUNDATION.md](FOUNDATION.md)
- [PROJECT.md](PROJECT.md)
- [README.md](README.md)
- [ROADMAP.md](ROADMAP.md)
- [RUNBOOK.md](RUNBOOK.md)
- [STATUS.md](STATUS.md)

## Produit

- [docs/product/business-rules.md](docs/product/business-rules.md)
- [docs/product/roles-and-governance.md](docs/product/roles-and-governance.md)
- [docs/product/user-journeys.md](docs/product/user-journeys.md)
- [docs/product/vision.md](docs/product/vision.md)

## Architecture et sécurité

- [docs/architecture/domain-model.md](docs/architecture/domain-model.md)
- [docs/architecture/overview.md](docs/architecture/overview.md)
- [docs/architecture/security-and-tenancy.md](docs/architecture/security-and-tenancy.md)

## Questions de travail

- [docs/internal/open-questions.md](docs/internal/open-questions.md)

## Décisions

- [docs/decisions/adr-0001-organisation-communautaire.md](docs/decisions/adr-0001-organisation-communautaire.md)
- [docs/decisions/adr-0002-monolithe-quarkus-postgresql.md](docs/decisions/adr-0002-monolithe-quarkus-postgresql.md)
- [docs/decisions/adr-0003-authentication-et-isolation.md](docs/decisions/adr-0003-authentication-et-isolation.md)
- [docs/decisions/adr-0004-integrite-temporelle-reservations.md](docs/decisions/adr-0004-integrite-temporelle-reservations.md)
- [docs/decisions/adr-0005-adaptateur-identite-mailpit-local.md](docs/decisions/adr-0005-adaptateur-identite-mailpit-local.md)
- [docs/decisions/adr-0006-publication-nimbus-github-pages.md](docs/decisions/adr-0006-publication-nimbus-github-pages.md)
- [docs/decisions/adr-0007-demo-statique-atlas.md](docs/decisions/adr-0007-demo-statique-atlas.md)

## Références visuelles

- [docs/references/visual-sources.md](docs/references/visual-sources.md)

## Socle vendorisé

- [docs/foundation/DEFAULTS.md](docs/foundation/DEFAULTS.md)
- [docs/foundation/DEFINITION-OF-DONE.md](docs/foundation/DEFINITION-OF-DONE.md)
- [docs/foundation/PRINCIPLES.md](docs/foundation/PRINCIPLES.md)
- [docs/foundation/profiles/backend-data.md](docs/foundation/profiles/backend-data.md)
- [docs/foundation/profiles/dependency-change.md](docs/foundation/profiles/dependency-change.md)
- [docs/foundation/profiles/documentation-nimbus.md](docs/foundation/profiles/documentation-nimbus.md)
- [docs/foundation/profiles/generated-artifacts.md](docs/foundation/profiles/generated-artifacts.md)
- [docs/foundation/profiles/infrastructure-production.md](docs/foundation/profiles/infrastructure-production.md)
- [docs/foundation/profiles/web.md](docs/foundation/profiles/web.md)

## Maintenance Nimbus

- [docs-nimbus/AGENT.md](docs-nimbus/AGENT.md)

## Chemins ignorés

Ces chemins contiennent des dépendances ou sorties dérivées, pas des sources documentaires maintenues.

| Motif | Glob |
| --- | --- |
| Dépendances tierces | `node_modules/**/*.md` |
| Sorties générées | `dist/**/*.md` |
| Artefact GitHub Pages combiné généré | `frontend/dist/**/*.md` |
| Sorties générées | `build/**/*.md` |
| Environnement Python local | `.venv/**/*.md` |
| Collection Nimbus générée depuis les sources classées | `docs-nimbus/src/content/docs/**/*.md` |
| Dépendances Nimbus tierces | `docs-nimbus/node_modules/**/*.md` |
| Site Nimbus généré | `docs-nimbus/dist/**/*.md` |
