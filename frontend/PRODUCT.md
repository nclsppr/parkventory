# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Les membres d'une organisation se connectent avec leur adresse professionnelle
  pour partager ou réserver une place au sein de leur tenant.
- L'opérateur propriétaire suit l'adoption de Parkventory, inspecte chaque tenant
  et chaque compte enregistré, puis rassemble les faits nécessaires à
  l'investigation d'un incident. Son identité exacte reste une configuration
  privée du Worker et n'est jamais versionnée dans le frontend.

## Product Purpose

Parkventory rend visibles les places temporairement libres d'une organisation et
permet à un collègue de les réserver sans double attribution. La console
d'administration complète ce parcours par une vue globale, factuelle et
inter-tenants de l'usage et de l'intégrité du service.

## Positioning

L'adresse vérifiée rattache automatiquement un membre à l'espace isolé de son
domaine professionnel. L'inventaire partagé reste interne à ce tenant, tandis
que l'opérateur autorisé dispose d'une lecture transversale explicitement
séparée des rôles d'organisation.

## Operating Context

Les membres utilisent les parcours connexion, partage et réservation. L'opérateur
utilise une console dense de suivi pour comparer les tenants, retrouver un
utilisateur, lire les événements métier récents, suivre l'évolution de l'usage et
repérer des incohérences de données avant une investigation ciblée par référence
d’incident, de requête ou d’entité. Chaque contrôle d’intégrité en anomalie ouvre
une liste bornée de lignes internes et chaque code d’erreur permet de regrouper
les occurrences de la même cause.

## Capabilities and Constraints

- Architecture active unique : React, Cloudflare Worker et D1, servis sur la
  même origine.
- Les données métier sont isolées par `organization_id` pour les parcours
  membres ; seules les routes godmode peuvent agréger plusieurs tenants.
- Chaque route godmode contrôle côté serveur la session et l'identité privée de
  l'opérateur. Le rôle `ADMIN` d'un tenant ne suffit jamais.
- La console affiche uniquement des données réelles de D1 et des diagnostics
  reproductibles. Elle n'invente ni activité, ni client, ni état de santé.
- La première livraison est une surface d'observation et d'investigation. Toute
  action correctrice sur les comptes ou les données reste une décision ouverte à
  spécifier, autoriser et auditer séparément.
- Les magic links restent à usage unique et les sessions restent serveur.

## Brand Commitments

Le nom Parkventory, le symbole canonique et la séparation entre partager et
réserver sont conservés. La console prolonge l'identité et les règles établies
dans `../DESIGN.md` sans exposer une co-marque tenant dans la vue globale.

## Evidence on Hand

Le schéma D1, les routes Worker, les tests du parcours MVP et les assets de marque
du dépôt sont les seules preuves disponibles. Il n'existe aucune métrique de
production, aucun seuil d'adoption et aucun incident utilisateur à fabriquer dans
l'interface.

## Product Principles

1. L'autorisation globale est prouvée côté serveur avant toute lecture.
2. Une synthèse mène toujours vers les lignes et événements qui l'expliquent.
3. Les données personnelles ne sont montrées que dans la console autorisée et ne
   sont jamais ajoutées aux logs techniques.
4. Un diagnostic distingue un fait observé, une anomalie calculée et une action
   encore non autorisée.
5. Une migration, un build vert et une production active restent trois états
   distincts.

## Accessibility & Inclusion

La cible reste WCAG 2.2 AA : navigation clavier complète, focus visible, données
non dépendantes de la couleur, tables denses dans un conteneur à défilement
horizontal accessible sur petit écran, et états de chargement, états vides et
erreurs annoncés aux technologies d'assistance. Les séries d’acquisition, d’usage
et d’incident disposent de motifs de trait distincts et d’une table textuelle.
