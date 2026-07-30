# Questions ouvertes

Ces questions ne modifient pas les décisions déjà acceptées. Elles indiquent ce
qui doit être tranché avant la phase nommée, sans bloquer la documentation F01.

## Priorité critique

| Question | Pourquoi elle compte | Décision attendue avant | Propriétaire |
| --- | --- | --- | --- |
| Quel fournisseur OIDC passwordless ? | Sécurité, région, coût, délivrabilité et retrait | Avant F05/production ; Mailpit couvre uniquement le local | nclsppr |
| Quels domaines personnels ou jetables refuser ? | Évite un tenant public et les abus | F03 | nclsppr |
| Comment traiter filiales, domaines partagés et prestataires ? | Un domaine n'égale pas toujours une société | F03 | nclsppr |
| Quelle preuve exacte pour le premier administrateur ? | Empêche l'escalade du premier inscrit | F06, prototype possible en F03 | nclsppr |
| Quelle politique de rétention et suppression ? | Données professionnelles et habitudes de présence | F03 | nclsppr |
| Qui peut déclarer ou contester une place assignée ? | Évite les offres illégitimes | F04 | nclsppr |
| Quand un titulaire peut-il annuler une offre réservée ? | Impact direct sur le collègue réservataire | F04 | nclsppr |

## Produit

| Question | Hypothèse de travail | Preuve recherchée |
| --- | --- | --- |
| Langue initiale de l'interface | Français, architecture prête pour i18n | Choix du premier pilote |
| Pays et juridiction du pilote | France | Confirmation du propriétaire |
| Granularité d'une réservation | Journée et intervalle libre | Entretiens et prototype |
| Réserver sa propre place | Masqué par défaut | Cas d'usage réel |
| Réservation partielle d'une offre | Autorisée si incluse | Test de compréhension |
| Attributs PMR, électrique, visiteur | Informatifs puis règles explicites | Politique du site pilote |
| Remerciements | Hors MVP | Valeur observée après usage cœur |

## Technique et exploitation

| Question | Hypothèse de travail | Décision attendue |
| --- | --- | --- |
| Hébergement frontend/API | Même origine, un conteneur JVM | Avant F05 |
| PostgreSQL managé | Préféré pour sauvegarde et PITR | Avant F05 |
| Fournisseur email | Mailpit `v1.30.6` local ; port Quarkus remplaçable | Fournisseur réel avant F05 |
| Liste de domaines | Source versionnée et contestable | Pendant F03 |
| Rétention de l'outbox | Courte après succès, longue pour audit agrégé | Avant F04 |
| Native image Quarkus | Non au MVP | Seulement après mesure |
| Temps réel | Aucun au MVP | Seulement si polling mesuré insuffisant |

## Marque et droits

| Question | État actuel | Action |
| --- | --- | --- |
| Droits des cinq JPEG | Fournis pour référence, publication non confirmée | Confirmer origine et licence |
| Police de marque | Geist ou Inter proposées | Tester lisibilité et licence en F02 |
| Photographie parking finale | Référence uniquement | Produire ou licencier un asset avec provenance |

## Règle de fermeture

Une question est retirée de ce fichier seulement lorsque sa réponse rejoint :

- une ADR pour une décision structurante ;
- `DESIGN.md` pour une décision visuelle ;
- les règles métier pour un invariant ;
- le runbook ou la configuration pour une décision opérationnelle.
