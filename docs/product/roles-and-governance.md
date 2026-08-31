# Rôles et gouvernance

## Visiteur

Il comprend la promesse et demande un magic link avec une adresse
professionnelle. Aucune organisation n’est révélée avant vérification.

## Membre

Il rejoint l’organisation de son domaine, déclare sa place, publie ses propres
disponibilités, réserve celles de ses collègues et annule ses réservations avant
leur début.

## Opérateur Parkventory

Il déploie, diagnostique et gouverne les administrateurs de tenant pendant la bêta. Une identité exacte,
configurée uniquement sous forme de digest secret côté Worker, rejoint
l’organisation interne `SYSTEM` avec le rôle `ADMIN`. Elle seule peut ouvrir la
console globale, consulter tenants, comptes, métriques, activité redacted et
incidents, et nommer ou révoquer un administrateur de tenant. Elle n’utilise jamais cet accès global pour un
usage courant et ne peut pas partager ou réserver une place.

## Administrateur d’organisation

Le godmode attribue le rôle `ADMIN` à une adhésion précise. Ce membre ouvre
`/app/admin` et consulte uniquement les statistiques et membres du tenant porté
par sa session ; aucun identifiant de tenant fourni par le client n’est accepté.
Il peut activer la co-marque, choisir deux couleurs dont les contrastes sont
dérivés côté serveur, autoriser l’affichage d’un logo déjà approuvé et effacer
l’adresse d’un membre simple. Il ne peut ni nommer un autre administrateur, ni
agir sur un autre tenant, ni effacer son propre compte ou celui d’un admin.

Les deux autorités ne sont jamais interchangeables : le godmode exige le digest
exact, `organization.kind = 'SYSTEM'`, le rôle `ADMIN` et une session serveur
valide. Le frontend ne décide pas de cette autorisation.
