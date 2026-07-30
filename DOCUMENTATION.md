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

Le dépôt GitHub est public : `internal` organise une future publication Nimbus,
mais ne constitue pas un contrôle d'accès. Aucun secret ni contenu confidentiel
ne doit être committé.

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

```bash
python3 scripts/documentation_catalog.py --write
./scripts/verify.sh
```

Nimbus 0.8.2 est épinglé dans `docs-nimbus/package.json`. La collection générée
et `docs-nimbus/dist/` restent ignorés par Git.

## Ajouter un document

1. Créer le fichier dans sa source canonique.
2. Ajouter ou réutiliser un seul glob dans `documentation.json`.
3. Régénérer le catalogue.
4. Relire visibilité, liens et navigation.
5. Exécuter `./scripts/verify.sh`.
6. Vérifier le rendu local si le contenu ou la navigation change.
