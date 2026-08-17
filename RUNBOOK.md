# RUNBOOK : première mise en production

Ce document prépare une future mise en production applicative. Il n'autorise
aucune action externe et reste non exécutable tant que la cible, les secrets,
les sauvegardes et les commandes canoniques ne sont pas décidés et testés. La
démo statique Atlas de l'ADR-0007 est une livraison distincte sans backend ni
donnée persistée ; elle ne satisfait aucun checkpoint de ce runbook. Le
producteur OCI de l'ADR-0008 prépare des digests applicatifs, mais ne contient
aucune commande d'activation ou de cutover.

## Nature du document

| Couche | Rôle |
| --- | --- |
| Norme | Project Foundation et profils activés dans `FOUNDATION.md` |
| Formulaire | Checkpoints propres à Parkventory |
| Preuve | `DELIVERY-EVIDENCE.md` ou une preuve datée ultérieure |

## Identité

| Champ | Valeur |
| --- | --- |
| Opération | Déployer une première version de Parkventory |
| Propriétaire | nclsppr |
| Suppléant | À nommer avant le pilote |
| Statut documentaire | Cible bloquée |
| Dernière vérification | Jamais exécutée |
| Environnement concerné | Production future non provisionnée |
| Décisions liées | ADR d'exploitation à créer avant F05 |
| Preuve de la dernière exécution | Aucune |

## État actuel et cible

### État actuel vérifié

| Élément | Valeur observée | Preuve | Vérifié le |
| --- | --- | --- | --- |
| Version, SHA ou digest | Application locale aux commits `e069d04` et `9f7b9be` ; aucun artefact de production | `STATUS.md` et état Git | 2026-07-30 |
| Configuration chargée | Aucune configuration de production | Arborescence du dépôt | 2026-07-30 |
| Santé et dépendances | Stack locale Compose à quatre services vérifiée ; aucune URL de production | `npm run compose:verify` | 2026-07-30 |
| Compatibilité PostgreSQL | V1 seule, V1 vers V2 et tests Quarkus réussis sur les images exactes 17.10 et 18.3 | `npm run postgres:verify` | 2026-08-12 |

### Cible

Servir le frontend React et l'API Quarkus sous une même origine HTTPS, avec
PostgreSQL 18 sauvegardé, livraison email, observabilité, artefacts immuables et
rollback vérifié.

### Limites et exclusions

- Aucun fournisseur, compte, domaine, région ou budget n'est choisi.
- Aucune commande de déploiement ou d'activation n'existe ; seules les commandes
  de construction et de validation du candidat sont disponibles.
- Aucune sauvegarde ni restauration n'est possible avant création de la base.
- Ce runbook ne permet pas de provisionner implicitement un service.
- La compatibilité PostgreSQL 17.10 ne remplace pas la décision de version, les
  rôles séparés, la restauration ni l'ADR d'exploitation.

## Cible exacte

| Dimension | Valeur attendue |
| --- | --- |
| Environnement | Production dédiée |
| Service ou composant | Frontend, API, PostgreSQL, email et reverse proxy |
| Hôte, cluster, compte ou tenant | Non défini ; toute action est interdite avant résolution |
| Région, namespace ou réseau | À décider selon résidence des données et latence |
| Données concernées | Identités professionnelles, organisations, places et intervalles |
| Cibles explicitement exclues | Poste local, dépôt Foundation, autres projets du workspace |

## Autorité et checkpoints

| Action sensible | Autorité requise | Checkpoint avant action | Condition d'arrêt |
| --- | --- | --- | --- |
| Achat ou création de service | Instruction explicite du propriétaire | Fournisseur, coût, région et compte affichés | Cible ou coût ambigu |
| Secret ou identité machine | Propriétaire et politique du fournisseur | Scope minimal et canal d'injection vérifiés | Secret visible dans Git ou sortie |
| DNS et TLS | Propriétaire du domaine | Zone, enregistrement et rollback confirmés | Domaine ou propagation non maîtrisés |
| Migration de données | Propriétaire de production | Sauvegarde et restauration isolée prouvées | Backup absent ou migration non testée |
| Déploiement | Autorité explicite de livraison | Digest, diff, santé initiale et rollback prêts | Artefact mutable ou environnement dégradé |

## Préconditions

- Configuration canonique : fichiers de déploiement et variables documentées,
  à créer avec l'ADR d'exploitation.
- Validation canonique : `./scripts/verify.sh`, étendue au contrat producteur,
  puis `npm run production:images:test` pour les images de production.
- Accès : rôles séparés et minimaux pour CI, runtime et administration.
- Secrets : références de gestionnaire, jamais valeurs dans ce dépôt.
- Fenêtre : définie avant toute migration ou bascule.
- Santé initiale : sauvegarde, base, email, DNS et monitoring vérifiés.
- Interdiction de commencer : cible non résolue, test rouge, rollback absent,
  restauration non prouvée ou autorité manquante.

## Sauvegarde et restauration isolée

| Champ | Valeur |
| --- | --- |
| Données à protéger | Base PostgreSQL et configuration de production |
| Commande de sauvegarde | À définir avec le fournisseur avant production |
| Identifiant et emplacement | Hors du service primaire, chiffré |
| Intégrité vérifiée par | Restauration dans une base isolée et contrôles métier |
| Chiffrement et accès | Chiffrement au repos et en transit, rôle de récupération séparé |
| Cible isolée de restauration | Projet ou instance de restauration sans trafic utilisateur |
| Commande de restauration | À définir et tester avant ouverture |
| Dernier test de restauration | Aucun, car aucune base n'existe |
| RPO et RTO | À fixer avec les besoins du pilote avant F05 |

## Contrôles avant exécution

1. Résoudre compte, région, domaine, services et digest sans exposer de secret.
2. Vérifier le commit, les lockfiles, la configuration et les migrations.
3. Exécuter `./scripts/verify.sh` dans l'environnement de build.
4. Produire un plan ou diff sans mutation.
5. Confirmer checkpoints, fenêtre, sauvegarde et rollback.
6. Restaurer la sauvegarde dans une cible isolée.

## Procédure cible

| Étape | Action | Commande canonique | Résultat attendu | Arrêt immédiat si |
| --- | --- | --- | --- | --- |
| 1 | Construire les artefacts | Workflow `Application release` de l'ADR-0008 | Digest `application-release` liant frontend, backend, intégration et inventaires au même SHA | Build non reproductible, scan rouge ou attestation absente |
| 2 | Vérifier migrations | À créer avec Flyway | Migration réussie sur copie représentative | Destruction non planifiée |
| 3 | Déployer sans bascule | À créer avec l'infrastructure | Nouvelle version saine mais non exposée | Probe ou logs en erreur |
| 4 | Basculer le trafic | À créer avec le reverse proxy | Même origine HTTPS active | TLS, session ou route incorrecte |
| 5 | Parcours critique | Test E2E de production sans PII réelle | Inscription contrôlée, partage et réservation | Fuite, collision ou email absent |
| 6 | Observer | Dashboard et supervision externe | Erreurs, latence et saturation sous seuils décidés | Seuil dépassé |

## Vérification après action

| Contrôle | Environnement | Résultat attendu | Preuve à conserver |
| --- | --- | --- | --- |
| Configuration | Production | Digest et variables attendus | Sortie nettoyée et SHA |
| Santé | Production | Liveness, readiness et PostgreSQL sains | Probes datées |
| Parcours critique | Production | Flux autorisé sans collision | Trace corrélée sans PII |
| Logs et métriques | Production | Aucun secret, alerte ou erreur inattendue | Fenêtre d'observation |
| Surface finale | Production | HTTPS, routes, assets et cookies corrects | URL, capture et digest |

La fenêtre d'observation et ses seuils doivent être décidés avant exécution.

## Rollback

### Déclencheurs

- échec du parcours critique ;
- fuite inter-tenant ou défaut d'autorisation ;
- erreur de migration non corrigible en sécurité ;
- taux d'erreur, latence ou saturation au-dessus des seuils décidés ;
- notification ou session incompatible avec la version précédente.

### Point de retour

| Champ | Valeur |
| --- | --- |
| Artefact précédent | Digest immuable à enregistrer avant bascule |
| Données concernées | Migrations et écritures depuis la bascule |
| Perte possible | À évaluer migration par migration |
| Autorité requise | Propriétaire de production |

### Procédure de rollback

1. Stopper la bascule et conserver les preuves.
2. Rediriger vers l'artefact précédent si le schéma reste compatible.
3. Sinon arrêter les écritures et appliquer la procédure de correction ou
   restauration explicitement autorisée.
4. Rejouer santé et parcours critique.

### Vérification du rollback

- santé et routes sur l'artefact précédent ;
- absence d'écritures perdues ou incohérentes ;
- état des notifications en outbox ;
- preuve datée dans un document de livraison ou d'incident.

## Incident et escalade

| Condition | Action sûre | Contact ou rôle | Preuve à conserver |
| --- | --- | --- | --- |
| Suspicion de fuite inter-tenant | Couper la surface concernée et préserver les logs | Propriétaire sécurité | Requêtes corrélées et versions |
| Secret exposé | Révoquer, faire tourner et nettoyer les sorties | Propriétaire plateforme | Chronologie sans valeur secrète |
| Double réservation | Bloquer les nouvelles réservations, ne pas réécrire l'historique | Propriétaire produit | Transactions et contrainte observée |
| Base indisponible | Passer en lecture sûre ou indisponibilité explicite | Propriétaire production | Probes, métriques et événements |

## Clôture

- Créer une preuve datée distincte pour chaque déploiement.
- Mettre `STATUS.md` à jour uniquement après vérification de l'URL.
- Aligner l'ADR d'exploitation et ce runbook si la cible change.
- Consigner risques et actions externes avec un propriétaire.
- Rejouer le runbook en préproduction avant le premier pilote et après tout
  changement majeur d'infrastructure.
