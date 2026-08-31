# Registre des références visuelles

## Origine et statut

Les cinq JPEG ont été fournis par le propriétaire du projet dans le brief du
2026-07-30. Ils sont conservés sans transformation dans le workspace local
comme références internes de direction artistique. Ils sont exclus de Git par
`.gitignore` et leur absence dans un clone propre est volontaire.

Leur présence locale ne prouve ni auteur, ni licence, ni droit de publication.
Ils ne doivent être ni commités, ni servis par la landing ou l'application
avant confirmation écrite des droits.

## Inventaire

| Fichier | Original | Dimensions | SHA-256 | Fonction de référence |
| --- | --- | ---: | --- | --- |
| `docs/assets/references/dashboard-reference-a.jpg` | Photo 1.jpg | 1280 × 960 | `f8bef7e5649d92a1173e98f8d6dc678e7727dec487bb9414b10aa3a4d6c6472d` | Densité, calendrier, statistiques secondaires |
| `docs/assets/references/dashboard-reference-b.jpg` | Photo 2.jpg | 1280 × 720 | `b6941cd76d733ce66cba404c0d7d9a6d471c00c3499eb2775bc8f5fe0a309cb2` | Base de l'app, partage/recherche, navigation |
| `docs/assets/references/landing-reference.jpg` | Photo 3.jpg | 1280 × 960 | `c5f3427fb55a5ca62e9e08359b80e45f08b5b43087713c59a0c93e1284099722` | Composition de landing et aperçu produit |
| `docs/assets/references/parking-texture-reference.jpg` | Photo 4.jpg | 1280 × 640 | `59fae4350be86557e37ba91f6adf198b510c882aac57451a946e92fa5593fe51` | Trame aérienne, noir/ivoire, accents |
| `docs/assets/references/logo-reference.jpg` | Photo 5.jpg | 1254 × 1254 | `cf5ec9762c6ddaa726b0bd82ed4bc5429a06c693e87f5bab5de4cfdb2f6a661f` | Symbole `P`, grille et place glacier |

Hashes calculés localement avec `shasum -a 256` le 2026-07-30.

## Ce qui est retenu

- fond presque noir et surfaces mates ;
- vert acide comme action et contribution ;
- bleu glacier comme disponibilité et sélection ;
- grille compacte mais lisible ;
- iconographie filaire ;
- photographie aérienne tramée ;
- symbole `P` relié visuellement à une grille de places.

## Ce qui n'est pas retenu comme exigence produit

- revenus et monétisation ;
- pricing et demande de démo ;
- logos de clients ou témoignages ;
- chiffres d'usage ;
- places électriques comme promesse centrale ;
- cartes déjà opérationnelles ;
- avatars ou noms visibles ;
- toute copie anglaise présente dans les maquettes.

Ces éléments sont du contenu de référence et restent fictifs tant qu'une source
réelle ne les justifie pas.

## Logo

Le SVG transparent fourni le 2026-07-30 est désormais le master canonique du
symbole :

| Source | Dimensions | SHA-256 | Couleurs | Statut |
| --- | ---: | --- | --- | --- |
| `assets/brand/parkventory-logo-transparent.svg` | 554 × 560 | `f145d51082b3e934a23a80096494809ab1a3b6c96f6ba64ebca1ef0597089316` | `#C8F814`, `#14C9D3` | Fourni par le propriétaire du projet et autorisé pour l'intégration Parkventory |

Le master ne contient que le symbole. Les lockups associent ce fichier exact
au mot `Parkventory` en texte accessible. Il ne doit être ni redessiné, ni
recoloré, ni injecté plusieurs fois inline : ses IDs internes doivent rester
isolés dans le document image.

La copie principale de publication reste byte-identique au master. Le favicon
place les mêmes chemins, sans les modifier, sur un canevas carré `560 × 560`
(`viewBox="-3 0 560 560"`) afin de respecter le ratio attendu dans les résultats
de recherche. Les PNG sont des dérivés raster déterministes :

| Copie | Consommateur |
| --- | --- |
| `frontend/public/parkventory-logo-transparent.svg` | Huit emplacements React via le composant partagé `Logo` |
| `frontend/public/favicon.svg` | Favicon carré de la landing et de l'application ; géométrie du symbole inchangée |
| `docs-nimbus/public/favicon.svg` | Header et favicon Nimbus |
| `docs-nimbus/public/parkventory-logo-transparent.png` | Cartes Open Graph Nimbus générées en PNG |

`npm run brand:sync` régénère les dérivés avec Sharp `0.35.3` et
`npm run brand:check` refuse toute dérive ; cette dernière commande est appelée
par la gate globale. Le retrait consiste à supprimer le master et ses quatre
dérivés, puis les consommateurs du composant React, du header Nimbus et de la
configuration Open Graph.

Le JPEG historique reste une référence uniquement. Il :

- comporte un fond noir et un halo ;
- présente des artefacts de compression ;
- ne définit pas de wordmark ;
- ne fournit ni monochrome, ni petite taille, ni zone de protection ;
- n'est pas un SVG exploitable comme master.

La provenance juridique externe du SVG n'a pas été auditée indépendamment ;
l'autorisation d'intégration vient de l'instruction explicite du propriétaire
du projet dans cette livraison.

## Carte sociale produit

La carte de l'accueil est une composition originale code-native. Elle reprend
le fond sombre, la grille de places, le vert d'action et le bleu de sélection
déjà définis dans `DESIGN.md` et `frontend/src/styles.css`. Elle n'utilise aucun
des cinq JPEG de référence dont les droits restent non établis.

| Artefact | Dimensions | Octets | SHA-256 | Statut |
| --- | ---: | ---: | --- | --- |
| `assets/brand/parkventory-social-card.svg` | 1 200 × 630 | 4 644 | `b0d50f4dbb354e5e176ad63b0156a8c45b61b31e6a936915711ddd79a67debe1` | Source éditable avec ancres logo et police |
| `frontend/public/parkventory-social-card-fr.png` | 1 200 × 630 | 51 695 | `fd2ccf37d786492a13379920712b9c6400858216abe0110139edd5cd8db061bf` | Raster français ; alias historique byte-identique |
| `frontend/public/parkventory-social-card-en.png` | 1 200 × 630 | 50 757 | `19e8bb34a4b8b5035b9bd8037e7e16740cae74580c8bed2b755c2c778fed486b` | Raster anglais |
| `frontend/public/parkventory-social-card-de.png` | 1 200 × 630 | 50 638 | `4fce7df31fddd0f0ec0f506cb91645290fdc7791eac54f7564a8837f5782382e` | Raster allemand |
| `frontend/public/parkventory-social-card-lb.png` | 1 200 × 630 | 51 541 | `541ff3f75dd95ecdcf32ce6d68631dfd4c7180d37a27b1c62aa41ebd2c576e51` | Raster luxembourgeois |

`npm run brand:sync` injecte uniquement en mémoire les octets exacts du symbole
canonique et de la police Inter verrouillée. `opentype.js` `2.0.0` vectorise les
trois nœuds texte avant que Sharp `0.35.3` produise un PNG truecolor, sans
dépendre des polices système ni d'une palette variable selon la plateforme.
`npm run brand:check`, appelé par `npm run verify`, compare ensuite chaque ancre
et dérivé aux octets attendus. Le test Node refuse tout nœud `<text>` transmis
au rasteriseur. Un checkout neuf n'a besoin que du `npm ci` racine pour exécuter
ces commandes ; macOS arm64 et Linux x64 produisent le même SHA-256 public.

Le raster de la langue active est consommé par les métadonnées Open Graph,
Twitter et JSON-LD à l’URL stable
`https://parkventory.com/parkventory-social-card-{lang}.png`. Chaque carte ne
contient que le nom Parkventory et la traduction de la promesse existante.
Elle ne présente ni métrique, ni logo client, ni témoignage, ni assertion que
le parcours de validation à deux membres est terminé.

## Icônes d’installation

| Artefact | Dimensions | Octets | SHA-256 | Usage |
| --- | ---: | ---: | --- | --- |
| `frontend/public/icon-192.png` | 192 × 192 | 2 946 | `fb15cb1dd0b63ba6298cd6ef02f9ae49f903c682e1e7001779a7c8d4dbe03ce0` | Icône manifeste |
| `frontend/public/icon-512.png` | 512 × 512 | 8 381 | `07094965d6488c522cec674e8b19edf6db75e18e11ec51cc026acd796ca7139a` | Icône manifeste |
| `frontend/public/icon-maskable-512.png` | 512 × 512 | 6 979 | `82e20c040b21543e7abeba0dda9cbb5d79b43989b632f317fb10aa2e8ec73bc2` | Zone sûre maskable |
| `frontend/public/apple-touch-icon.png` | 180 × 180 | 2 761 | `6554e1b3c8fdd292c737c6b24da7f009d05c89ef45b1289de903aea00236921f` | Écran d’accueil Apple |

Ces quatre PNG sont opaques, utilisent le fond `#030504` et centrent les octets
du symbole canonique sans modifier sa géométrie ni ses couleurs.

## Co-marque Victor Buck Services

Le site officiel Victor Buck Services déclare le fichier suivant comme logo
d'organisation dans ses métadonnées structurées :

| Copie candidate | Source officielle | Dimensions | Octets | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `frontend/public/brands/victor-buck-services/logo.svg` | `https://www.victorbuckservices.com/wp-content/uploads/2022/12/logo_vbs_blue_valid.svg` | 150 × 59 | 12 978 | `396e6f894adc6eac6a6b9318a42ad13b216536b51320f94d88c7f7736b1dfc89` |

La copie du 2026-08-26 est byte-identique à la réponse officielle. Elle ne
contient que des chemins, un rectangle, un groupe et un `clipPath` : aucun
script, handler, lien ou chargement externe. Elle reste intacte ; le symbole
Parkventory est superposé par le composant React et ne modifie pas le SVG.

Les couleurs du thème (`#003595`, `#E31C79`, `#01E1FF`) proviennent de la CSS
officielle `https://www.victorbuckservices.com/wp-content/themes/vbs/css/build/app.css?ver=1.1`.
Le bleu du logo est rendu sur une plaque blanche afin de rester lisible sur les
deux thèmes, sans recoloration.

Le disclaimer public de Victor Buck Services n'accorde aucune licence générale
de réutilisation. Avant la publication du 2026-08-26, le demandeur a confirmé
explicitement disposer de l'autorisation VBS pour cet usage. Aucune pièce
juridique ni aucun master privé n'est versionné dans le dépôt ; la copie reste
traçable vers la source officielle et inchangée. Le hotlink n'est pas retenu :
il conserverait une dépendance externe sans améliorer cette traçabilité.

## Procédure avant publication

1. Confirmer auteur, droits et usages autorisés.
2. Identifier les images qui restent références et celles qui peuvent devenir
   sources de production.
3. Produire un master propre ou un nouvel asset avec provenance.
4. Optimiser AVIF/WebP/PNG depuis le master, jamais depuis un dérivé déjà
   compressé si une meilleure source existe.
5. Vérifier dimensions, poids, transparence, contraste et rendu final.
6. Livrer source, script ou paramètres, dérivés et consommateurs ensemble.

## Créations originales du prototype local

Quatre images ont été générées le 2026-07-30 avec l'outil ImageGen disponible
dans Codex, après analyse des cinq références. Elles ne reprennent ni texte,
ni logo client, ni marque tierce. Les trois planches servent uniquement de
références de mise en page ; la quatrième est la source de l'illustration servie.

| Source | Dimensions | SHA-256 | Fonction | Consommateur |
| --- | ---: | --- | --- | --- |
| `docs/assets/generated/landing-hero-reference.png` | 1672 × 941 | `842c794eba4d4aaf95e4129b90b0d87a1c657d2c6a4a6be3f3cd44e0e3ec5584` | Composition de la landing | Revue interne uniquement |
| `docs/assets/generated/landing-process-reference.png` | 1672 × 941 | `541d93d2b110b5236976a5d8248ed39317e3a3c14ce784649a4109d73e88cf24` | Section de fonctionnement | Revue interne uniquement |
| `docs/assets/generated/dashboard-reference.png` | 1672 × 941 | `28421335f021f4b045afb17e18783db7b6dffe33a6e806b93b0087ee6adee411` | Composition de l'application | Revue interne uniquement |
| `docs/assets/generated/parking-halftone-source.png` | 1672 × 941 | `d9a0c03071e3ed096d5ede66bfe2ecd1867cbee686e420658cb82403df2abfdb` | Master raster du parking tramé | WebP optimisé |

Recettes de génération conservées :

- landing : site SaaS desktop sombre en français, composition éditoriale 12
  colonnes, promesse à gauche, aperçu produit à droite, vert acide et glacier,
  sans pricing, faux clients ni revenus ;
- dashboard : application desktop dense mais lisible, rail gauche, partage et
  recherche dominants, liste accessible de disponibilités, label démo ;
- processus : vue aérienne de parking en trame d'impression, étapes simples et
  composition asymétrique, sans texte essentiel dans l'image ;
- illustration : parking aérien original, noir et ivoire, texture halftone,
  quelques voitures acide et glacier, aucun mot, logo, personne ou plaque.

Le dérivé `frontend/public/images/parking-halftone.webp` a été exporté en WebP
pour le navigateur. Il mesure 1672 × 941, pèse 459 190 octets et porte le
SHA-256 `0fe37ae630a4625b8b7b4bc033b6a27366678a922336ec7533de1c692be98eb2`.
Il est consommé par le hero de la landing, la section fonctionnement et la vue
de disponibilités du dashboard. Le retrait consiste à supprimer ce fichier et
les trois déclarations `background-image` correspondantes dans
`frontend/src/styles.css` ; les contenus et actions restent utilisables.
