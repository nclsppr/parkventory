# Parkventory

Parkventory permet aux collègues d'une même entreprise de partager leur place
de parking pendant une absence, puis de réserver une disponibilité sans qu'un
administrateur soit nécessaire au démarrage.

Le dépôt contient désormais une landing page et un tableau de bord React,
une API locale Java 25 / Quarkus 3.33.3 LTS et un schéma PostgreSQL 18 migré
par Flyway. En local, l'authentification par lien magique, les sessions, les
places, les partages, les réservations, les invitations et les notifications
sont réellement branchés sur PostgreSQL et Mailpit.

## Documentation

La documentation produit est publiée avec Nimbus sur GitHub Pages. Elle décrit
la vision, les parcours, les rôles, les règles métier et le choix d'apparence
clair ou sombre, sans installation locale.

**[Ouvrir la documentation Nimbus](https://nclsppr.github.io/parkventory/docs/)**

## Voir les surfaces Pages

- [landing publique](https://nclsppr.github.io/parkventory/) ;
- [application publique](https://nclsppr.github.io/parkventory/app).

GitHub Pages sert le frontend en mode démo statique et la documentation Nimbus.
Les actions du frontend y sont simulées dans le navigateur : aucun compte n'est
créé, aucun e-mail n'est envoyé et aucune donnée n'est persistée. Nimbus publie
uniquement la collection produit classée `public` ; les documents internes, les
décisions et les références restent absents de l'artefact Pages.

## Démarrer en local

Le graphe applicatif intégré exige Docker avec Docker Compose `2.20.0` ou plus
récent, ou OrbStack compatible ; aucun runtime Java ou Node applicatif n'est
lancé directement sur l'hôte. `npm run dev` sert de raccourci vers le script
Compose et `mise` reste requis pour la gate hôte complète.

```bash
npm run dev
```

La commande démarre PostgreSQL, Mailpit, Quarkus et Vite dans Compose, attend leurs
healthchecks, puis suit les logs applicatifs :

- landing : `http://127.0.0.1:5173/` ;
- application : `http://127.0.0.1:5173/app` ;
- boîte de réception Mailpit : `http://127.0.0.1:8025/` ;
- santé Quarkus : `http://127.0.0.1:8080/q/health/ready` ;
- Swagger UI : `http://127.0.0.1:8080/q/swagger-ui`.

Pour exercer le parcours :

1. saisir une adresse professionnelle de test, par exemple
   `alex@entreprise.test` ;
2. ouvrir l'e-mail dans Mailpit et suivre le lien à usage unique ;
3. déclarer une place puis la partager ;
4. se déconnecter et recommencer avec une seconde adresse du même domaine pour
   réserver la place.

Les comptes, sessions et données métier restent dans les volumes locaux
Compose. Aucun e-mail ne quitte la machine.

Un `Ctrl-C` exécute `docker compose down` et conserve les volumes. Pour supprimer
volontairement uniquement la base locale :

```bash
npm run db:reset
```

## Vérifier

Avec Docker démarré :

```bash
mise exec -- npm run verify
```

Cette gate rejoue le catalogue et le build Nimbus, le contrôle Foundation de
Compose, l'audit npm, les tests et le build React, les tests Quarkus contre un
PostgreSQL éphémère, puis le parcours intégré PostgreSQL, Mailpit, Quarkus et
Vite dans un projet Compose isolé.

## Périmètre actuel

- React 19, TypeScript 7 et Vite 8 pour la landing et l'application responsive ;
- thèmes sombre et clair sélectionnables, choix persistant, contrastes testés
  et parcours clavier vérifiés ;
- Java 25 et Quarkus LTS pour `/api/v1`, SmallRye Health et OpenAPI ;
- PostgreSQL 18 avec contraintes temporelles d'affectation et de réservation ;
- authentification locale par lien magique, cookie de session `HttpOnly` et
  rattachement communautaire par invitation exacte ou domaine ;
- API persistante pour déclarer, partager, réserver et inviter, avec
  idempotence et outbox transactionnelle ;
- Mailpit pour capturer en local les liens, invitations et notifications ;
- Compose pour PostgreSQL, Mailpit, Quarkus et Vite, avec images épinglées par
  digest, healthchecks et smoke test ;
- runtimes hôte épinglés par `mise.toml` / `mise.lock` ;
- démo frontend statique publiée par le workflow GitHub Pages ;
- images générées propres au projet, avec source et provenance documentées ;
- aucun fournisseur OIDC ou email de production et aucun déploiement de
  production.

## Documentation essentielle

- [documentation Nimbus publique](https://nclsppr.github.io/parkventory/docs/) : vision, parcours, rôles et règles produit ;
- [`PROJECT.md`](PROJECT.md) : contrat stable et architecture ;
- [`STATUS.md`](STATUS.md) : état réellement vérifié ;
- [`ROADMAP.md`](ROADMAP.md) : séquencement et sorties ;
- [`DESIGN.md`](DESIGN.md) : direction artistique et règles UX ;
- [`docs/product/vision.md`](docs/product/vision.md) : vision produit ;
- [`docs/product/roles-and-governance.md`](docs/product/roles-and-governance.md) : fonctionnement communautaire ;
- [`docs/architecture/domain-model.md`](docs/architecture/domain-model.md) : modèle et invariants ;
- [`docs/references/visual-sources.md`](docs/references/visual-sources.md) : références et provenance ;
- [`DELIVERY-EVIDENCE.md`](DELIVERY-EVIDENCE.md) : preuves et limites de livraison.

## Statut juridique

Le dépôt public ne contient actuellement aucun fichier de licence. Son
accessibilité ne vaut pas autorisation de réutilisation. Les références JPEG
fournies restent locales et sont ignorées par Git ; l'application sert
uniquement l'illustration originale générée pour Parkventory.
