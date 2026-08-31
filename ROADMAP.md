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
| 5 | Candidat godmode global | `in_progress` | identité système, ledger redacted, API et console en lecture seule ; tests locaux verts |
| 6 | Activation godmode | `planned` | migration D1 et secret appliqués avant le Worker ; identité exacte autorisée et membre tenant refusé en production |
| 7 | Améliorations guidées par l’usage | `planned` | seulement après observation du MVP public et de métriques réelles |

Les parcours membre restent bornés à la connexion, au partage et à la
réservation. La console godmode est l’exception d’exploitation explicitement
autorisée par l’ADR-0018 ; elle ne rend aucune nouvelle fonction métier
disponible aux tenants.
