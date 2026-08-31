# Modèle de données D1

Le schéma opérationnel est versionné par les migrations D1 sous `migrations/`.

| Table | Rôle |
| --- | --- |
| `organization` | frontière tenant, unique par domaine normalisé |
| `user_account` | identité minimale, unique par e-mail normalisé, et préférence de langue nullable du profil |
| `membership` | rattachement d’un utilisateur à son organisation |
| `magic_link_request` | hash du jeton, expiration, consommation et rate limit |
| `app_session` | hash du cookie opaque, expiration et révocation |
| `parking_spot` | place assignée, une par membre |
| `availability_offer` | créneau entier publié ou retiré |
| `reservation` | réservation confirmée ou annulée |
| `organization_branding` | co-marque optionnelle par domaine, modifiable et désactivable sans changer l'identité des membres |

L’index partiel `one_active_reservation_per_offer` garantit une seule
réservation confirmée par offre. Le trigger `availability_no_overlap_insert`
refuse les créneaux qui se chevauchent pour une même place. Le trigger
`reservation_same_tenant_insert` refuse une réservation inter-tenant ou par le
propriétaire de la place.

Le branding est résolu par égalité exacte sur le domaine normalisé. Son absence,
son opt-out ou une valeur invalide produit `null` et conserve l'identité
Parkventory. Les réponses authentifiées n'ont pas besoin d'exposer le domaine
pour transmettre le nom, le logo de même origine et les jetons sémantiques.

La préférence `preferred_locale` appartient au compte global, pas à une
adhésion ni à une session. Elle accepte uniquement `fr`, `en`, `de` ou `lb` et
reste `NULL` pour un compte historique tant qu’aucun choix connecté ou nouvelle
connexion ne l’a initialisée.
