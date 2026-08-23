# ADR-0014 — Resend pour les e-mails de la bêta publique

- Statut : accepté
- Statut d'implémentation : configuration applicative prête ; compte, domaine et clés non provisionnés
- Date : 2026-08-23
- Décideur : nclsppr
- Portée : OTP Auth0, invitations et notifications transactionnelles
- Complète : [ADR-0010](adr-0010-auth0-email-otp-production.md) et [ADR-0011](adr-0011-beta-publique-en-libre-service.md)

## Contexte

La bêta publique dépend des e-mails OTP Auth0 pour connecter les utilisateurs et
des e-mails Quarkus pour les invitations et notifications. Le fournisseur Auth0
intégré est limité à dix e-mails par minute, ne permet pas de personnaliser
l'expéditeur et n'est pas destiné à la production. Maintenir deux prestataires
retarderait l'ouverture et doublerait les secrets, les preuves DNS et les
procédures de délivrabilité.

Resend est directement pris en charge par Auth0 et expose également un relais
SMTP compatible avec le mailer Quarkus. Son offre gratuite courante fournit
3 000 e-mails transactionnels par mois, dans la limite de 100 par jour, ce qui
est suffisant pour observer la demande initiale sans engagement payant.

## Décision

Retenir Resend comme premier transport transactionnel de la bêta publique.
Cette décision technique n'affirme pas qu'un compte, une clé ou un domaine est
déjà créé et n'accepte pas les conditions du fournisseur à la place du
propriétaire.

- Vérifier le sous-domaine `notifications.parkventory.com` afin d'isoler sa
  réputation et ses enregistrements de celle du courrier OVH existant sur le
  domaine racine.
- Utiliser `Parkventory <no-reply@notifications.parkventory.com>` pour l'OTP,
  les invitations et les notifications. L'adresse de contact des personnes
  reste distincte et doit accepter les réponses.
- Relier Auth0 à son intégration Resend native avec une clé dédiée au tenant.
- Relier le backend à `smtp.resend.com` sur le port `587`, avec STARTTLS requis,
  l'utilisateur `resend` et une seconde clé dédiée comme mot de passe SMTP.
- Ne jamais placer les clés dans Git, une variable non protégée, une commande
  affichée ou un ticket. La clé SMTP est injectée dans le fichier secret Atlas
  déjà prévu ; la clé Auth0 reste dans la configuration protégée du fournisseur.
- Laisser le suivi d'ouverture et de clic désactivé. Parkventory n'en a pas
  besoin pour fournir le service et ne doit pas ajouter de collecte marketing.
- Conserver l'offre gratuite tant que les limites sont compatibles avec
  l'usage. Une hausse de plan est une décision de coût séparée, précédée d'une
  mesure du volume et d'une alerte avant épuisement.

## DNS et délivrabilité

Les valeurs SPF, DKIM et MX sont générées par Resend et doivent être recopiées
exactement sur le sous-domaine. Aucun enregistrement MX ou SPF racine existant
ne doit être supprimé ou remplacé. Une politique DMARC initiale d'observation
peut être ajoutée sur le sous-domaine, puis durcie après preuve de livraison.

L'activation attend les preuves suivantes :

1. statut Resend `verified` pour SPF et DKIM ;
2. OTP Auth0 reçu et consommé par au moins deux fournisseurs de boîte mail ;
3. invitation Quarkus reçue, sans token Parkventory dans son URL ;
4. expéditeur, sujet et lien HTTPS exacts, sans suivi d'ouverture ni de clic ;
5. erreur d'authentification SMTP visible dans l'alerte opérationnelle, sans
   exposer la clé ni l'adresse du destinataire dans les journaux ;
6. quota journalier surveillé et hausse de plan non automatique.

Si le domaine ou le transport n'est pas vérifié, la production dynamique reste
désactivée. Le fournisseur Auth0 intégré peut servir une recette bornée, mais
ne devient pas le transport de la bêta publique.

## Conséquences

Cette option réduit le délai et réutilise un seul domaine d'envoi, mais conserve
une dépendance externe supplémentaire et une limite quotidienne basse. Le
backend garde son contrat SMTP générique : un changement de fournisseur ne
demande ni nouvelle route publique ni migration de données.

## Références

- [Auth0 — fournisseurs e-mail SMTP](https://auth0.com/docs/customize/email/smtp-email-providers)
- [Resend — intégration Auth0](https://resend.com/docs/send-with-auth0)
- [Resend — envoi par SMTP](https://resend.com/docs/send-with-smtp)
- [Resend — vérification des domaines](https://resend.com/docs/dashboard/domains/introduction)
- [Resend — quotas et limites](https://resend.com/docs/knowledge-base/account-quotas-and-limits)
