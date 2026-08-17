# ADR-0008 — Publier une release applicative immuable pour Atlas

- Statut : accepté
- Date : 2026-08-17
- Décideur : nclsppr
- Portée : producteur OCI Parkventory, sans activation de production

## Contexte

L'ADR-0007 borne la surface Atlas actuelle à une démo statique sans backend,
base ni secret. Cette démo ne permet pas de livrer l'application réelle, composée
d'un frontend React, d'une API Java/Quarkus et de migrations PostgreSQL. Atlas a
besoin d'un digest unique qui lie tous les composants à un même commit, sans
déduire une version depuis un tag mutable ni lancer Flyway dans le runtime.

Publier les images séparément ne suffit pas : l'admission doit également lier le
bundle d'intégration VPS, l'inventaire exact des migrations et celui des probes.
La publication d'un candidat doit rester distincte de son activation afin que la
démo statique ne soit jamais remplacée implicitement.

## Décision

Parkventory adopte le contrat commun `vps-infra.application-release.v1`.

- Le backend et le frontend sont construits pour `linux/amd64` depuis des bases
  épinglées par digest et s'exécutent sans privilège.
- Une seule image backend contient le runtime et l'entrypoint du migrateur. Le
  runtime force `migrate-at-start=false` et refuse le mode migrateur ; le job
  dédié exécute Flyway puis quitte.
- Le bundle `vps-integration` est déterministe et lié au SHA source. Il contient
  le Compose app-only, les routes Caddy, les probes, les règles/targets
  Prometheus, le contrat d'intégration et les hashes de chaque migration Flyway.
- Le workflow `Application release` valide d'abord le dépôt et les images. Sur
  `main` seulement, il publie puis revalide les digests exacts, bloque sur les
  vulnérabilités `HIGH` ou `CRITICAL` corrigibles, produit SBOM et provenance,
  et vérifie les attestations GitHub.
- Le dernier job, nommé exactement `Publish immutable application release`,
  publie `ghcr.io/nclsppr/parkventory/application-release:sha-$HEAD`. Son unique
  descripteur canonique lie les images backend/frontend, le bundle
  `vps-integration`, les hashes des inventaires migrations/probes et le même SHA.
- Atlas n'admet ce digest que si les checks `verify` et
  `Publish immutable application release` correspondent au SHA exact.

La publication ne change ni DNS, ni route, ni Compose actif, ni état Atlas. Le
cutover de la démo statique vers l'application complète exige une tranche
distincte, les préconditions du runbook et une preuve live.

## Conséquences

Un commit vert de `main` peut produire un candidat applicatif complet et
traçable sans confondre build et déploiement. Les migrations sont explicites,
non concurrentes avec le runtime et vérifiables avant admission. Le coût est un
workflow plus long, quatre dépôts OCI supplémentaires et une duplication bornée
du validateur Atlas côté producteur ; les tests contractuels doivent signaler
toute dérive du format partagé.

Restent hors de cette décision : choix PostgreSQL de production, RLS et rôles
finaux, fournisseur email/OIDC, secrets, sauvegarde/restauration, observabilité
live, applicateur Compose et bascule de `parkventory.com`.

## Alternatives rejetées

- Réutiliser l'archive statique comme frontend de production : elle compile
  volontairement `VITE_DEMO_MODE=true` et ne porte aucun contrat backend.
- Déployer depuis des tags `latest` ou `sha-*` sans résoudre les digests : un
  tag peut être déplacé et ne lie pas les composants entre eux.
- Lancer Flyway au démarrage de chaque réplique backend : les droits DDL et les
  migrations concurrentes élargiraient inutilement le risque runtime.
- Publier la release finale avant de tester les digests réellement poussés : un
  rebuild distant pourrait diverger du candidat validé sans bloquer l'admission.
