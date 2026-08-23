# RUNBOOK : exploitation Atlas et première mise en production applicative

Ce document couvre deux plans qui ne doivent jamais être confondus : la démo
statique actuellement servie par Atlas et la future application Compose. Il
n'autorise à lui seul aucune action externe. La démo statique de l'ADR-0007 est
active sans backend ni donnée persistée. Le producteur OCI de l'ADR-0008 publie
un candidat applicatif, mais son contrôleur central reste désactivé et le
cutover n'est pas livré.

## Nature du document

| Couche | Rôle |
| --- | --- |
| Norme | Project Foundation et profils activés dans `FOUNDATION.md` |
| Formulaire | Checkpoints propres à Parkventory |
| Preuve | `DELIVERY-EVIDENCE.md` ou une preuve datée ultérieure |

## Identité

| Champ | Valeur |
| --- | --- |
| Opération | Exploiter la démo statique puis préparer la première activation Compose |
| Propriétaire | nclsppr |
| Suppléant | À nommer |
| Statut documentaire | Démo statique opérationnelle ; production applicative préparée mais non activée |
| Dernière vérification | 2026-08-18 pour le plan statique ; jamais exécutée pour Compose |
| Environnement concerné | Atlas public pour la démo ; cible Atlas applicative non activée |
| Décisions liées | ADR-0007, ADR-0008, ADR-0010 à ADR-0015 |
| Preuve de la dernière exécution | `DELIVERY-EVIDENCE.md`, extension du 2026-08-18 |

## État actuel et cible

### État et dernier snapshot vérifié

Les références immuables ci-dessous décrivent le snapshot observé avant cette
consolidation documentaire. Elles ne sont pas une configuration à rejouer ni
une promesse d'état courant : tout push ultérieur sur `main`, y compris une
modification de documentation, publie de nouveaux candidats. Pour une
opération, résoudre le HEAD courant puis vérifier le workflow et l'état protégé
Atlas avec les commandes de ce runbook.

| Élément | Valeur observée | Preuve | Vérifié le |
| --- | --- | --- | --- |
| Source du snapshot | `origin/main` à `583e0e2b63701097aa4894ecc4fb3de8ad325346` | État Git et runs distants | 2026-08-18 |
| Démo statique au snapshot | Site `sha256:eb4596ac08e76bf59dc0c1ed6982f8cad6a25e98bc09b507790a78107e41553c` ; routes `sha256:47673d6906494ed128616357efe305e7be372e06022f4a2a794dcdc164ecbe7a` | Workflow VPS release `32071732693` et état Atlas | 2026-08-18 |
| HTTPS public au snapshot | `parkventory.com` HTTP 200 ; `www.parkventory.com` redirige une fois vers l'apex puis HTTP 200 | Probes HTTPS publiques | 2026-08-18 |
| Premier candidat applicatif | `application-release@sha256:384f736a81089a9a91a7ff55b21d552a6d803d65ab8e33daa296b54d990209a3` publié et attesté | Workflow Application release `32071732734` | 2026-08-18 |
| Contrôleur Compose | Code fusionné sur `vps-infra/main`, Parkventory `enabled: false`, convergence live de cette révision non prouvée | Contrats centraux statique et applicatif | 2026-08-18 |
| État dynamique | Aucun secret, aucune base, aucun service Compose et aucune migration Parkventory sur Atlas | État Atlas vérifié | 2026-08-18 |
| Compatibilité PostgreSQL | V1 seule, reprise V3 vers V5 non vide, suite Quarkus et parcours sous rôles migrateur/runtime non privilégiés réussis sur les images exactes 17.10 et 18.3 | `npm run postgres:verify` | 2026-08-23, preuve locale sans migration Atlas |

### Cible

Servir le frontend React et l'API Quarkus sous une même origine HTTPS, avec le
cluster partagé Atlas PostgreSQL 17.10 sauvegardé, livraison email,
observabilité, artefacts immuables et rollback vérifié.

### Limites et exclusions

- Le domaine et l'hôte statiques existent. Un candidat Auth0 EU est préparé,
  mais le fournisseur n’est pas approuvé et aucun tenant OIDC ni fournisseur email n’est provisionné ; aucune base
  Parkventory, aucun budget ni aucune cible de restauration ne sont décidés
  pour l'application.
- Le réconciliateur statique et le contrôleur Compose existent dans `vps-infra`.
  Le second reste désactivé et sa convergence live n'est pas prouvée ; aucune
  commande Parkventory ne peut effectuer le cutover plateforme.
- Aucune sauvegarde ni restauration n'est possible avant création de la base.
- Ce runbook ne permet pas de provisionner implicitement un service.
- PostgreSQL 17.10 est sélectionné par l'ADR-0015 ; cette décision ne remplace
  ni les rôles séparés, ni la sauvegarde, ni la restauration live.

## Cible exacte

| Dimension | Valeur attendue |
| --- | --- |
| Environnement | Atlas, application Compose dédiée derrière le Caddy partagé |
| Service ou composant | Frontend, API, PostgreSQL, email et reverse proxy |
| Hôte, cluster, compte ou tenant | Atlas pour le runtime ; base, identités et périmètres exacts à provisionner |
| Région, namespace ou réseau | Réseaux externes et identité de base à figer dans `vps-infra` avant activation |
| Données concernées | Identités professionnelles, organisations, places et intervalles |
| Cibles explicitement exclues | Poste local, dépôt Foundation, autres projets du workspace |

## Exploitation de la démo statique

### Sources de vérité et décision de déployer

Parkventory produit les artefacts, mais ne possède aucun secret VPS. Le dépôt
`vps-infra` possède le contrat d'activation, le workflow GitHub et l'état Atlas :

| Élément | État actuel | Effet |
| --- | --- | --- |
| `parkventory/main` | HEAD canonique résolu au moment du passage ; le premier snapshot automatisé portait `583e0e2b63701097aa4894ecc4fb3de8ad325346` | Source unique du candidat ; aucun repli vers un ancien SHA vert |
| Workflow `VPS release` | Run `32071732693` vert | Publie site/routes par digest et leurs attestations |
| Contrat statique `vps-infra` | Parkventory `enabled: true`, mode `temporary-static-demo` | Autorise la réconciliation statique |
| Contrat applicatif `vps-infra` | Parkventory `enabled: false`, mode `compose` | Interdit l'admission et l'activation dynamiques |
| Workflow `Deploy static releases` | Planifié toutes les dix minutes (best-effort, retards GitHub possibles) et sur dispatch manuel | Résout le HEAD, ses checks et les digests exacts, puis appelle la gate Atlas |

Le résolveur classe chaque application :

- `ready` : HEAD canonique confirmé, tous les checks observés terminés avec
  `success`, `neutral` ou `skipped`, checks requis exactement en `success`, puis
  manifests OCI site/routes valides résolus par digest ; le résolveur ne vérifie
  pas les attestations, Atlas les revérifie ensuite dans le job
  `Deploy parkventory` ;
- `pending` : checks encore en cours, artefact pas encore publié, HEAD modifié
  pendant la résolution, ou lecture GitHub/GHCR temporairement indisponible ;
  aucun déploiement, nouvelle tentative au tick suivant ;
- `blocked` : check rouge, incohérence de SHA ou manifeste OCI structurellement
  invalide ; corriger le producteur ou le contrat sans contourner la gate. Un
  rerun vert des checks du même SHA peut suffire ; une correction de contenu
  passe par un nouveau commit descendant ;
- `disabled` : entrée absente de la matrice, sans retrait automatique du site
  déjà actif.

La conclusion verte du seul job de résolution, ni même celle du job
`Deploy parkventory`, ne prouve à elle seule un déploiement. Le step SSH peut
rester vert après avoir ignoré le candidat si son HEAD est devenu indisponible
ou a changé. Exiger le job et le step `Request the exact static deployment`
réussis, l'absence de warning ou de skip canonique, le résumé `Atlas accepted`
pour le SHA exact, puis la sortie de la gate et l'état protégé Atlas qui
confirment soit l'activation, soit le no-op exact déjà actif et sain.

### Contrôle courant et dispatch

Ces lectures partent d'un poste déjà authentifié à GitHub :

```bash
gh run list --repo nclsppr/vps-infra --workflow deploy-static-releases.yml --limit 5
gh run view <run-id> --repo nclsppr/vps-infra --verbose
gh run view <run-id> --repo nclsppr/vps-infra --log

for url in https://parkventory.com/ https://www.parkventory.com/; do
  curl \
    --ipv4 \
    --proto '=https' \
    --tlsv1.2 \
    --fail \
    --silent \
    --show-error \
    --location \
    --max-redirs 1 \
    --output /dev/null \
    --write-out '%{url_effective} %{http_code} %{num_redirects} %{ssl_verify_result}\n' \
    "$url"
done
```

L'apex doit finir sur `https://parkventory.com/` avec `200`, zéro redirection et
un résultat TLS `0`. L'alias `www` doit finir sur le même apex avec `200`,
exactement une redirection et un résultat TLS `0`.

Après autorisation explicite, un nouveau passage peut être demandé sans changer
le candidat :

```bash
gh workflow run deploy-static-releases.yml --repo nclsppr/vps-infra --ref main
```

Sur Atlas, l'opérateur autorisé vérifie sans modifier :

```bash
sudo readlink /srv/www/parkventory/current
sudo cat /var/lib/vps-static/active/parkventory.json
sudo find /var/lib/vps-static/transactions -mindepth 1 -maxdepth 1 -print
sudo find /var/lib/vps-static/quarantine -mindepth 1 -maxdepth 2 -print
sudo systemctl is-active vps-public-static-edge.service
```

Un état sain contient le tuple attendu, un pointeur `current` vers sa release,
aucune transaction ouverte, aucune quarantaine pour ce tuple et un edge actif.

### Suspension, incident et recovery

Pour suspendre seulement les futures promotions, fusionner dans `vps-infra` un
commit revu qui place l'entrée statique Parkventory à `enabled: false`. Cela ne
retire pas le site déjà servi. Son retrait ou le transfert de sa route est une
opération plateforme distincte ; ne jamais supprimer manuellement `current`,
`active/`, `transactions/` ou `quarantine/`.

Si une transaction reste ouverte, arrêter les nouvelles activations, conserver
les journaux et exécuter, avec l'autorité Atlas, la recovery installée :

```bash
sudo systemctl start vps-static-recover.service
sudo systemctl status vps-static-recover.service --no-pager
```

Recontrôler ensuite le tuple actif, les transactions, la quarantaine, l'edge et
les deux URL publiques. Une entrée en quarantaine ne se supprime pas pour
forcer un rejeu : corriger la cause et publier un nouveau candidat par digest.
La recovery s'exécute aussi au démarrage avant l'edge public.

### Rotation de la clé de déploiement

La rotation appartient exclusivement à `vps-infra` : générer une nouvelle clé
hors Git, ajouter d'abord sa clé publique à `vps_deploy_authorized_keys` en
conservant l'ancienne, converger Atlas, installer la nouvelle clé privée dans
le secret de l'environnement GitHub `static-production`, puis prouver un
dispatch complet. Retirer l'ancienne clé seulement dans une opération séparée,
reconverger et refaire la preuve. Une rotation de clé d'hôte est différente :
son empreinte doit être vérifiée par la console fournisseur avant la mise à jour
du `known_hosts` protégé.

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
- Exclusion mutuelle : promotion statique désactivée, aucun job statique en
  cours et transfert de route planifié sous le verrou partagé ; ne jamais
  activer simultanément les contrats statique et Compose.
- Interdiction de commencer : cible non résolue, test rouge, rollback absent,
  restauration non prouvée ou autorité manquante.

## Préconditions du candidat OIDC Auth0 EU

L’[ADR-0010 acceptée](docs/decisions/adr-0010-auth0-email-otp-production.md)
décrit le contrat préparé. Le choix technique ne remplace pas l'acceptation du
sous-traitant, de la région, du coût et des conditions au moment du
provisionnement. Ce dépôt ne contient ni compte ni tenant.

### Contrat distant à vérifier avant injection des secrets

1. Créer ou sélectionner un tenant Auth0 dont la région européenne, le compte
   propriétaire, le coût et le traitement des données ont été acceptés.
2. Créer une Regular Web Application confidentielle, jamais une SPA publique.
3. Activer Passwordless Email et Universal Login avec vérification par OTP.
   Le magic link du Classic Login n’est pas admis par ce contrat.
4. Autoriser exactement le callback
   `https://parkventory.com/api/v1/auth/oidc/callback`.
5. Relever sans secret l’issuer HTTPS avec slash terminal et le client ID.
   `PARKVENTORY_OIDC_AUTH_SERVER_URL` et `PARKVENTORY_OIDC_ISSUER` doivent être
   strictement identiques.
6. Confirmer que les ID tokens signés RS256 contiennent `sub`, `email` et le
   booléen `email_verified=true`, avec l’audience égale au client ID.

### Injection locale à Atlas

Le Compose reçoit les valeurs non secrètes par son environnement :

- `PARKVENTORY_OIDC_AUTH_SERVER_URL` ;
- `PARKVENTORY_OIDC_ISSUER` ;
- `PARKVENTORY_OIDC_CLIENT_ID`.

Le runtime exige les fichiers réguliers non symboliques suivants, chacun sur
une ligne imprimable :

- `/etc/vps/secrets/parkventory/parkventory-oidc-client-secret` ;
- `/etc/vps/secrets/parkventory/parkventory-oidc-state-secret` ;
- `/etc/vps/secrets/parkventory/parkventory-oidc-token-encryption-secret`.

Le secret client provient d’Auth0. Les secrets de state et de token state sont
deux valeurs aléatoires indépendantes d’au moins 32 caractères. Ne jamais les
afficher dans une commande, un ticket, un log ou un diff. Leur création et leur
transfert appartiennent à la procédure protégée de `vps-infra`.

Un secret absent, multiligne, trop court, un issuer non HTTPS ou deux URL OIDC
différentes font sortir l’entrypoint avec le code `78`. Les expressions Quarkus
obligatoires font aussi échouer le JAR si l’entrypoint est contourné. Il est
interdit de corriger cet échec avec une valeur factice en production.

### Recette avant trafic réel

- exécuter `npm run production:check` puis
  `npm run production:images:test` sur le SHA exact ;
- vérifier que `/api/v1/auth/requests` et `/api/v1/auth/verify` répondent `404`
  dans l’image de production ;
- vérifier que `/api/v1/auth/oidc/login` redirige vers l’issuer exact avec
  `connection=email`, `prompt=login`, PKCE S256, nonce et state ;
- terminer un OTP avec une adresse de test autorisée, puis vérifier les cookies
  OIDC et `parkventory_session` `HttpOnly`, `Secure` et `SameSite=Lax` ;
- vérifier que l’issuer, l’audience, l’email non vérifié et un state altéré sont
  refusés sans créer de compte, membership ou session ;
- envoyer une invitation de test et vérifier que son email pointe vers
  `/api/v1/auth/oidc/login`, sans token Parkventory ni création de
  `magic_link_request` ;
- prouver la séquence identité vérifiée → utilisateur interne → membership actif
  → tenant → `SET LOCAL` avant toute requête RLS ;
- déconnecter avec puis sans cookie OIDC : l’`app_session` et les cookies locaux
  doivent être révoqués dans les deux cas, et un second appel doit rester
  idempotent.
  Le cookie Auth0 peut rester : vérifier qu’une nouvelle connexion redemande
  l’email OTP grâce à `connection=email` et `prompt=login`. Ne pas présenter ce
  résultat comme un logout global ; tout futur SSO exige `/v2/logout`, un
  `returnTo` HTTPS allowlisté et une recette distincte.

En cas d’indisponibilité ou de configuration incomplète, suspendre les nouvelles
connexions ou laisser Compose désactivé. Ne jamais réactiver les magic links
locaux sur la surface publique.

## Transport e-mail Resend

L'[ADR-0014](docs/decisions/adr-0014-resend-email-beta-publique.md) retient un
seul transport pour l'OTP Auth0 et les messages Quarkus. Le sous-domaine
`notifications.parkventory.com` évite de modifier le courrier OVH déjà attaché
au domaine racine.

### Contrat distant

1. Créer ou sélectionner le compte Resend approuvé par le propriétaire.
2. Ajouter `notifications.parkventory.com`, puis publier exactement les valeurs
   SPF, DKIM et MX générées par le fournisseur sans toucher aux enregistrements
   racine.
3. Attendre le statut `verified` et contrôler les valeurs depuis au moins deux
   résolveurs publics.
4. Créer deux clés distinctes : une pour l'intégration Auth0, une pour le relais
   SMTP du backend. Ne jamais les copier dans ce dépôt ou un log.
5. Configurer Auth0 avec l'intégration Resend native et l'expéditeur
   `Parkventory <no-reply@notifications.parkventory.com>`.
6. Injecter sur Atlas les valeurs non secrètes `smtp.resend.com`, `587` et le
   même expéditeur. Les fichiers `parkventory-smtp-username` et
   `parkventory-smtp-password` contiennent respectivement `resend` et la clé
   SMTP dédiée.
7. Laisser le suivi d'ouverture et de clic désactivé et surveiller les limites
   de 100 e-mails par jour et 3 000 par mois de l'offre gratuite initiale.

### Recette avant trafic réel

- envoyer un OTP Auth0 à deux boîtes de fournisseurs différents et terminer le
  code flow ;
- envoyer une invitation Quarkus et vérifier son expéditeur, son sujet et son
  lien HTTPS sans token applicatif ;
- vérifier SPF et DKIM dans les en-têtes reçus ;
- provoquer un échec SMTP avec une clé de recette révoquée et vérifier une
  alerte sans secret ni adresse destinataire dans les journaux ;
- remettre uniquement la clé valide par la procédure protégée, puis prouver un
  nouvel envoi réussi.

Le transport Auth0 intégré, limité et non destiné à la production, n'est pas un
fallback public. Si Resend ou son domaine n'est pas prêt, garder Compose
désactivé.

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
| RPO et RTO bêta | RPO 24 h ; RTO cible 24 h, sans garantie contractuelle |

## Contrôles avant exécution

1. Résoudre compte, région, domaine, services et digest sans exposer de secret.
2. Vérifier le commit, les lockfiles, la configuration et les migrations.
3. Exécuter `./scripts/verify.sh` dans l'environnement de build.
4. Produire un plan ou diff sans mutation.
5. Confirmer checkpoints, fenêtre, sauvegarde et rollback.
6. Restaurer la sauvegarde dans une cible isolée.
7. Désactiver par commit descendant la promotion statique Parkventory dans
   `vps-infra`, sans toucher manuellement à l'état actif.
8. Prouver qu'aucune réconciliation statique n'est en cours et que le cutover
   central transfère exclusivement la route et l'état sous le verrou partagé.

## Procédure cible

| Étape | Action | Commande canonique | Résultat attendu | Arrêt immédiat si |
| --- | --- | --- | --- | --- |
| 1 | Construire les artefacts | Workflow `Application release` de l'ADR-0008 | Digest `application-release` liant frontend, backend, intégration et inventaires au même SHA | Build non reproductible, scan rouge ou attestation absente |
| 2 | Provisionner la cible | À livrer dans `vps-infra` | Réseaux, rôles PostgreSQL, secrets, sauvegarde et restauration prouvés | Secret manquant, rôle trop large ou restauration rouge |
| 3 | Suspendre la promotion statique | Commit revu dans `vps-infra` | Parkventory statique `enabled: false`, Compose encore `enabled: false`, aucun run en cours | Les deux modes pourraient devenir actifs ensemble |
| 4 | Préparer le transfert exclusif | Procédure plateforme à livrer | Route Caddy attestée, état statique transférable et verrou partagé acquis | État statique actif non pris en charge ou route divergente |
| 5 | Vérifier migrations | Migrateur dédié du bundle | Migration réussie sur copie représentative et compatible avec les deux runtimes | Destruction non planifiée ou retour runtime impossible |
| 6 | Déployer sans trafic | Contrôleur Compose central après convergence live prouvée | Nouvelle version saine mais non exposée | Probe ou logs en erreur |
| 7 | Basculer le trafic | Cutover `vps-infra` revu sous le même verrou | Une seule origine HTTPS détenue par Compose, aucun propriétaire statique concurrent | TLS, session, route ou exclusivité incorrecte |
| 8 | Parcours critique | Test E2E de production sans PII réelle | Inscription contrôlée, partage et réservation | Fuite, collision ou email absent |
| 9 | Observer | Dashboard et supervision externe | Erreurs, latence et saturation sous seuils décidés | Seuil dépassé |

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
2. Si l'activation n'est pas validée, laisser la transaction restaurer le
   runtime et la route précédents ; ne pas manipuler directement les pointeurs.
3. Après une activation validée, publier une nouvelle release issue d'un commit
   descendant qui restaure le comportement voulu, si le schéma reste compatible
   avec le runtime courant et le précédent.
4. Sinon arrêter les écritures et appliquer la procédure de correction ou
   restauration explicitement autorisée.
5. Rejouer santé et parcours critique.

Le retour de Compose vers la démo statique est lui aussi un cutover plateforme :
il exige un propriétaire unique de la route sous le verrou partagé. Il ne se
fait ni en réactivant simultanément les deux contrats, ni en repointant
manuellement `/srv/www/parkventory/current`.

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
- Rejouer le runbook dans une cible isolée avant le cutover public et après tout
  changement majeur d'infrastructure.
