# Parkventory

## Résultat attendu

Un collègue vérifie son adresse professionnelle, rejoint automatiquement
l’espace de son domaine, déclare une place assignée, la partage pour un créneau
et permet à un autre membre de la réserver. Deux réservations concurrentes ne
produisent qu’un seul gagnant. L’opérateur Parkventory dispose séparément d’une
console globale en lecture seule pour suivre les tenants, les comptes, l’usage et
les incidents sans pouvoir agir comme un membre.

## Périmètre MVP

Inclus :

- magic link à usage unique, session serveur et protection Turnstile ;
- organisation créée ou rejointe depuis le domaine professionnel ;
- une place assignée par membre ;
- publication d’un créneau dans les 7 prochains jours, dans le fuseau du
  parking (`Europe/Paris` par défaut) ;
- recherche, réservation idempotente, annulation et retrait avant le début ;
- isolation de toutes les données par organisation ;
- interface, erreurs, magic links et pages publiques en français, anglais,
  allemand et luxembourgeois, avec URLs localisées et SEO cohérent ;

Exclus : invitations, administration autonome des organisations, mutations de
données depuis la console globale, plan de parking, récurrence, notifications
métier, SSO, paiement et application native.

## Console opérateur

La console `/admin` est une capacité d’exploitation distincte du MVP membre. Son
unique identité est configurée par digest secret côté Worker. Elle agrège les
organisations `TENANT`, les utilisateurs enregistrés et un registre d’activité
redacted ; elle n’accorde aucun droit global aux rôles `ADMIN` des tenants. Le
contrat détaillé et les gates de livraison vivent dans l’ADR-0018.

## Architecture canonique

```text
Navigateur
  -> Cloudflare Worker, même origine
     -> assets React
     -> API /api/v1
        -> D1 : données tenant et registre d’activité redacted
        -> Email Service pour les magic links
        -> Turnstile pour l’anti-abus
```

Un `wrangler deploy` publie le Worker et les assets ensemble. Il n’existe plus
de backend Java, de Compose, de PostgreSQL, d’image OCI ou de release Atlas dans
la source active.

## Sources de vérité

| Sujet | Source |
| --- | --- |
| Worker et API | `worker/src/` |
| Données | `migrations/` |
| Déploiement | `wrangler.jsonc` |
| Interface | `frontend/` et `DESIGN.md` |
| Architecture | `docs/architecture/`, ADR-0017 et ADR-0018 |
| État vérifié | `STATUS.md` |
| Exploitation | `RUNBOOK.md` |

## Commandes

```bash
npm ci
npm run db:migrate:local
npm run dev
npm run verify
```

Cette commande vérifie aussi les types de bindings générés et compile les cibles
Wrangler de préversion et de production en dry-run, sans upload.

Le développement local sert l’application sur `http://127.0.0.1:8787`. Créer
`.dev.vars` en mode `0600` depuis `.dev.vars.example` et ne jamais le committer.
