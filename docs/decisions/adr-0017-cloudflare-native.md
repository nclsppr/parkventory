# ADR-0017 — Réécriture Cloudflare-native en une fois

- Statut : accepté
- Statut d’implémentation : candidat local et D1 preview ; activation publique absente
- Date : 2026-08-24
- Décideur : nclsppr
- Portée : application, données, identité, e-mail et déploiement
- Remplace : ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0007,
  ADR-0008, ADR-0009, ADR-0010, ADR-0014, ADR-0015 et ADR-0016

## Contexte

La chaîne React, Quarkus, PostgreSQL, images OCI, Atlas et DNS séparait une
modification frontend de sa mise en production. Une modification triviale
pouvait attendre plusieurs heures alors que le MVP doit surtout apprendre vite.
Auth0 et Resend avaient été sélectionnés mais aucun tenant, domaine ou secret
n’était provisionné ; leur retrait ne demande donc aucune migration utilisateur.

Le propriétaire accepte explicitement une réécriture complète, sans période où
les deux architectures restent actives.

## Décision

Adopter une seule application Cloudflare-native :

- React conservé pour l’interface existante ;
- Cloudflare Worker TypeScript et Hono pour `/api/v1` ;
- Workers Static Assets pour publier l’interface et l’API ensemble ;
- D1, une base par environnement, avec SQL et migrations sans ORM ;
- Cloudflare Email Service pour les magic links ;
- Turnstile pour l’anti-abus ;
- logs structurés Workers, sans données d’identité.

La migration est un big bang de code et un seul cutover public. Une préversion
isolée reste une gate de vérification, pas une phase d’architecture hybride.

Le MVP ne contient que la connexion, la déclaration et le partage d’une place,
la recherche, la réservation, l’annulation et le retrait. Invitations,
administration, outbox et statistiques sociales sont supprimées jusqu’à preuve
d’un besoin réel.

## Intégrité et sécurité

- le domaine professionnel est la frontière communautaire initiale ;
- les requêtes métier portent toujours `organization_id` côté serveur ;
- D1 impose une réservation confirmée unique par offre ;
- un trigger refuse les disponibilités qui se chevauchent ;
- magic links et sessions stockent uniquement des hashes ;
- les mutations exigent la même origine et les e-mails sont rate-limités ;
- aucune donnée de production existante n’est à migrer, la surface publique
  actuelle étant une démo statique.

## Conséquences

Positives : un seul langage serveur, une seule base, un seul déploiement, pas de
conteneur ni de VPS applicatif, et une préversion par Worker.

Négatives : dépendance forte à Cloudflare, SQL D1 moins riche que PostgreSQL,
Email Service encore en bêta et restauration à prouver avant production. Si les
besoins temporels deviennent plus complexes, ils devront être motivés par
l’usage avant de réintroduire une base externe.

## Retour arrière

Avant le cutover DNS, supprimer le Worker et la base preview suffit. Après le
cutover, restaurer les anciens enregistrements web conserve la démo Atlas ; les
records mail ne doivent jamais être modifiés par ce rollback.
