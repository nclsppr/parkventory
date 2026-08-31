# Questions ouvertes

| Question | Décision attendue avant |
| --- | --- |
| Workers Paid et conditions Email Service sont-ils acceptés ? | Activation e-mail |
| Quel sous-domaine expéditeur utiliser pour les magic links ? | Onboarding Email Service |
| Quelle procédure de sauvegarde/restauration D1 est suffisante pour la bêta ? | Cutover public |
| Le denylist de domaines personnels doit-il devenir un dataset maintenu ? | Ouverture large |
| Quand automatiser export et suppression des comptes ? | Premiers utilisateurs externes |
| Quelle durée et quelle purge automatique appliquer à `activity_event` ? | Avant que son volume rende la conservation indéfinie disproportionnée |
| Quelles actions correctrices, confirmations et traces sont acceptables dans la console ? | Avant toute mutation godmode |

La console globale d’observation est décidée par l’ADR-0018 ; son activation reste
conditionnée par la migration, le secret et un parcours réel vérifié.
L’administration autonome des tenants, les invitations, les plans et les
notifications métier restent explicitement différés.
