# ADR-0007 : démo statique distincte sur Atlas

- Statut : accepté
- Statut d'implémentation : démo statique active sur Atlas et automatiquement réconciliée
- Date : 2026-08-12
- Dernière vérification : snapshot d'activation de la release `583e0e2` et HTTPS public vérifiés le 2026-08-18, avant consolidation documentaire
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
- GitHub Actions publie les deux objets OCI par digest et atteste leur
  provenance avant toute promotion Atlas ;
- le Caddy partagé d'Atlas sert cet artefact. Parkventory n'ajoute ni Caddy,
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

### État opérationnel vérifié

La première réconciliation complète après la fusion de la PR #4 porte le SHA
source `583e0e2b63701097aa4894ecc4fb3de8ad325346`. Le workflow VPS release
`32071732693` a publié et attesté les références exactes suivantes :

- site :
  `ghcr.io/nclsppr/parkventory-static-site@sha256:eb4596ac08e76bf59dc0c1ed6982f8cad6a25e98bc09b507790a78107e41553c` ;
- routes :
  `ghcr.io/nclsppr/parkventory-static-routes@sha256:47673d6906494ed128616357efe305e7be372e06022f4a2a794dcdc164ecbe7a`.

Atlas a activé ce tuple. `https://parkventory.com/` répond HTTP 200 et
`https://www.parkventory.com/` redirige une fois vers l'apex. Le contrat
statique central classe Parkventory `temporary-static-demo` et l'active ; le
contrat Compose parallèle garde Parkventory désactivé. Ces états doivent rester
mutuellement exclusifs.

Ce tuple est la preuve historique du premier rollout automatique. Il n'est pas
une référence à rejouer : chaque push ultérieur sur `main`, y compris
documentaire, produit de nouveaux digests et peut remplacer le tuple actif. Le
HEAD, le workflow de réconciliation et l'état protégé Atlas font foi pour une
lecture courante.

## Retour arrière

Conserver GitHub Pages comme surface de démo. Un échec pendant l'activation
Atlas restaure automatiquement le pointeur précédent avant de classer le
candidat. Après une activation réussie, le rollback normal consiste à publier
sur `main` un nouveau commit descendant qui rétablit le contenu voulu, puis à
laisser la réconciliation produire et activer ses nouveaux digests. Ne pas
repositionner manuellement `current` vers un ancien digest : le contrôleur
refuse le repli vers un SHA non descendant et le prochain passage réappliquerait
le HEAD canonique.

Le retrait de la route ou son transfert vers Compose est une opération
`vps-infra` distincte, sous le verrou de déploiement partagé. Aucun volume,
schéma ou secret Parkventory n'est concerné par le seul rollback statique.

## Références

- [Architecture cible](../architecture/overview.md)
- [Runbook de première mise en production](../../RUNBOOK.md)
- [ADR-0003 : OIDC passwordless et isolation métier](adr-0003-authentication-et-isolation.md)
