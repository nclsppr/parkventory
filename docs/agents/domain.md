# Documentation du domaine

Ce dépôt utilise le mode `single-context`. Les sources canoniques existantes
restent prioritaires sur tout document créé par un skill.

## Avant d'explorer

- Lire `PROJECT.md` pour la carte des sources de vérité et le contrat stable.
- Lire `docs/architecture/domain-model.md` pour le modèle et ses invariants.
- Lire `docs/product/business-rules.md` pour les règles métier liées au sujet.
- Lire dans `docs/decisions/` chaque ADR qui touche la zone étudiée.
- Lire `CONTEXT.md` à la racine s'il existe plus tard.

Si `CONTEXT.md` n'existe pas, poursuivre silencieusement. Le skill `/domain-modeling` peut le créer lorsqu'un glossaire dédié devient nécessaire.

## Structure

```text
/
|-- PROJECT.md
|-- CONTEXT.md                              facultatif
`-- docs/
    |-- architecture/domain-model.md
    |-- product/business-rules.md
    `-- decisions/adr-*.md
```

## Utiliser le vocabulaire canonique

Quand une sortie nomme un concept du domaine, reprendre le terme défini dans le modèle ou les règles métier. Éviter les synonymes qui changeraient le sens.

Un concept absent peut signaler un mot inventé ou un vrai manque. Reconsidérer le terme, puis noter le manque pour `/domain-modeling` si le concept est nécessaire.

## Signaler les conflits avec une ADR

Si une proposition contredit une ADR existante, le signaler explicitement et citer cette ADR. Ne jamais la remplacer silencieusement.
