# Rôles et gouvernance

## Visiteur

Il comprend la promesse et demande un magic link avec une adresse
professionnelle. Aucune organisation n’est révélée avant vérification.

## Membre

Il rejoint l’organisation de son domaine, déclare sa place, publie ses propres
disponibilités, réserve celles de ses collègues et annule ses réservations avant
leur début.

## Opérateur Parkventory

Il déploie, diagnostique et traite manuellement les demandes de droits pendant
la bêta. Il n’utilise jamais un accès global pour un usage courant.

L’administration d’organisation n’a pas de surface dans le MVP. La colonne de
rôle reste réservée à une évolution ultérieure sans rendre un administrateur
nécessaire au démarrage. La configuration de co-marque est déjà isolée par
domaine dans D1 : une future route réservée au rôle `ADMIN` pourra modifier ses
jetons, son logo et son champ `enabled` sans changer le contrat de session ni
ouvrir l’accès aux configurations des autres organisations. Aucun endpoint ou
contrôle d’administration n’est livré à ce stade.
