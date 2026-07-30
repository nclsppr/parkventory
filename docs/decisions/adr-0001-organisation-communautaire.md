# ADR-0001 : organisation communautaire sans administrateur obligatoire

- Statut : accepté
- Statut d'implémentation : non commencé
- Date : 2026-07-30
- Dernière vérification : décision documentaire relue le 2026-07-30
- Propriétaire : nclsppr
- Domaine : produit et sécurité
- Remplace : aucune
- Remplacé par : aucune

## Contexte

La valeur de Parkventory doit apparaître sans vente, import RH ni
configuration des services généraux. Pourtant, nommer le premier administrateur
sans preuve créerait une escalade de privilège.

L'email professionnel vérifié permet de former une communauté, mais ne prouve
pas que le premier inscrit représente l'entreprise.

## Problème à décider

Une organisation peut-elle démarrer et fonctionner sans administrateur, et
comment acquiert-elle ensuite une gouvernance sûre ?

## Critères

- self-service immédiat ;
- aucun pouvoir indu pour le premier inscrit ;
- fonctions cœur disponibles avec zéro administrateur ;
- récupération et enrichissement possibles plus tard ;
- promotions auditables et révocables ;
- aucune révélation de communauté avant authentification.

## Options considérées

### Option A : administrateur avant tout usage

Un représentant prouve le domaine, configure l'espace puis invite les membres.
La gouvernance est nette, mais la promesse self-service disparaît et le coût
d'adoption précède toute valeur.

### Option B : premier inscrit automatiquement administrateur

L'onboarding est rapide, mais une personne sans mandat obtient des droits sur
les collègues, les sites et les affectations. Cette option est refusée.

### Option C : communauté avec zéro administrateur

Les membres partagent et réservent dans leur propre périmètre. Le premier admin
arrive plus tard après preuve de contrôle du domaine ou validation opérateur
autorisée. Cette option sépare usage quotidien et gouvernance.

### Option minimale : invitations gérées par Parkventory

L'opérateur crée chaque organisation et chaque premier membre. Cela simplifie
le modèle mais transforme le service en onboarding manuel non scalable.

## Décision

Adopter l'option C.

- Une organisation peut compter zéro administrateur.
- Le premier inscrit reste `MEMBER`.
- Un membre gère ses propres affectations, offres et réservations.
- Un administrateur existant peut en nommer d'autres.
- Sans administrateur, la première promotion exige une preuve de contrôle du
  domaine, de préférence DNS TXT, ou une validation opérateur autorisée.
- Retirer le dernier administrateur ramène l'organisation en mode communautaire.
- Toute promotion, révocation ou récupération est auditée.

La méthode précise et l'UX de preuve du premier administrateur sont différées à
F06 ; cette fonction ne bloque pas le flux cœur.

## Conséquences

### Positives

- adoption sans coordination centrale ;
- promesse utilisateur prouvable plus tôt ;
- pas de super-admin accidentel ;
- administration ajoutée sans migration du modèle principal.

### Négatives

- les données globales restent moins structurées avant administration ;
- les conflits d'affectation nécessitent suspension ou support ;
- la première récupération exige un mécanisme spécifique.

### Risques

- confusion entre domaine email et entité juridique ;
- déclaration abusive d'une place ;
- opérateur utilisé comme arbitre sans autorité suffisante.

## Mise en œuvre

1. Autoriser une organisation `COMMUNITY` sans membre admin.
2. Limiter les commandes membre à leurs propres objets.
3. Prévoir signalement et suspension d'une affectation contestée.
4. Modéliser `admin_claim` sans activer de promotion automatique.
5. Implémenter preuve et audit en F06.
6. Tester le retrait du dernier admin.

## Vérification

- Commandes : tests d'intégration de permissions et E2E du flux communautaire.
- Environnements : PostgreSQL réel via Testcontainers, puis préproduction.
- Résultat attendu : partage et réservation sans admin ; aucune commande globale
  autorisée ; promotion sans preuve refusée.
- Preuve observée : aucune, implémentation non commencée.
- Limites de la preuve : l'ADR valide l'intention, pas un comportement livré.

## Rollback

Si le mode communautaire ne peut pas être sécurisé, suspendre la création
automatique de nouvelles organisations et passer temporairement à l'invitation
ou à la preuve préalable. Conserver comptes, adhésions et historiques ; ne
promouvoir personne automatiquement pendant la transition.

## Réexamen

Réexaminer si :

- un pilote exige un administrateur légal avant tout usage ;
- les conflits de places deviennent fréquents ;
- la preuve de domaine s'avère impraticable ;
- la juridiction cible impose un responsable nommé.

## Références

- [Vision produit](../product/vision.md)
- [Rôles et gouvernance](../product/roles-and-governance.md)
- [Règles métier](../product/business-rules.md)
