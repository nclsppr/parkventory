# Questions ouvertes

| Question | Décision attendue avant |
| --- | --- |
| Workers Paid et conditions Email Service sont-ils acceptés ? | Activation e-mail |
| Quel sous-domaine expéditeur utiliser pour les magic links ? | Onboarding Email Service |
| Quelle procédure de sauvegarde/restauration D1 est suffisante pour la bêta ? | Cutover public |
| Le denylist de domaines personnels doit-il devenir un dataset maintenu ? | Ouverture large |
| Quand automatiser l’export complet et la suppression des faits métier au-delà de l’effacement d’e-mail tenant ? | Premières demandes externes concernées |
| Quelle durée et quelle purge automatique appliquer à `activity_event` ? | Avant que son volume rende la conservation indéfinie disproportionnée |
| Quelles autres actions correctrices sont acceptables dans la console globale ? | Avant toute nouvelle mutation godmode |

La console globale et l’administration bornée des tenants sont implémentées.
Les invitations, les plans, l’export automatisé, la suppression complète des
faits métier et les notifications métier restent explicitement différés.
