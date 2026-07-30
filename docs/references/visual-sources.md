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

Le JPEG du logo :

- comporte un fond noir et un halo ;
- présente des artefacts de compression ;
- ne définit pas de wordmark ;
- ne fournit ni monochrome, ni petite taille, ni zone de protection ;
- n'est pas un SVG exploitable comme master.

La future reconstruction doit partir de la géométrie approuvée, pas d'une
vectorisation automatique du halo. Les dérivés seront inventoriés avec source,
outil, version, dimensions, consommateurs et procédure de retrait.

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
