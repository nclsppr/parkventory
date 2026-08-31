# Rôles et gouvernance

## Visiteur

Il comprend la promesse et demande un magic link avec une adresse
professionnelle. Aucune organisation n’est révélée avant vérification.

## Membre

Il rejoint l’organisation de son domaine, déclare sa place, publie ses propres
disponibilités, réserve celles de ses collègues et annule ses réservations avant
leur début.

## Opérateur Parkventory

Il déploie et diagnostique le service pendant la bêta. Une identité exacte,
configurée uniquement sous forme de digest secret côté Worker, rejoint
l’organisation interne `SYSTEM` avec le rôle `ADMIN`. Elle seule peut ouvrir la
console globale en lecture seule et consulter tenants, comptes, métriques,
activité redacted et incidents. Elle n’utilise jamais cet accès global pour un
usage courant et ne peut pas partager ou réserver une place.

## Administrateur d’organisation

L’administration autonome d’une organisation n’a pas de surface dans le MVP. La
colonne `membership.role` reste locale au tenant : même un rôle `ADMIN` de tenant
ne peut lire aucune donnée globale. La configuration de co-marque reste isolée
par domaine dans D1 ; une future route tenant pourra modifier ses jetons, son
logo et son champ `enabled` sans ouvrir les autres organisations.

Les deux autorités ne sont jamais interchangeables : le godmode exige le digest
exact, `organization.kind = 'SYSTEM'`, le rôle `ADMIN` et une session serveur
valide. Le frontend ne décide pas de cette autorisation.
