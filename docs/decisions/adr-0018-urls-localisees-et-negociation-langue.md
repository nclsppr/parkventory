# ADR-0018 — URLs localisées et négociation de langue

- Statut : accepté
- Statut d’implémentation : candidat vérifié localement, non fusionné et non déployé
- Date : 2026-08-31
- Décideur : nclsppr
- Portée : routage public et privé, SEO, interface, API et e-mails

## Contexte

Parkventory doit proposer la même expérience en français, anglais, allemand et
luxembourgeois. Une traduction uniquement choisie côté navigateur laisserait une
seule URL servir plusieurs contenus, rendrait les canoniques ambigus et ne
permettrait pas aux moteurs ou aux utilisateurs de partager une langue précise.
À l’inverse, rediriger silencieusement toute URL localisée selon le navigateur
rendrait la navigation instable et empêcherait l’utilisateur de conserver un
choix explicite.

## Décision

Les quatre langues ont des URLs stables préfixées par `fr`, `en`, `de` ou `lb`.
La langue portée par l’URL est toujours prioritaire. Les seules URLs neutres
`/`, `/privacy` et `/legal` négocient une langue avec une redirection temporaire :
le cookie de préférence passe avant `Accept-Language`, puis le français sert de
repli. Les anciennes routes françaises redirigent vers leur équivalent préfixé.

Le sélecteur de langue conserve la route, la requête et le fragment lorsqu’un
équivalent existe. Il mémorise le choix dans le stockage local pour le rendu
client et dans un cookie technique pour les redirections suivantes. Le client
transmet aussi `X-Parkventory-Locale` à l’API afin de localiser les erreurs, les
dates de compatibilité et les e-mails de connexion. Les valeurs temporelles
brutes restent dans le contrat API et le navigateur les présente avec `Intl`.

Les trois familles de pages publiques — accueil, confidentialité et mentions
légales — publient chacune quatre canoniques auto-référents, des liens
`hreflang` réciproques et un `x-default` neutre, soit douze URLs dans le sitemap.
Les routes applicatives, l’authentification, les aperçus et les pages 404 restent
hors index ; une route inconnue répond réellement en HTTP `404`. Le Worker
injecte les métadonnées et un contenu visible issu des mêmes catalogues dans le
HTML initial, puis force HTTPS ainsi que l’apex canonique avant tout autre
routage. Les validateurs du shell sont retirés après transformation ; une 404
dont la langue est négociée varie explicitement sur `Accept-Language` et le
cookie de préférence.

Turnstile reçoit `fr`, `en` ou `de`. Comme le fournisseur ne propose pas `lb`,
le widget luxembourgeois utilise explicitement le français sans modifier la
langue du reste de la page.

## Conséquences

Chaque contenu public peut être partagé et indexé dans une langue déterministe.
Un changement de navigateur ne remplace jamais un choix d’URL explicite. Les
catalogues, métadonnées, cartes sociales, manifestes, réponses API et e-mails
doivent conserver une parité stricte entre quatre langues.

Le coût est un plus grand nombre de routes et d’artefacts à tester, ainsi qu’un
cookie de préférence non sensible à documenter. Toute nouvelle page publique
doit ajouter quatre traductions et un groupe `hreflang` complet avant d’entrer
dans le sitemap.

## Retour arrière

Une langue peut être retirée en redirigeant définitivement ses URLs vers une
version conservée, mais supprimer tous les préfixes exigerait un plan de
redirections et ferait perdre les canoniques déjà publiés. Cette décision est
donc considérée comme coûteuse à renverser après mise en production.
