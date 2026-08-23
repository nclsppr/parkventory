# ADR-0012 — garde-fous minimaux pour une bêta publique sans allowlist

- Statut : accepté
- Statut d'implémentation : implémenté et vérifié localement
- Date : 2026-08-23
- Dernière vérification : tests Quarkus locaux, profil OIDC de production et contrats statiques le 2026-08-23
- Décision de : propriétaire Parkventory
- Portée : inscription publique, sessions à cookie, invitations et frontière Caddy
- Complète : [ADR-0003](adr-0003-authentication-et-isolation.md), [ADR-0009](adr-0009-rls-et-contextes-tenant-transactionnels.md) et [ADR-0010](adr-0010-auth0-email-otp-production.md)

## Contexte

Parkventory doit pouvoir confronter rapidement son flux cœur à de vrais
utilisateurs. L'ouverture visée n'emploie ni liste blanche d'entreprises, ni
création manuelle des organisations, ni pilote fermé. Cette vitesse ne doit
cependant pas transformer une adresse personnelle partagée en tenant commun,
réactiver une personne suspendue, permettre une mutation cross-site ou offrir
un relais d'invitations sans borne.

Le parcours reste même origine : Caddy sert React et transmet `/api/*` à
Quarkus. La session applicative est un cookie `HttpOnly`, `Secure` et
`SameSite=Lax`. Le premier runtime public est prévu comme une seule instance ;
un mécanisme distribué d'anti-abus serait prématuré tant que la charge ne le
justifie pas.

## Décision

La bêta publique utilise les garde-fous suivants.

### Suspension fail-closed

- Un `user_account` `SUSPENDED` n'est jamais remis à `ACTIVE` par une nouvelle
  preuve d'email ou un nouveau code flow.
- Une `membership` `SUSPENDED` ou `LEFT` n'est jamais réactivée par la
  connexion.
- Le passage `PENDING` vers `ACTIVE` reste permis pour un compte nouvellement
  vérifié.
- Le passage `INVITED` vers `ACTIVE` exige que la connexion consomme une
  invitation exacte encore valide. La seule égalité du domaine ne suffit pas.

### Domaines ouverts par défaut, refus ciblé

Il n'existe pas d'allowlist d'entreprises. Tout domaine syntaxiquement valide
et absent de la politique de refus reste éligible à la création ou à la
résolution communautaire.

`email-domain-policy.txt` classe explicitement :

- les fournisseurs personnels partagés ;
- les services d'adresses jetables ;
- quelques racines publiques ou mutualisées qui ne doivent jamais devenir un
  tenant par elles-mêmes.

La classification s'applique aux sous-domaines des fournisseurs personnels et
jetables. Une racine publique comme `co.uk` est refusée exactement, tandis
qu'un domaine enregistré tel que `entreprise.co.uk` reste accepté. Le domaine
est converti avec IDNA et les noms incomplets ou invalides sont refusés.

Cette denylist constitue un minimum versionné, pas une garantie universelle
qu'un domaine représente une entreprise. Les faux positifs et domaines
nouvellement jetables sont corrigés vers l'avant, sans introduire une allowlist.

### Mutations même origine

Dans le profil `prod`, toute requête HTTP non sûre portant `app_session` ou le
cookie OIDC Quarkus doit présenter une origine égale à
`PARKVENTORY_WEB_BASE_URL`. Une origine différente, `Origin: null`, un
`Sec-Fetch-Site: cross-site` ou l'absence d'`Origin` avec cookie échoue en
`403` avant la ressource. Les appels serveur sans cookie restent possibles.

Cette barrière complète `SameSite=Lax`, le code flow avec `state` et l'absence
de CORS en production. Elle ne remplace ni l'autorisation objet ni la RLS.

### Limites et quotas

Le bord HTTP applique des fenêtres fixes, configurables :

- 8 entrées de connexion par IP et par 10 minutes ;
- 5 invitations par session et par 10 minutes ;
- 60 mutations sensibles par session et par minute.

Les clés IP et session sont réduites à une empreinte en mémoire. Caddy remplace
`X-Forwarded-For` par l'adresse du client immédiat afin que le navigateur ne
puisse pas choisir la clé du quota. Le backend n'est pas exposé directement.

Un second quota transactionnel, indépendant du cookie, limite chaque adhésion
à 20 demandes d'invitation réussies sur 24 heures. Un verrou transactionnel
PostgreSQL sérialise le comptage. Le rejet est HTTP `429` ; la limite courte
ajoute `Retry-After`.

Le limiteur HTTP est local au processus et borné à 50 000 compartiments. Il est
adapté au runtime mono-instance de la bêta ; plusieurs réplicas exigeraient un
quota partagé ou un contrôle au proxy.

### Navigateur et journaux

Caddy ajoute une CSP qui limite scripts, connexions, images et formulaires à la
même origine, interdit objets et framing, et autorise seulement les styles
inline nécessaires aux transformations GSAP. Le bootstrap de thème devient un
fichier JavaScript de même origine afin de ne pas ouvrir `script-src` à
`unsafe-inline`.

Le filtre de logs Caddy supprime `code`, `state` et `session_state` de la query
avant encodage. Ces paramètres OIDC ne doivent pas apparaître dans les journaux
d'accès. Les en-têtes proxy réécrivent aussi `X-Forwarded-For` plutôt que de
faire confiance à une valeur fournie par le client.

## Conséquences

L'ouverture n'attend pas une liste exhaustive de sociétés et conserve le
rattachement autonome par domaine. Les abus les plus simples, le spam
d'invitations et les réactivations involontaires échouent avec des contrôles
déterministes et testables.

Une denylist peut dériver et un limiteur mono-instance peut être contourné par
plusieurs IP ou par redémarrage. La supervision devra mesurer les `403`, `429`,
échecs OIDC et volumes d'outbox sans journaliser d'adresse complète. Un CAPTCHA,
un service de réputation ou un quota distribué ne seront ajoutés qu'après un
signal d'abus réel ou avant une réplication horizontale.

Cette décision n'approuve ni ne provisionne Auth0, SMTP, PostgreSQL Atlas ou
les secrets. Elle ne constitue pas non plus une activation de la release
Compose.

## Vérification

- tests unitaires des domaines personnels, jetables, publics et professionnels
  inconnus ;
- tests déterministes des fenêtres de débit et de leur séparation ;
- tests des décisions `Origin` et `Sec-Fetch-Site` ;
- tests PostgreSQL prouvant qu'un compte ou une adhésion suspendus restent
  suspendus dans les deux adaptateurs ;
- test d'intégration du quota quotidien d'invitations ;
- test d'image refusant un logout cross-origin avant d'accepter le même logout
  avec l'origine exacte ;
- contrat statique refusant la disparition de la CSP, de la redaction OIDC ou
  de la réécriture `X-Forwarded-For`.

Ces preuves restent locales tant que la branche n'est pas fusionnée et qu'une
release publique n'est pas déployée. La vérification live devra contrôler les
en-têtes CSP, l'absence de paramètres OIDC dans les logs et des `429` sans
bloquer les probes.

## Retour arrière

En cas de faux positif de domaine, corriger la classification et publier une
release descendante ; ne contourner la politique ni en base ni par allowlist
secrète. En cas de limite trop basse, modifier la valeur configurée avec preuve
de charge. Une panne du filtre ou une configuration d'origine invalide doit
faire échouer le démarrage ou les mutations, jamais désactiver silencieusement
la protection.

Si l'abus dépasse ces contrôles, suspendre les nouvelles connexions ou les
invitations sans réexposer le magic-link local, puis introduire une décision
distincte pour le mécanisme partagé retenu.
