# Changelog

Ce fichier trace chaque changement livré avec son impact observable. Git reste
la source du diff technique et les ADR expliquent les décisions importantes.

## Non publié

### Ajouté

- adoption de Project Foundation `v0.4.0` en pack critique avec l'invariant
  `P18` et les profils web,
  backend/données, production, dépendances et artefacts générés ;
- documentation canonique de la vision, des rôles, des parcours, des règles
  métier, du modèle de domaine et de la sécurité multi-tenant ;
- choix documenté d'un frontend React et d'un backend Java 25 / Quarkus 3.33
  LTS en monolithe modulaire sur PostgreSQL 18 ;
- direction artistique sombre avec vert acide, bleu glacier et photographie
  tramée, accompagnée d'exigences d'accessibilité et de performance ;
- conservation locale des cinq références visuelles originales, exclues de Git,
  avec hashes et provenance ;
- roadmap dépendance-par-dépendance, runbook cible et preuve de livraison.
- landing et tableau de bord React 19 / TypeScript 7 / Vite 8 fidèles aux
  références, responsives et interactifs ;
- API de démonstration Java 25 / Quarkus 3.33.3 LTS avec santé, OpenAPI,
  validation et tests REST ;
- PostgreSQL 18 local, migration Flyway du modèle multi-tenant et contraintes
  d'exclusion temporelle ;
- environnement reproductible mise/Compose, gate complète et workflow GitHub
  Actions épinglé ;
- publication du frontend en démo statique sur GitHub Pages, avec routage sous
  `/parkventory/`, fallback des routes et actions locales sans requête backend ;
- illustration de parking originale générée pour le projet, master PNG,
  dérivé WebP et provenance.

### Limites

- les mutations API locales restent en mémoire ; la démo publique utilise des
  données statiques, sans authentification ni email réel ;
- aucun hébergement ou domaine de production n'est livré ;
- les droits de publication des JPEG et le master vectoriel du logo restent à
  confirmer ;
- le fournisseur d'email et l'infrastructure de production ne sont pas choisis.
