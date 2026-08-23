# ADR-0011 — Ouvrir une bêta publique en libre-service

- Statut : accepté
- Statut d'implémentation : préparation en cours ; production dynamique non activée
- Date : 2026-08-23
- Décideur : nclsppr
- Portée : première ouverture de Parkventory à de vrais utilisateurs
- Complète : [ADR-0008](adr-0008-release-applicative-immuable-atlas.md), [ADR-0009](adr-0009-rls-et-contextes-tenant-transactionnels.md) et [ADR-0010](adr-0010-auth0-email-otp-production.md)

## Contexte

Parkventory dispose d'une démo statique, d'un parcours local persistant et d'un
candidat applicatif immuable. Attendre la totalité de F05 à F07 avant de
confronter le service à de vrais usages ferait investir dans des raffinements
dont la valeur n'est pas encore prouvée.

Le premier lancement ne sera pas un pilote fermé. Le service doit être
accessible publiquement et permettre à toute personne éligible de créer ou
rejoindre son organisation sans intervention de l'opérateur.

## Décision

Parkventory ouvre d'abord une **bêta publique** en français, destinée aux
personnes disposant d'une adresse professionnelle vérifiée. Aucune liste blanche
d'entreprises n'est requise. Les domaines personnels ou jetables sont refusés
pour éviter qu'ils ne deviennent un tenant partagé ; une invitation exacte peut
toujours rattacher un prestataire à l'organisation qui l'invite.

La première version reste volontairement bornée :

- parcours essentiel : se connecter, déclarer une place, publier une
  disponibilité, trouver, réserver, annuler et retirer une offre ;
- création communautaire d'une organisation à partir d'un domaine
  professionnel vérifié, sans administrateur obligatoire ;
- interface et support en français ; site initial en `Europe/Paris` tant qu'un
  onboarding explicite du fuseau n'est pas livré ;
- aucune carte, monétisation, application native, SSO d'entreprise ou
  administration avancée ;
- mention « Bêta publique » visible et communication honnête sur les limites.

## Barrières de lancement minimales

L'ouverture publique n'attend pas la perfection, mais elle attend les contrôles
dont l'absence pourrait mélanger les données, bloquer durablement un utilisateur
ou rendre l'exploitation aveugle :

1. identité OIDC réelle, email vérifié, sessions révocables et adaptateur local
   absent de l'image de production ;
2. RLS forcée sous un rôle runtime non propriétaire et sans `BYPASSRLS`, avec
   matrice tenant A/B sur la base réellement provisionnée ;
3. quotas et rate limits sur l'authentification, les invitations et les
   mutations sensibles, refus des domaines personnels/jetables et réponses
   anti-énumération ;
4. exclusion PostgreSQL et test concurrent donnant exactement un gagnant pour
   une même place et un même intervalle ;
5. annulation d'une réservation et retrait contrôlé d'une offre afin qu'aucune
   disponibilité ne reste bloquée sans recours ;
6. sauvegarde quotidienne, restauration isolée réussie et procédure de rollback
   applicatif simple ;
7. probes de santé publiques et internes, journaux sans email ni jeton, alerte
   d'indisponibilité effectivement reçue ;
8. notice de confidentialité et mentions légales minimales, contact opérateur,
   procédure manuelle d'accès/suppression et durées initiales documentées ;
9. parcours critique vérifié au clavier, sur un mobile réel et sur un navigateur
   desktop avant le cutover.

## Dette explicitement différée

Après l'ouverture, l'usage réel pilote l'ordre d'amélioration. Peuvent suivre :

- automatisation de l'export, de la suppression et des purges ;
- audit d'accessibilité exhaustif et matrice complète des navigateurs ;
- PITR, object lock et scénarios de reprise avancés au-delà de la sauvegarde
  restaurable minimale ;
- observabilité métier détaillée, administration, cartographie et fuseaux
  multiples ;
- blue/green sans interruption, tant qu'une fenêtre de maintenance courte et un
  rollback vérifié sont annoncés pour la bêta.

Cette dette ne permet pas de collecter plus de données que le MVP, de supprimer
la transparence minimale ou de désactiver l'isolation tenant.

## Activation et retour arrière

Le cutover reste exclusif : la promotion statique est d'abord désactivée, puis
le candidat applicatif exact est migré et sondé avant de recevoir la route. La
démo statique et Compose ne doivent jamais servir simultanément le même domaine.

L'ouverture est suspendue si l'identité réelle, la RLS, la réservation, la
sauvegarde restaurable ou les probes publiques échouent. Le retour arrière
retire la route applicative sans réexposer l'adaptateur d'identité local et sans
effacer la base.

