# Modèle de données D1

Le schéma opérationnel est la migration `migrations/0001_cloudflare_mvp.sql`.

| Table | Rôle |
| --- | --- |
| `organization` | frontière tenant, unique par domaine normalisé |
| `user_account` | identité minimale, unique par e-mail normalisé |
| `membership` | rattachement d’un utilisateur à son organisation |
| `magic_link_request` | hash du jeton, expiration, consommation et rate limit |
| `app_session` | hash du cookie opaque, expiration et révocation |
| `parking_spot` | place assignée, une par membre |
| `availability_offer` | créneau entier publié ou retiré |
| `reservation` | réservation confirmée ou annulée |

L’index partiel `one_active_reservation_per_offer` garantit une seule
réservation confirmée par offre. Le trigger `availability_no_overlap_insert`
refuse les créneaux qui se chevauchent pour une même place. Le trigger
`reservation_same_tenant_insert` refuse une réservation inter-tenant ou par le
propriétaire de la place.
