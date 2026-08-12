# ADR-0007 : démo statique distincte sur Atlas

- Statut : accepté
- Statut d'implémentation : artefact et intégration préparés, déploiement non exécuté
- Date : 2026-08-12
- Dernière vérification : build racine et artefacts déterministes vérifiés le 2026-08-12
- Propriétaire : nclsppr
- Domaine : démonstration publique et exploitation
- Remplace : aucune
- Remplacé par : aucune

## Contexte

Parkventory possède une démo statique signalée sur GitHub Pages sous
`/parkventory/`. Le backend local ne satisfait pas encore les conditions de
production : OIDC, isolation RLS, rôles PostgreSQL, email externe, métriques,
sauvegarde et restauration restent ouverts.

Atlas peut servir un artefact statique sans ajouter de runtime applicatif. Le
domaine cible `parkventory.com` doit alors montrer la même démo explicite, sans
transformer les données fictives en capacité de production et sans envoyer de
requête à un faux backend.

## Décision

Ajouter une cible de livraison statique propre à Atlas :

- `npm run pages:build` conserve la base `/parkventory/` pour GitHub Pages ;
- `npm run atlas:build` construit la même démo avec la base `/` ;
- les deux cibles activent obligatoirement `VITE_DEMO_MODE=true` ;
- les routes directes `/app/`, `/app/partager/`, `/app/trouver/` et
  `/auth/callback/` contiennent le shell statique ;
- `scripts/build-vps-release.sh` produit une archive et un inventaire de routes
  déterministes, liés au commit source ;
- GitHub Actions publiera les deux objets OCI par digest et attestera leur
  provenance avant toute promotion Atlas ;
- le Caddy partagé d'Atlas servira cet artefact. Parkventory n'ajoute ni Caddy,
  ni conteneur, ni port hôte, ni secret.

Cette surface reste une démo. Elle ne déploie pas Quarkus, PostgreSQL, Mailpit
ou un fournisseur d'identité. L'ouverture du backend reste soumise aux gates de
production existantes.

## Conséquences

### Positives

- le domaine peut montrer le produit sans exposer un backend incomplet ;
- GitHub Pages reste disponible et son chemin de base ne change pas ;
- Atlas reçoit un contenu immuable vérifiable et peut revenir au digest
  précédent ;
- aucune donnée personnelle, session ou écriture distante n'est créée.

### Négatives

- deux chemins de base doivent rester vérifiés ;
- une action présentée dans la démo ne persiste pas après rechargement ;
- le domaine public ne constitue pas une preuve de préparation au pilote.

### Risques et contrôles

| Risque | Contrôle |
| --- | --- |
| Confondre démo et production | Libellés `Démo publique`, `demo: true` et documentation explicite |
| Régression GitHub Pages | Builds `/parkventory/` et `/` exécutés par la gate complète |
| Artefact mutable | Références OCI par digest, inventaire SHA-256 et provenance GitHub |
| Route directe cassée | Entrées HTML et inventaire exigés pour les quatre routes applicatives |
| Backend incomplet exposé | Aucun service applicatif, aucun port et aucune route API dans ce lot |

## Vérification

- tests React en mode démo ;
- builds Vite sous `/parkventory/` et `/` ;
- comparaison byte à byte de deux archives et de deux inventaires construits
  depuis le même arbre ;
- contrôle des routes et du dépôt source dans l'inventaire ;
- validation séparée du contrat Atlas dans `vps-infra` avant déploiement.

## Retour arrière

Conserver GitHub Pages comme surface de démo. Sur Atlas, réactiver le digest
statique précédent ou retirer seulement la route Parkventory du Caddy partagé.
Aucun volume, schéma ou secret Parkventory n'est concerné.

## Références

- [Architecture cible](../architecture/overview.md)
- [Runbook de première mise en production](../../RUNBOOK.md)
- [ADR-0003 : OIDC passwordless et isolation métier](adr-0003-authentication-et-isolation.md)
