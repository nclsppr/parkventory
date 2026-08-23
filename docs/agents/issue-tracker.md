# Suivi des tickets : GitHub

Les tickets et les spécifications de ce dépôt vivent dans GitHub Issues. Utiliser la commande `gh` pour toutes les opérations.

## Conventions

- **Créer un ticket.** `gh issue create --title "..." --body "..."`. Utiliser un heredoc pour un corps sur plusieurs lignes.
- **Lire un ticket.** `gh issue view <number> --json number,title,body,author,createdAt,updatedAt,state,labels,comments`.
- **Lister les tickets.** `gh issue list --state open --limit 1000 --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` avec les filtres `--label` et `--state` adaptés.
- **Commenter.** `gh issue comment <number> --body "..."`.
- **Ajouter ou retirer un label.** `gh issue edit <number> --add-label "..."` ou `gh issue edit <number> --remove-label "..."`.
- **Fermer.** `gh issue close <number> --comment "..."`.

Déduire le dépôt depuis `git remote -v`. `gh` le fait automatiquement quand la commande est lancée dans le clone.

## Pull requests comme demandes de travail

**PRs as a request surface: no.** _(Passer cette valeur à `yes` si le dépôt traite les pull requests externes comme des demandes de fonctionnalité. Le skill `/triage` lit ce réglage.)_

Avec la valeur `yes`, les pull requests suivent les mêmes labels et états que les tickets, avec les commandes `gh pr` équivalentes :

- **Lire une pull request.** `gh pr view <number> --comments` et `gh pr diff <number>` pour le diff.
- **Lister les pull requests externes à trier.** `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open&per_page=100' | jq -s 'add | map(select(.author_association == "CONTRIBUTOR" or .author_association == "FIRST_TIME_CONTRIBUTOR" or .author_association == "NONE"))'`.
- **Commenter, labelliser ou fermer.** Utiliser `gh pr comment`, `gh pr edit --add-label`, `gh pr edit --remove-label` et `gh pr close`.

GitHub partage le même espace de numéros entre tickets et pull requests. Pour résoudre un numéro nu comme `#42`, lancer `gh pr view 42`, puis `gh issue view 42` si la première commande échoue.

## Quand un skill demande de publier dans le suivi

Créer un ticket GitHub.

## Quand un skill demande le ticket concerné

Lancer `gh issue view <number> --comments`.

## Opérations de repérage

Le skill `/wayfinder` utilise une carte et des tickets enfants.

- **Carte.** Un ticket unique avec le label `wayfinder:map`, contenant les sections Notes, Decisions-so-far et Fog. Le créer avec `gh issue create --label wayfinder:map`.
- **Ticket enfant.** Un ticket lié à la carte comme sous-ticket GitHub avec `gh api`. Si les sous-tickets ne sont pas disponibles, ajouter le ticket à une liste de tâches dans la carte et placer `Part of #<map>` au début de son corps. Utiliser le label `wayfinder:<type>`, où le type vaut `research`, `prototype`, `grilling` ou `task`. Une fois réclamé, le ticket est assigné au développeur qui le traite.
- **Blocage.** Utiliser les dépendances natives de GitHub. Ajouter la relation avec `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`. La valeur `<blocker-db-id>` est l'identifiant numérique de base obtenu par `gh api repos/<owner>/<repo>/issues/<n> --jq .id`, pas le numéro du ticket ni son `node_id`. Si les dépendances ne sont pas disponibles, ajouter `Blocked by: #<n>, #<n>` au début du corps.
- **Frontière de travail.** Lister les tickets enfants ouverts dans l'ordre de la carte. Écarter ceux qui ont un blocage ouvert ou une personne assignée. Le premier restant est le prochain ticket disponible.
- **Réclamation.** `gh issue edit <n> --add-assignee @me`. Cette commande est la première écriture de la session.
- **Résolution.** `gh issue comment <n> --body "<answer>"`, puis `gh issue close <n>`. Ajouter ensuite un pointeur de contexte avec son lien dans la section Decisions-so-far de la carte.
