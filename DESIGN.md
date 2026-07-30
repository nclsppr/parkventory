# DESIGN.md

Contrat visuel et UX de Parkventory. Les JPEG fournis sont une direction à
synthétiser, pas des écrans à recopier ni une preuve de produit livré.

## Intention

### Impression recherchée

Un outil opérationnel nocturne, précis et immédiatement lisible : grille
rigoureuse, surfaces presque noires, vert acide énergique, bleu glacier
fonctionnel et photographie de parking traitée comme une trame imprimée.

L'interface doit donner envie de partager sans transformer le parking en produit
financier. Elle reste humaine, rapide et utile avant d'être spectaculaire.

### Différenciation liée au produit

- L'espace vide devient visible : le bleu glacier révèle une place réellement
  réservable.
- Le vert acide représente l'action et la contribution, pas un néon décoratif.
- Les vues aériennes tramées matérialisent l'inventaire existant et son
  potentiel.
- Les deux tâches « Partager ma place » et « Trouver une place » dominent le
  dashboard ; les statistiques restent secondaires et uniquement réelles.
- Le futur plan complète toujours une liste accessible.

### Anti-objectifs

- dashboard générique rempli de cartes imbriquées ;
- glow, gradients ou verre sans fonction ;
- pricing, revenus, logos clients, témoignages ou chiffres fictifs ;
- faux terminal, carte interactive factice ou 3D décorative ;
- vert utilisé partout au point de perdre la hiérarchie ;
- disponibilité communiquée uniquement par une couleur ;
- texte fonctionnel intégré dans une image.

## Principes

1. Une action dominante par surface.
2. Le statut le plus important est lisible avant les métriques.
3. La densité desktop ne sacrifie ni mobile ni zoom.
4. Les états vides expliquent une prochaine action réelle.
5. Les références de marque restent intactes jusqu'à validation d'un master.
6. Toute donnée affichée provient de l'API ou porte explicitement le label démo.
7. Mouvement et image renforcent la compréhension, jamais le domaine métier.

## Tokens

Ce document porte la sémantique canonique. Les valeurs exécutables vivent dans
`frontend/src/styles.css` afin que tokens, composants et breakpoints restent
alignés dans cette première surface. Une extraction vers des modules dédiés ne
sera faite que si la croissance du design system la justifie.

Les valeurs ont été estimées à partir de JPEG compressés. Elles sont
provisoires jusqu'au prototype et à la mesure de contraste sur les composants.

### Couleurs

| Rôle | Token cible | Valeur sombre | Usage | Contraste requis |
| --- | --- | --- | --- | --- |
| Canvas | `--color-canvas` | `#030504` | Fond global | Base |
| Surface | `--color-surface` | `#101210` | Sections et panneaux | Texte AA |
| Surface haute | `--color-surface-raised` | `#151715` | Contrôles et survol | Texte AA |
| Bordure | `--color-border` | `#282b28` | Séparateurs fins | Visible à 200 % |
| Texte | `--color-text` | `#f5f7f2` | Titres et corps | AA |
| Texte secondaire | `--color-text-muted` | `#a3aaa1` | Métadonnées | AA |
| Vert acide | `--color-action` | `#c8f913` | CTA, contribution, succès | AA avec texte sombre |
| Bleu glacier | `--color-available` | `#15c9d5` | Place disponible, sélection, lien spécial | AA sur canvas |
| Réservé | `--color-reserved` | `#f5f7f2` | Réservation confirmée | Avec icône ou libellé |
| Indisponible | `--color-unavailable` | `#5f6660` | Place non disponible | Avec motif ou libellé |
| Erreur | `--color-danger` | `#ff665c` | Conflit, suppression, erreur | AA et texte explicite |

Le thème clair n'est pas prévu dans le MVP. Les préférences système ne doivent
pas basculer silencieusement vers une variante non conçue.

Sémantique :

- vert acide : action principale, partage publié, succès ;
- bleu glacier : disponibilité réservable, sélection et liens à forte valeur ;
- blanc : réservation confirmée ;
- gris : indisponible ;
- rouge : conflit ou erreur ;
- forme, icône et texte accompagnent toujours la couleur.

### Typographie

| Rôle | Police cible | Mesure | Usage |
| --- | --- | --- | --- |
| Titres | Geist Sans ou Inter Variable, validation en F02 | 8 à 16 mots par ligne | Promesse et page |
| Interface | Même famille variable | 45 à 75 caractères | Libellés et corps |
| Données | Chiffres tabulaires de la même famille | Valeurs courtes | Horaires, compteurs, places |
| Micro-labels | Même famille, 500, tracking léger | Une ligne | Statut, filtre, catégorie |

Une seule famille principale évite l'effet « concept board ». Aucun texte
essentiel ne descend sous 14 px ; les champs restent à 16 px sur mobile.

### Espacement, rayons et ombres

- échelle : `4, 8, 12, 16, 24, 32, 48, 80` px ;
- rayon : 8 px pour les contrôles, 12 px pour les grandes surfaces ;
- bordure : 1 px, contraste faible mais mesurable ;
- ombre : rare, courte et noire ; la hiérarchie vient d'abord de la grille ;
- halo vert réservé au focus de marque ou au CTA public, jamais permanent.

## Mise en page

- Largeur de lecture éditoriale : 68 caractères.
- Largeur maximale landing : 1440 px, grille desktop 12 colonnes.
- Application desktop : rail de navigation stable et zone centrale fluide.
- Dashboard : deux actions principales visibles sans scroll, puis prochaines
  réservations et disponibilités.
- Mobile : navigation compacte vers Accueil, Partager, Trouver et Réservations.
- Les calendriers denses deviennent listes ou agendas sur petit écran.
- Breakpoints motivés par la capacité réelle du contenu, pas par un appareil.
- Aucun débordement horizontal involontaire à 320 px ou à 200 % de zoom.

## Surfaces

| Surface | Foyer | Contenu secondaire | À ne pas inventer |
| --- | --- | --- | --- |
| Landing | Promesse et CTA email professionnel | Fonctionnement, bénéfices, sécurité, FAQ | Logos clients, pricing, revenus |
| Onboarding | Étape courante et confiance | Explication du domaine et de la confidentialité | Membres avant vérification |
| Dashboard | Partager ou trouver | Prochaine réservation, prochain partage, invitation | Activité factice |
| Partager | Place et intervalle | Résumé, règles d'annulation | Récurrence infinie au MVP |
| Trouver | Date, site et résultats | Filtres utiles et détails | Plan avant F07 |
| Réservations | Prochaine réservation | Historique et annulation | Gamification |
| Administration | Gouvernance et inventaire | Audit et enrichissement | Accès visible aux non-admins |

## Composants

| Composant | Usage | Variantes | États obligatoires |
| --- | --- | --- | --- |
| Bouton | Action principale ou secondaire | vert plein, contour, danger | default, hover, focus, active, disabled, loading |
| Champ email | Self-registration | public, invitation | vide, focus, invalide, envoi, lien envoyé, rate-limited |
| Carte de place | Résultat réservable | disponible, réservée, indisponible | sélection, focus, conflit, attributs |
| Sélecteur d'intervalle | Partage et recherche | journée, horaires | incomplet, invalide, DST, conflit |
| Liste agenda | Alternative canonique au calendrier | jour, semaine | chargement, vide, erreur, succès |
| Toast ou annonce | Feedback non bloquant | succès, information, erreur | `aria-live` adapté, fermeture |
| Dialogue | Confirmation sensible | annulation, promotion admin | focus piégé, retour focus, erreur |
| Navigation | Sections du produit | desktop, mobile | route active, focus, badge réel |

## Interaction et mouvement

- Feedback utile en 120 à 220 ms pour contrôles et panneaux.
- Les transitions de page ne dépassent pas 320 ms.
- Animer `opacity` et `transform`, pas les grandes propriétés de layout.
- Une place nouvellement disponible peut recevoir une impulsion unique.
- La photographie tramée peut se révéler progressivement sur la landing, sans
  masquer le contenu ni retarder le LCP.
- `prefers-reduced-motion` retire parallaxe, balayage et déplacements ; le
  feedback d'état reste instantané.
- Les hovers ne s'appliquent qu'aux pointeurs compatibles.

## Accessibilité

- Niveau visé : WCAG 2.2 AA.
- Focus : anneau glacier ou acide de 2 px avec offset visible.
- Navigation clavier complète et ordre conforme à la lecture.
- Cibles tactiles d'au moins 44 × 44 px.
- Disponibilité doublée par libellé, motif ou icône.
- Calendrier doublé par une liste ou table sémantique.
- Confirmations et conflits annoncés via une région `aria-live`.
- Erreurs liées programmatiquement aux champs.
- Photographie tramée décorative masquée aux technologies d'assistance.
- Dates, heures et fuseau toujours explicites.
- Zoom 200 %, reflow, contenu long et chaînes non sécables testés.

## Images, logo et médias

| Famille | Fonction | Style | Format cible | Provenance |
| --- | --- | --- | --- | --- |
| Parking aérien | Narration et identité | Noir, ivoire, trame, accents acide/glacier | AVIF/WebP avec fallback | Référence JPEG fournie |
| Logo | Identité | `P` et grille de quatre places, une place glacier | SVG canonique transparent | SVG fourni par le propriétaire du projet |
| Icônes | Information | Trait simple, géométrie cohérente | SVG code-native | Bibliothèque à décider |
| Portraits | Information optionnelle | Réels ou avatars non trompeurs | AVIF/WebP | Consentement et droits requis |

Références conservées hors publication Nimbus :

- `docs/assets/references/dashboard-reference-a.jpg` ;
- `docs/assets/references/dashboard-reference-b.jpg` ;
- `docs/assets/references/landing-reference.jpg` ;
- `docs/assets/references/parking-texture-reference.jpg` ;
- `docs/assets/references/logo-reference.jpg`.

Le master du symbole est
`assets/brand/parkventory-logo-transparent.svg` : `554 × 560`, fond transparent,
vert `#C8F814`, glacier `#14C9D3` et SHA-256
`f145d51082b3e934a23a80096494809ab1a3b6c96f6ba64ebca1ef0597089316`.
Il est utilisé sans altération de géométrie ni recoloration. Le lockup produit
associe ce symbole exact au mot `Parkventory` rendu en texte ; le fichier ne
contient pas de wordmark vectoriel ni de variante monochrome. Les copies
publiques et le dérivé raster Open Graph sont produits par
`npm run brand:sync` puis contrôlés par `npm run brand:check`.

L'asset servi par le prototype est `frontend/public/images/parking-halftone.webp`.
Il s'agit d'une création originale générée pour le projet, non d'une
transformation du JPEG fourni. Sa source PNG, son hash, son outil et ses
consommateurs sont consignés dans `docs/references/visual-sources.md`.

## Performance

- Hero responsive : 250 Ko maximum mobile, 450 Ko desktop.
- Total images au-dessus de la ligne de flottaison : 550 Ko maximum.
- JavaScript initial de l'application : cible 180 Ko gzip hors polyfills,
  à mesurer en F02.
- LCP : cible inférieure à 2,5 s sur mobile milieu de gamme et réseau 4G simulé.
- CLS : cible inférieure à 0,1.
- Les images réservent leurs dimensions et les enrichissements hors écran sont
  différés.
- Fallback : landing et actions essentielles restent compréhensibles sans
  texture, animation ou plan.

## Zones gelées

Ne changent pas sans décision explicite :

- orthographe `Parkventory` ;
- fond sombre dominant ;
- vert acide comme action principale ;
- bleu glacier comme disponibilité réservable et lien spécial ;
- symbole `P` associé à une grille de places ;
- séparation sémantique entre partager et réserver ;
- absence de métriques ou clients fictifs ;
- liste accessible comme fallback permanent du futur plan.

## Matrice de validation

| Dimension | Valeurs |
| --- | --- |
| Viewports | 320 × 568, 390 × 844, 768 × 1024, 1440 × 900 |
| Thèmes | Sombre uniquement au MVP |
| Entrées | Clavier, tactile, souris |
| Mouvement | Normal, réduit |
| Contenu | Court, long, vide, chargement, erreur, conflit |
| Navigateurs | Deux dernières versions stables de Safari, Chrome, Firefox et Edge |
| Appareils réels requis | iPhone Safari et ordinateur macOS ou Windows avant pilote |
| Contraste | Mesure automatisée et revue des états réels |
