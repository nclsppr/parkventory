# Sécurité et isolation

## Authentification

- Turnstile est validé côté Worker avant l’envoi d’un lien.
- Le magic link contient 256 bits aléatoires ; seul son SHA-256 est stocké.
- Le lien expire après 15 minutes, est consommé par `POST` et ne fonctionne
  qu’une fois afin que les scanners d’e-mail ne le consomment pas en `GET`.
- Le cookie de session est opaque, `HttpOnly`, `SameSite=Lax`, `Secure` hors
  développement et expire après 7 jours.
- Les mutations refusent une origine différente.

## Tenancy

L’organisation est déterminée après validation de l’adresse professionnelle.
Chaque requête métier charge la session, le membre et `organization_id` côté
serveur. Toutes les lectures et mutations lient explicitement l’organisation ;
des contraintes et triggers D1 renforcent les invariants critiques.

## Minimisation

Les tokens, cookies et adresses ne sont jamais journalisés. Parkventory ne
collecte ni motif d’absence, ni plaque, ni calendrier, ni géolocalisation. Les
réponses de demande de lien restent génériques pour limiter l’énumération.
