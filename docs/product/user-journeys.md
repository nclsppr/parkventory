# Parcours utilisateurs MVP

## 1. Se connecter

1. Le visiteur saisit son adresse professionnelle et passe Turnstile.
2. La réponse reste générique.
3. Un lien à usage unique arrive par e-mail et expire après 15 minutes.
4. Le navigateur consomme le token par `POST`, crée l’organisation ou la rejoint,
   puis reçoit un cookie de session `HttpOnly` valable 7 jours.
5. La langue de la première connexion initialise le profil ; aux sessions
   suivantes, la préférence enregistrée restaure la route applicative
   équivalente.

## 2. Choisir sa langue

Avant connexion, le visiteur choisit sa langue depuis la landing,
l’authentification, les pages légales ou une page introuvable. Dès qu’une
session authentifiée est reconnue, ces sélecteurs disparaissent même sur une
page publique : ce choix n’est alors disponible que dans le bloc profil de
l’application connectée. Une mutation authentifiée l’enregistre sur le compte
avant de changer la route et les textes.

## 3. Déclarer et partager

1. Le membre déclare le libellé de sa place et, facultativement, son niveau.
2. Il choisit une date dans les 7 prochains jours et un horaire Europe/Paris.
3. D1 refuse un intervalle invalide ou qui chevauche un autre partage actif.
4. Le créneau apparaît immédiatement aux membres de la même organisation.

## 4. Réserver

1. Un autre membre choisit une disponibilité et confirme.
2. Le client fournit une clé d’idempotence.
3. D1 arbitre la collision : une offre ne possède qu’une réservation confirmée.
4. Le gagnant reçoit un succès ; une requête concurrente reçoit `409`.

## 5. Annuler ou retirer

Le réservataire peut annuler avant le début, ce qui rend l’offre à nouveau
disponible. Le propriétaire peut retirer une offre avant le début uniquement si
elle n’est pas réservée.

## 5. Observer et diagnostiquer le service

1. L’opérateur ouvre `/admin`, saisit son identité privée et passe Turnstile.
2. Le Worker envoie un magic link seulement si le digest normalisé correspond au
   secret configuré ; la réponse publique ne révèle jamais cette correspondance.
3. Après consommation du lien, le Worker exige une session `SYSTEM` avec rôle
   `ADMIN` et revalide le digest pour chaque lecture godmode.
4. La console présente la synthèse globale, puis les listes paginées des tenants,
   des comptes et des événements ainsi que les diagnostics classifiés.
5. L’opérateur remonte des faits et des identifiants internes pour investiguer ;
   sa seule mutation bornée est de nommer ou révoquer un administrateur de tenant.

## 6. Administrer son tenant

1. L’opérateur nomme un membre `ADMIN` depuis le détail du tenant.
2. Le membre voit une destination « Administration du tenant » dans son espace.
3. Le Worker calcule les statistiques et la liste des membres en utilisant
   exclusivement `organization_id` de la session.
4. L’admin peut activer les couleurs du tenant et, s’il existe, son logo autorisé.
5. Pour effacer un e-mail, il ouvre une confirmation qui explique la révocation
   des sessions, l’anonymisation et la conservation de l’historique métier.

## Navigation

Les destinations du membre restent Accueil, Partager et Trouver ; une quatrième
destination Administration apparaît uniquement pour un `ADMIN` de tenant. La
navigation opérateur séparée contient Vue d’ensemble, Tenants, Utilisateurs et
Opérations ; elle n’est jamais affichée aux membres.
