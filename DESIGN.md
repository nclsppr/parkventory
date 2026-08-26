# DESIGN.md

Contrat visuel et UX de Parkventory. Les JPEG fournis sont une direction à
synthétiser, pas des écrans à recopier ni une preuve de produit livré.

## Intention

### Impression recherchée

Un outil opérationnel précis et immédiatement lisible : grille rigoureuse,
vert acide énergique, bleu glacier fonctionnel et photographie de parking
traitée comme une trame imprimée. Le thème sombre nocturne reste la signature
et le choix initial ; le thème clair transpose la même identité sur un canvas
ivoire chaud, avec des surfaces plates et des encres olive et cyan foncé.

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
- jargon d’infrastructure ou nom de fournisseur dans les parcours produit ;
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

Les valeurs initiales ont été estimées à partir de JPEG compressés. Le prototype
du 2026-08-11, les tests de ratios et les audits Axe ont ensuite validé ou
ajusté les tokens exécutables. `frontend/src/styles.css` reste l'autorité de
mise en œuvre ; `STATUS.md` et `DELIVERY-EVIDENCE.md` portent les preuves datées.

### Couleurs

| Rôle | Token exécutable | Sombre | Clair | Usage |
| --- | --- | --- | --- | --- |
| Canvas | `--bg` | `#030504` | `#f4f6f1` | Fond global |
| Surface | `--surface` | `#0d100e` | `#ffffff` | Sections et panneaux |
| Surface secondaire | `--surface-2` | `#121512` | `#ecefe9` | Contrôles et survols |
| Bordure | `--border` | `#252b26` | `#d4dcd2` | Séparateurs fins |
| Bordure forte | `--border-strong` | `#3b443c` | `#7f8c82` | Contrôles et états essentiels |
| Texte | `--text` | `#f5f7f2` | `#080a08` | Titres et corps |
| Texte secondaire | `--muted` | `#9da49d` | `#4a554c` | Métadonnées |
| Action pleine | `--action-fill` | `#c8f913` | `#c6ff00` | CTA et marqueurs pleins, avec texte sombre |
| Action en texte | `--green` | `#c8f913` | `#425a00` | Libellés, icônes et bordures accessibles |
| Disponible plein | `--available-fill` | `#15c9d5` | `#a8e5ff` | Place sélectionnée et marqueurs pleins |
| Disponible en texte | `--cyan` | `#15c9d5` | `#075a70` | Liens, focus, icônes et bordures accessibles |
| Erreur | `--danger` | `#ff746d` | `#b42318` | Conflit, suppression et erreur explicite |

Le premier accès reste sombre afin de préserver l'identité historique. Un
sélecteur explicite « clair / sombre » est disponible sur les surfaces
publiques, l'authentification et l'application. Le choix est appliqué avant le
premier rendu, mémorisé localement et réutilisé sur les routes suivantes. La
préférence système ne change jamais le thème silencieusement.

Après authentification, une organisation peut substituer aux accents
Parkventory ses propres jetons sémantiques d'action et de disponibilité. Les
neutres, les états d'erreur et la signification métier restent Parkventory. Le
branding d'organisation est fourni par la session, actualisé par le dashboard,
scopé au shell applicatif et jamais conservé dans `localStorage` : une
déconnexion, un opt-out ou une configuration invalide rétablit immédiatement
l'identité par défaut. Les variantes clair et sombre portent des encres
distinctes afin qu'une couleur de marque prévue pour un aplat ne soit jamais
réutilisée comme petit texte sans contraste mesuré.

En clair, les aplats acide et glacier restent réservés aux remplissages avec
texte sombre. Les libellés, icônes, focus et frontières fonctionnelles emploient
leurs encres foncées. Le symbole SVG original n'est ni recoloré ni redessiné :
une plaque `--text` compacte lui redonne un contraste non textuel supérieur à
3:1 sur les surfaces claires. Le dernier appel à l'action conserve une surface
photographique sombre inversée, documentée comme rupture éditoriale volontaire.

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
- thème clair : surfaces plates et ombres limitées aux panneaux flottants ;
- halo vert réservé au focus de marque ou au CTA public, jamais permanent.

## Mise en page

- Largeur de lecture éditoriale : 68 caractères.
- Largeur maximale landing : 1440 px, grille desktop 12 colonnes.
- Application desktop : rail de navigation stable et zone centrale fluide.
- Dashboard : deux actions principales visibles sans scroll, puis prochaines
  réservations et disponibilités.
- Mobile livré : navigation compacte vers Accueil, Partager et Trouver. La
  destination Réservations ne sera ajoutée qu'avec sa vraie route.
- Sur mobile, les menus public et applicatif s’ouvrent depuis la droite ; le
  tiroir de l’application arrive du même côté.
- Le header public prolonge un fond opaque dans la zone système supérieure de
  Safari afin qu’aucun contenu ne défile derrière la Dynamic Island.
- La navigation basse reste compacte, opaque et bordée, sans flou ni halo ; la
  zone sûre iPhone la décale sans agrandir ses commandes.
- Les calendriers denses deviennent listes ou agendas sur petit écran.
- L'aperçu produit mobile se recompose à sa largeur réelle ; il n'est jamais
  réduit par transformation au point de rendre ses libellés illisibles.
- Breakpoints motivés par la capacité réelle du contenu, pas par un appareil.
- Aucun débordement horizontal involontaire à 320 px ou à 200 % de zoom.

## Surfaces

| Surface | Foyer | Contenu secondaire | À ne pas inventer |
| --- | --- | --- | --- |
| Landing | Promesse et CTA email professionnel | Fonctionnement, bénéfices, sécurité, FAQ | Logos clients, pricing, revenus |
| Onboarding | Étape courante et confiance | Explication du domaine et de la confidentialité | Membres avant vérification |
| Dashboard — `/app` | Partager ou trouver | Prochaine réservation, prochain partage, invitation | Activité factice |
| Partager — `/app/partager` | Place et intervalle | Résumé, fuseau, confidentialité et retrait des partages actifs non réservés | Récurrence infinie au MVP |
| Trouver — `/app/trouver` | Disponibilités réelles à sept jours | Sélection, confirmation et annulation de la réservation active avant son début | Filtres sans contrat API, plan avant F07 |
| Réservations, future route | Prochaine réservation | Historique paginé ; l'annulation active existe déjà dans Trouver | Gamification |
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
- Sur la landing, les révélations de section jouent une seule fois à partir de
  16 % de visibilité ; le contenu reste rendu si l'observateur ou GSAP manque.
- Le grand écran peut épingler uniquement le repère éditorial du processus et
  superposer légèrement ses trois étapes. Aucun pinning ne s'applique sous
  1 051 px.
- La progression du header, la profondeur du hero et le bandeau de cycle sont
  décoratifs : ils ne portent aucune information absente du texte.
- Une place nouvellement disponible peut recevoir une impulsion unique.
- La photographie tramée peut se révéler progressivement sur la landing, sans
  masquer le contenu ni retarder le LCP.
- `prefers-reduced-motion` retire parallaxe, balayage et déplacements ; le
  feedback d'état reste instantané.
- Les hovers ne s'appliquent qu'aux pointeurs compatibles.
- Le changement de thème est immédiat et ne déclenche aucune animation de page.

## Accessibilité

- Niveau visé : WCAG 2.2 AA.
- Focus : anneau glacier de 2 px avec offset de 3 px.
- Le lien « Aller au contenu » est une cible de 44 px positionnée après
  `safe-area-inset-top` et les marges latérales de l'écran ; le viewport utilise
  `viewport-fit=cover` pour Safari iPhone.
- Navigation clavier complète et ordre conforme à la lecture.
- Cibles tactiles d'au moins 44 × 44 px.
- Le sélecteur de thème expose deux boutons pressés/non pressés, nommés
  « Thème clair » et « Thème sombre », avec cibles de 44 px.
- Les champs conservent un anneau de focus glacier de 2 px et leurs placeholders
  utilisent une encre à pleine opacité, indépendamment du navigateur.
- Les thèmes, routes et sélections actives restent distinguables lorsque les
  couleurs forcées suppriment les fonds et ombres.
- Disponibilité doublée par libellé, motif ou icône.
- Calendrier doublé par une liste ou table sémantique.
- Confirmations et conflits annoncés via une région `aria-live`.
- Erreurs liées programmatiquement aux champs.
- Un intervalle horaire inversé marque les deux champs invalides, les relie à
  une erreur visible commune et bloque la requête. Aucun contrôle masqué ne
  reste dans l'ordre de tabulation.
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

Dans un espace co-marqué, le logo de l'entreprise reste un asset autonome et
inchangé. Il est posé sur une plaque qui garantit sa lisibilité dans les deux
thèmes ; le symbole Parkventory canonique est superposé dans une petite pastille
HTML séparée. Ni les deux SVG ni leurs géométries ne sont fusionnés. Le logo
entreprise n'apparaît pas sur la landing, l'authentification, les pages légales,
la 404 ou les aperçus publics. Une erreur de chargement revient au lockup
Parkventory et des dimensions fixes réservent l'espace pour éviter le CLS.

L'asset servi par le prototype est `frontend/public/images/parking-halftone.webp`.
Il s'agit d'une création originale générée pour le projet, non d'une
transformation du JPEG fourni. Sa source PNG, son hash, son outil et ses
consommateurs sont consignés dans `docs/references/visual-sources.md`.

## Performance

- Hero responsive : 250 Ko maximum mobile, 450 Ko desktop.
- Total images au-dessus de la ligne de flottaison : 550 Ko maximum.
- JavaScript initial de l'application : cible 180 Ko gzip hors polyfills,
  à mesurer en F02.
- Les enrichissements GSAP de la landing sont chargés en deux chunks différés ;
  leur échec ne masque ni le hero, ni les sections, ni les actions.
- LCP : cible inférieure à 2,5 s sur mobile milieu de gamme et réseau 4G simulé.
- CLS : cible inférieure à 0,1.
- Les images réservent leurs dimensions et les enrichissements hors écran sont
  différés.
- Fallback : landing et actions essentielles restent compréhensibles sans
  texture, animation ou plan.

## Zones gelées

Ne changent pas sans décision explicite :

- orthographe `Parkventory` ;
- thème sombre signature par défaut et thème clair explicitement sélectionnable ;
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
| Thèmes | Sombre et clair, choix persistant, sombre au premier accès |
| Entrées | Clavier, tactile, souris |
| Mouvement | Normal, réduit |
| Contenu | Court, long, vide, chargement, erreur, conflit |
| Navigateurs | Deux dernières versions stables de Safari, Chrome, Firefox et Edge |
| Appareils réels requis | iPhone Safari et ordinateur macOS ou Windows avant pilote |
| Contraste | Mesure automatisée et revue des états réels |
