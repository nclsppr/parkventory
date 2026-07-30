# FOUNDATION.md

Contrat d'adoption du socle commun par ce projet.

## Version

| Champ | Valeur |
| --- | --- |
| Source | `https://github.com/nclsppr/project-foundation.git` |
| Version lisible | `v0.4.0` |
| Commit immuable | `7a5204a60eaf01cbaf38c86f56175751e36a0dad` |
| Pack adopté | `critical` |
| Adoptée le | 2026-07-30 |
| Adoptée par | nclsppr |

## Snapshot vendorisé

Les fichiers suivants sont copiés sous `docs/foundation/` et ne sont pas édités
localement :

- `PRINCIPLES.md`
- `DEFAULTS.md`
- `DEFINITION-OF-DONE.md`

Les profils vendorisés sont exactement ceux de la section « Profils activés ».
Une mise à jour remplace ces fichiers depuis une nouvelle version du socle et
fait l'objet d'un diff relu.

## Profils activés

- `documentation-nimbus`
- `web`
- `backend-data`
- `infrastructure-production`
- `dependency-change`
- `generated-artifacts`

Les profils sont des politiques durables du projet. Leurs gates ne s'appliquent
qu'aux unités de travail qui rencontrent leur déclencheur.

`documentation-nimbus` est obligatoire et s'applique à chaque unité qui modifie
un Markdown ou la documentation.

## Dérogations et contrôles compensatoires

Aucune dérogation n'est enregistrée au 2026-07-30.

| Règle ou default | Portée | Choix local | Raison | Contrôle compensatoire | Propriétaire | Réexamen | ADR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Aucune | Projet | Socle appliqué sans exception | Première adoption | Vérification du snapshot et de Nimbus | nclsppr | À chaque montée de version | Aucune |

`P18` ne peut pas être désactivé localement. La politique Parkventory utilise
le push direct sur `main` lorsqu'il est autorisé, sinon une branche dédiée ; une
tranche terminée ne reste pas uniquement en local.

## Challenger le socle

Le snapshot `docs/foundation/` est en lecture seule dans ce projet.

- Si le besoin est local, écrire une dérogation dans ce fichier.
- Si la règle devrait changer pour tous les projets, modifier le dépôt indiqué
  par `Source`, vérifier ses tests, publier une nouvelle release, puis mettre ce
  projet à niveau vers le nouveau tag et son SHA.
- Ne jamais corriger directement le snapshot : cela créerait un fork silencieux.

Le protocole complet vit dans `ADOPTION.md` du dépôt Project Foundation.

## Sources locales supplémentaires

| Sujet | Source locale |
| --- | --- |
| Contrat produit et technique | `PROJECT.md` |
| État courant | `STATUS.md` |
| Séquencement | `ROADMAP.md` |
| Direction visuelle | `DESIGN.md` |
| Règles métier | `docs/product/business-rules.md` |
| Sécurité et isolation | `docs/architecture/security-and-tenancy.md` |
| Exploitation cible | `RUNBOOK.md` |
| Décisions structurantes | `docs/decisions/` |

## Adaptateurs locaux initialisés

Les fichiers suivants partent de la baseline du socle puis deviennent locaux et
éditables :

- `scripts/check_markdown.py`
- `scripts/documentation_catalog.py`
- `scripts/verify.sh`

Ils contiennent les gates Foundation, Nimbus, React, Java, PostgreSQL et OpenAPI
adaptées à Parkventory. Une mise à niveau compare leur baseline avec la nouvelle
version avant toute fusion.

## Reclassification et activation ultérieure

Parkventory est classé critique dès l'origine, car il traite identité
professionnelle, appartenance à une organisation, rôles et données de présence.
Un downgrade exige une ADR et la preuve que ces risques ont disparu.

Lorsqu'une unité exige un profil non activé, le profil est copié depuis le même
commit du socle, déclaré ici, puis ses gates applicables sont consignées dans la
preuve de livraison.

## Mise à jour

1. Lire le changelog du socle entre la version actuelle et la cible.
2. Remplacer le snapshot vendorisé.
3. Examiner invariants, defaults, profils et gates.
4. Réconcilier les dérogations locales.
5. Comparer la nouvelle baseline des scripts.
6. Régénérer le catalogue documentaire.
7. Exécuter `./scripts/verify.sh`.
8. Committer snapshot, provenance et adaptations dans une seule unité.
9. Pousser immédiatement sur `main` si l'écriture directe est autorisée, sinon sur une branche dédiée.
