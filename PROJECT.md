# Parkventory

## Résultat attendu

Un collègue vérifie son adresse professionnelle, rejoint automatiquement
l’espace de son domaine, déclare une place assignée, la partage pour un créneau
et permet à un autre membre de la réserver. Deux réservations concurrentes ne
produisent qu’un seul gagnant.

## Périmètre MVP

Inclus :

- magic link à usage unique, session serveur et protection Turnstile ;
- organisation créée ou rejointe depuis le domaine professionnel ;
- une place assignée par membre ;
- publication d’un créneau dans les 7 prochains jours, fuseau Europe/Paris ;
- recherche, réservation idempotente, annulation et retrait avant le début ;
- isolation de toutes les données par organisation.

Exclus : invitations, rôles d’administration avancés, plan de parking,
récurrence, notifications métier, SSO, paiement et application native.

## Architecture canonique

```text
Navigateur
  -> Cloudflare Worker, même origine
     -> assets React
     -> API /api/v1
        -> D1
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
| Architecture | `docs/architecture/` et ADR-0017 |
| État vérifié | `STATUS.md` |
| Exploitation | `RUNBOOK.md` |

## Commandes

```bash
npm ci
npm run db:migrate:local
npm run dev
npm run verify
```

Le développement local sert l’application sur `http://127.0.0.1:8787`. Copier
`.dev.vars.example` vers `.dev.vars` et ne jamais committer ce dernier.
