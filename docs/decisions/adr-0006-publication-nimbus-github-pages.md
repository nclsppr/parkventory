# ADR-0006 : publication filtrée de Nimbus sur GitHub Pages

- Statut : remplacé par ADR-0017 pour le déploiement applicatif
- Statut d'implémentation : implémenté et vérifié sur GitHub Pages
- Date : 2026-08-11
- Dernière vérification : runs Verify `31499873532` et Pages `31499873475`, puis probes HTTP le 2026-08-11
- Propriétaire : nclsppr
- Domaine : documentation et exploitation
- Remplace : aucune
- Remplacé par : aucune

## Contexte

Nimbus construit un site navigable depuis tous les Markdown classés par
`documentation.json`. Ce build local réunit les collections `public`,
`internal` et `reference`. Le publier sans filtre exposerait des documents qui
ne font pas partie de la surface documentaire destinée aux lecteurs du produit.

GitHub Pages sert déjà la démo frontend depuis un artefact unique sous
`/parkventory/`. Un second déploiement Pages du même dépôt remplacerait cet
artefact au lieu de créer une surface indépendante.

Nimbus 0.8.2 respecte le chemin de base pour les assets, mais certains helpers
produisent des liens de navigation, d'agent ou de métadonnées depuis la racine.
Une publication sous un sous-chemin exige donc un adaptateur local testé.

## Problème à décider

Comment rendre la documentation produit accessible depuis le README sans
publier le corpus interne ni casser la démo Pages existante ?

## Critères

- URL stable et directement accessible ;
- allowlist de collections explicite ;
- échec du build si une collection demandée n'est pas publique ;
- aucun document interne, décision, runbook ou référence dans l'artefact ;
- navigation, recherche, sitemap, Open Graph, Markdown et index d'agents valides
  sous le sous-chemin ;
- un seul workflow et un seul artefact GitHub Pages ;
- rollback sans modifier les sources Markdown.

## Options considérées

### Option A : publier le build Nimbus local complet

Cette option demande peu de code, mais elle publie toutes les audiences. Elle
contredit le contrat documentaire et est refusée.

### Option B : publier Nimbus dans un second workflow Pages

GitHub Pages ne fusionne pas deux artefacts indépendants pour un même dépôt. Le
dernier déploiement remplacerait la démo ou la documentation. Cette option est
refusée.

### Option C : intégrer un build Nimbus filtré dans l'artefact existant

Le workflow construit la démo, construit seulement les collections Nimbus
autorisées, copie cette sortie sous `frontend/dist/docs/`, puis publie
`frontend/dist` une seule fois.

### Option minimale : documenter uniquement l'accès local

Cette option reste sûre, mais elle ne fournit pas le lien GitHub Pages demandé
et oblige chaque lecteur à installer les dépendances.

## Décision

Adopter l'option C.

- URL publique : `https://nclsppr.github.io/parkventory/docs/`.
- Origine Nimbus : `https://nclsppr.github.io`.
- Chemin de base : `/parkventory/docs`.
- Allowlist initiale : collection `product` uniquement.
- `NIMBUS_PUBLIC_COLLECTIONS` active le mode publication. Une collection
  inconnue ou dont la visibilité n'est pas `public` arrête le build.
- Une source publiée ne peut pas utiliser un lien Markdown relatif direct
  vers un fichier `.md` classé mais exclu.
- Les index synthétiques d'un build public portent la visibilité `public`.
- L'adaptateur de routage préfixe les liens Nimbus dérivés et les URL absolues
  avec le chemin Pages exactement une fois.
- `scripts/build_pages.sh` refuse toute visibilité non publique et plusieurs
  routes représentatives avant de composer l'artefact.
- Le workflow Pages installe les deux lockfiles, teste le frontend, exécute la
  gate Nimbus publique et charge l'unique dossier `frontend/dist`.

La visibilité documentaire ne constitue pas un contrôle d'accès. Le dépôt
reste public et ne doit contenir aucun secret ou contenu confidentiel.

## Conséquences

### Positives

- le README pointe vers une documentation disponible sans installation ;
- les documents produit et la démo partagent une URL et un déploiement ;
- une nouvelle collection publique n'entre pas dans Pages sans modification
  explicite de l'allowlist ;
- les variantes HTML, Markdown et agent utilisent la même base canonique ;
- le corpus local complet reste disponible aux mainteneurs.

### Négatives

- le build Pages installe aussi les dépendances Nimbus ;
- l'adaptateur local doit être réévalué à chaque mise à jour de Nimbus ;
- le chemin des pages produit conserve la structure source, par exemple
  `/parkventory/docs/docs/product/vision/` ;
- une erreur dans la démo ou la documentation bloque le même déploiement.

### Risques et contrôles

| Risque | Contrôle |
| --- | --- |
| Exposition d'une collection interne | Allowlist par identifiant, vérification de visibilité et contrôle des routes finales |
| Lien de navigation public vers un document exclu | Rejet des liens Markdown relatifs directs pendant la synchronisation, puis lint des routes Nimbus |
| URL racine incorrecte | Helper de base path testé, composant head local et inspection des sorties agent/sitemap |
| Dérive après mise à jour Nimbus | Gate publique, tests d'adaptateur et revue de `nimbus-docs outdated` |
| Confusion entre démo et production | README et pages indiquent que le frontend Pages reste statique |

## Mise en œuvre

1. Filtrer l'inventaire dans `docs-nimbus/scripts/sync-content.mjs`.
2. Tester allowlist, visibilité, liens exclus et index synthétique.
3. Adapter navigation, recherche, métadonnées et variantes au sous-chemin.
4. Construire Nimbus avec les variables publiques dans `scripts/build_pages.sh`.
5. Copier la sortie vérifiée sous `frontend/dist/docs/`.
6. Installer le lockfile Nimbus dans `.github/workflows/pages.yml`.
7. Lier l'URL publique depuis le README et le contrat documentaire.
8. Vérifier les routes autorisées et interdites après déploiement.

## Vérification

- `npm test --prefix docs-nimbus` ;
- gate Nimbus publique : 4 sources maintenues, 7 pages de contenu et aucune
  audience exclue ;
- `npm run pages:build` ;
- inspection des URL `canonical`, Open Graph, sitemap, recherche, `llms.txt`,
  `llms-full.txt`, `index.md` et `index.mdx` ;
- réponses HTTP `200` pour l'accueil et les pages produit après déploiement ;
- réponses HTTP `404` pour `roadmap` et `docs/internal/open-questions`.

La publication distante et ses identifiants de run sont consignés dans
`STATUS.md` et `DELIVERY-EVIDENCE.md`, pas anticipés dans cette ADR.

## Retour arrière

Retirer la construction et la copie Nimbus de `scripts/build_pages.sh`, retirer
l'installation Nimbus du workflow Pages et supprimer le lien public du README.
Le prochain déploiement remplacera l'artefact combiné par la démo seule. Les
sources Markdown, le build local complet et l'allowlist restent disponibles
pour corriger puis republier.

## Réexamen

Réexaminer si :

- Nimbus fournit nativement toutes les URL sous chemin de base ;
- une autre collection doit devenir publique ;
- la documentation reçoit un domaine ou un dépôt indépendant ;
- le temps ou la taille du workflow Pages devient excessif ;
- le dépôt devient privé ou contient une audience réellement confidentielle.

## Références

- [Contrat documentaire](../../DOCUMENTATION.md)
- [Maintenance Nimbus](../../docs-nimbus/AGENT.md)
- [Profil Nimbus vendorisé](../foundation/profiles/documentation-nimbus.md)
- [Workflow GitHub Pages](https://github.com/nclsppr/parkventory/blob/main/.github/workflows/pages.yml)
