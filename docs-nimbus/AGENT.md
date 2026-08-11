# Maintenance du site Nimbus

Ce dossier contient le scaffold Nimbus obligatoire de Project Foundation. Il
reste suivi par `nimbus.json`, mais ses commandes et son adaptateur sont adaptés
au contrat documentaire du socle.

Les règles normatives vivent dans [`DOCUMENTATION.md`](../DOCUMENTATION.md).
Dans un projet adopté, le profil obligatoire est vendorisé sous
`docs/foundation/profiles/documentation-nimbus.md`. La décision d'origine reste
dans Project Foundation sous
`docs/decisions/adr-0003-nimbus-obligatoire.md`.

## Sources et dérivés

- Les Markdown classés par `documentation.json` sont les seules sources
  éditoriales.
- `scripts/sync-content.mjs` génère `src/content/docs/` depuis cet inventaire.
- La collection générée, `dist/`, `.astro/` et `node_modules/` ne sont jamais
  édités ni commités.
- Ce fichier appartient lui-même à la collection documentaire de référence.

## Prérequis

- Node `22.12.0` ou plus récent ;
- npm ;
- Python `3.9` ou plus récent pour le catalogue source.

Le gestionnaire canonique est npm. Ne pas introduire un second lockfile.

## Commandes canoniques

Depuis la racine du projet :

| Action | Commande |
| --- | --- |
| Installer exactement le lockfile | `npm ci --prefix docs-nimbus` |
| Synchroniser les sources | `npm run sync --prefix docs-nimbus` |
| Développer | `npm run dev --prefix docs-nimbus` |
| Tester, typer, construire et linter | `npm run check --prefix docs-nimbus` |
| Vérifier le scaffold amont | `npm run outdated --prefix docs-nimbus` |
| Vérifier tout le projet | `./scripts/verify.sh` |

## Modifier le scaffold

1. Lire `nimbus.json` et vérifier la version amont ciblée.
2. Comparer le nouveau scaffold dans un dossier temporaire isolé.
3. Appliquer uniquement les changements compris, sans écraser l'adaptateur, le
   schéma de contenu, la configuration d'audience ou les scripts du projet.
4. Mettre à jour la dépendance exacte et `package-lock.json` dans le même
   changement.
5. Exécuter `./scripts/verify.sh`.
6. Tracer la décision si le contrat documentaire, les audiences ou la version
   minimale de Node changent.

## Publication

Le build local sans filtre contient toutes les audiences afin de rendre le
corpus navigable. Il ne doit jamais être publié tel quel.

Le workflow GitHub Pages est configuré pour publier Nimbus sous
`https://nclsppr.github.io/parkventory/docs/` dans le même artefact que la démo
frontend. `scripts/build_pages.sh` fixe :

- `NIMBUS_PUBLIC_COLLECTIONS=product` ;
- `NIMBUS_SITE_ORIGIN=https://nclsppr.github.io` ;
- `NIMBUS_BASE_PATH=/parkventory/docs` ;
- `NIMBUS_TITLE=Documentation Parkventory` ;
- `NIMBUS_DESCRIPTION=Vision, parcours, rôles et règles produit de Parkventory.` ;
- `NIMBUS_GITHUB=https://github.com/nclsppr/parkventory`.

L'adaptateur refuse une collection inconnue ou dont la visibilité n'est pas
`public`. Il refuse aussi un lien Markdown relatif direct d'une source publiée
vers un fichier `.md` classé mais exclu. La gate contrôle l'absence de routes
internes avant de copier `docs-nimbus/dist/` sous `frontend/dist/docs/`.

Vérifier après publication l'accueil, les quatre pages produit, la recherche,
`llms.txt`, `llms-full.txt`, les variantes Markdown, le sitemap et une route
interne représentative qui doit répondre `404`. La décision et le rollback
vivent dans
[`ADR-0006`](../docs/decisions/adr-0006-publication-nimbus-github-pages.md).
