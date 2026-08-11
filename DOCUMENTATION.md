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
être committé. La surface Nimbus destinée à Pages autorise explicitement la
seule collection `product`, classée `public`, à l'adresse cible
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

```bash
python3 scripts/documentation_catalog.py --write
./scripts/verify.sh
npm run pages:build
```

Nimbus 0.8.2 est épinglé dans `docs-nimbus/package.json`. La collection générée
et `docs-nimbus/dist/` restent ignorés par Git. `npm run pages:build` construit
le corpus public avec l'allowlist `product`, le chemin de base
`/parkventory/docs/`, puis le copie sous `frontend/dist/docs/` dans l'unique
artefact GitHub Pages. Le build échoue si une collection absente ou non publique
est demandée, si une source publique utilise un lien Markdown relatif direct
vers un fichier `.md` classé mais exclu ou si une route interne apparaît dans la
sortie. Le lint Nimbus contrôle en plus les routes internes du corpus retenu.

## Ajouter un document

1. Créer le fichier dans sa source canonique.
2. Ajouter ou réutiliser un seul glob dans `documentation.json`.
3. Régénérer le catalogue.
4. Relire visibilité, liens et navigation.
5. Exécuter `./scripts/verify.sh`.
6. Vérifier le rendu local si le contenu ou la navigation change.
