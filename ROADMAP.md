# Roadmap

La réécriture d’architecture est un changement unique, pas une transition
Java/Cloudflare en plusieurs étapes. Les gates ci-dessous servent uniquement à
éviter de confondre code, préversion et activation publique.

| Ordre | Résultat | État | Critère de sortie |
| --- | --- | --- | --- |
| 1 | Candidat Cloudflare unique | `done` | Worker, D1, React, docs et CI versionnés ; tests MVP verts |
| 2 | Préversion exploitable | `in_progress` | D1 preview, Turnstile et e-mail réels ; parcours complet vérifié sans données fictives |
| 3 | Bascule publique unique | `in_progress` | Worker autoritatif actif ; propagation, restauration et rollback final à prouver |
| 4 | Produit MVP prêt | `planned` | deux vrais membres se connectent, partagent et réservent ; exactement un gagnant concurrent |
| 5 | Améliorations guidées par l’usage | `planned` | seulement après observation du MVP public |

Tout ajout hors connexion, partage ou réservation attend la sortie du MVP.
