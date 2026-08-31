# Contrat documentaire

Tous les Markdown maintenus appartiennent à une collection de
`documentation.json` et apparaissent dans `DOCUMENTATION-CATALOG.md`.

## Audiences

- `public` : vision, rôles, parcours et règles produit pouvant être publiés.
- `internal` : contrat du dépôt, architecture, sécurité, questions ouvertes,
  décisions, roadmap, exploitation et preuves.
- `reference` : snapshot Foundation, maintenance Nimbus et registre des sources
  visuelles.
- `archive` : documents historiques explicitement retirés ; aucune archive
  n'existe actuellement.

Le dépôt GitHub est public : `internal` organise le corpus complet, mais ne
constitue pas un contrôle d'accès. Aucun secret ni contenu confidentiel ne doit
être committé. La surface Nimbus publiée autorise explicitement la seule
collection `product`, classée `public`, à l'adresse
`https://nclsppr.github.io/parkventory/docs/`.

## Règles

- Classer chaque Markdown exactement une fois.
- Modifier les Markdown sources, jamais la collection Nimbus générée.
- Ne pas dupliquer une règle normative dans plusieurs documents.
- Lier une synthèse vers sa source détaillée.
- Distinguer état actuel, cible et historique.
- Conserver les références visuelles et leurs droits séparés des assets de
  production.
- Publier uniquement les collections explicitement autorisées.
- Vérifier navigation, liens, recherche et audiences sur la surface finale.

## Commandes

Le contrat historique référence les commandes suivantes :

```bash
python3 scripts/documentation_catalog.py --write
./scripts/verify.sh
npm run pages:build
```

Dans le checkout Cloudflare actuel, `scripts/documentation_catalog.py` et
`scripts/verify.sh` sont absents, et le `package.json` racine ne déclare pas
`pages:build`. Le catalogue du candidat godmode a donc été réconcilié
manuellement avec `documentation.json` ; il ne faut pas présenter cette opération
comme une génération ou une gate Foundation réussie. L’entrypoint Nimbus
`npm run check`, lancé depuis `docs-nimbus`, exécute ses tests puis reste lui
aussi bloqué lors du sync sur le générateur absent. La restauration ou le
remplacement des trois entrypoints historiques reste un drift documentaire
distinct.

Nimbus 0.8.2 est épinglé dans `docs-nimbus/package.json`. La collection générée
et `docs-nimbus/dist/` restent ignorés par Git. Le pipeline historique
`npm run pages:build` construisait le corpus public avec l'allowlist `product`,
le chemin de base `/parkventory/docs/`, puis le copiait sous
`frontend/dist/docs/` dans l'unique artefact GitHub Pages. Ce script racine
n’existe plus dans le candidat actuel. Le build Nimbus refuse une collection
absente ou non publique, une source publique qui utilise un lien Markdown direct
vers un fichier `.md` classé mais exclu, ainsi que toute route interne dans la
sortie. Le lint Nimbus contrôle en plus les routes internes du corpus retenu.

## Ajouter un document

1. Créer le fichier dans sa source canonique.
2. Ajouter ou réutiliser un seul glob dans `documentation.json`.
3. Régénérer le catalogue si le générateur est disponible ; sinon le réconcilier
   manuellement et signaler explicitement cette limite.
4. Relire visibilité, liens et navigation.
5. Exécuter les contrôles disponibles sans prétendre que le script absent
   `./scripts/verify.sh` a réussi.
6. Vérifier le rendu local si le contenu ou la navigation change.
