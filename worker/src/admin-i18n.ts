import type { Locale } from "../../shared/i18n";
import { requestLocale, serverMessage } from "./i18n";

const fr = {
  godmodeForbidden: "Cet espace est réservé à l’opérateur Parkventory.",
  invalidTenantSearch: "Les paramètres de pagination ou de recherche ne sont pas valides.",
  invalidTenantMembershipIdentifiers: "Les identifiants de l’organisation ou du membre ne sont pas valides.",
  invalidRole: "Le rôle demandé n’est pas valide.",
  memberNotFoundInTenant: "Ce membre n’existe pas dans cette organisation.",
  erasedMemberCannotBecomeAdmin: "Un compte dont l’adresse a été effacée ne peut pas devenir administrateur.",
  roleChangedConcurrently: "Le rôle de ce membre vient de changer. Actualisez la page et réessayez.",
  memberPromoted: "Le membre est maintenant administrateur de l’organisation.",
  memberDemoted: "Le membre est maintenant utilisateur de l’organisation.",
  invalidTenantIdentifier: "L’identifiant de l’organisation n’est pas valide.",
  tenantNotFound: "Cette organisation n’existe pas.",
  invalidUserFilters: "Les filtres utilisateurs ne sont pas valides.",
  invalidActivityFilters: "Les filtres d’activité ne sont pas valides.",
  invalidIntegrityCheck: "Le contrôle d’intégrité demandé n’est pas valide.",
  invalidIntegrityCursor: "Le curseur du contrôle d’intégrité n’est pas valide.",
  databaseUnavailable: "La base de données n’est pas disponible.",
  tenantAdminForbidden: "Cet espace est réservé aux administrateurs de votre organisation.",
  tenantGone: "Cette organisation n’existe plus.",
  invalidMemberSearch: "Les paramètres de recherche ne sont pas valides.",
  invalidBranding: "La configuration de marque n’est pas valide.",
  invalidHexColors: "Les couleurs doivent utiliser le format hexadécimal #RRGGBB.",
  logoNotAuthorized: "Aucun logo de l’organisation n’a encore été autorisé par Parkventory.",
  brandingUpdated: "L’identité visuelle de l’organisation a été mise à jour.",
  invalidMembershipIdentifier: "L’identifiant du membre n’est pas valide.",
  eraseConfirmationRequired: "La confirmation d’effacement est requise.",
  cannotEraseOwnEmail: "Vous ne pouvez pas effacer votre propre adresse depuis cet espace.",
  memberNotFoundInOwnTenant: "Ce membre n’existe pas dans votre organisation.",
  cannotEraseAdminEmail: "Le compte d’un administrateur ne peut pas être effacé ici.",
  emailAlreadyErased: "Cette adresse a déjà été effacée.",
  multiTenantEraseRequiresSupport: "Ce compte est rattaché à plusieurs organisations et doit être traité par Parkventory.",
  emailErased: "L’adresse e-mail a été effacée et les sessions du compte ont été supprimées. L’historique métier est conservé.",
  deletedAccount: "Compte supprimé",
} as const;

export type AdminMessageKey = keyof typeof fr;
type AdminMessageCatalog = Record<AdminMessageKey, string>;

const messages = {
  fr,
  en: {
    godmodeForbidden: "This area is reserved for the Parkventory operator.",
    invalidTenantSearch: "The pagination or search parameters are invalid.",
    invalidTenantMembershipIdentifiers: "The organisation or member identifiers are invalid.",
    invalidRole: "The requested role is invalid.",
    memberNotFoundInTenant: "This member does not exist in this organisation.",
    erasedMemberCannotBecomeAdmin: "An account whose email address has been erased cannot become an administrator.",
    roleChangedConcurrently: "This member’s role has just changed. Refresh the page and try again.",
    memberPromoted: "The member is now an organisation administrator.",
    memberDemoted: "The member is now an organisation user.",
    invalidTenantIdentifier: "The organisation identifier is invalid.",
    tenantNotFound: "This organisation does not exist.",
    invalidUserFilters: "The user filters are invalid.",
    invalidActivityFilters: "The activity filters are invalid.",
    invalidIntegrityCheck: "The requested integrity check is invalid.",
    invalidIntegrityCursor: "The integrity check cursor is invalid.",
    databaseUnavailable: "The database is unavailable.",
    tenantAdminForbidden: "This area is reserved for your organisation’s administrators.",
    tenantGone: "This organisation no longer exists.",
    invalidMemberSearch: "The search parameters are invalid.",
    invalidBranding: "The branding configuration is invalid.",
    invalidHexColors: "Colours must use the #RRGGBB hexadecimal format.",
    logoNotAuthorized: "No organisation logo has been approved by Parkventory yet.",
    brandingUpdated: "The organisation’s visual identity has been updated.",
    invalidMembershipIdentifier: "The member identifier is invalid.",
    eraseConfirmationRequired: "Erasure confirmation is required.",
    cannotEraseOwnEmail: "You cannot erase your own address from this area.",
    memberNotFoundInOwnTenant: "This member does not exist in your organisation.",
    cannotEraseAdminEmail: "An administrator account cannot be erased here.",
    emailAlreadyErased: "This address has already been erased.",
    multiTenantEraseRequiresSupport: "This account belongs to several organisations and must be handled by Parkventory.",
    emailErased: "The email address has been erased and the account sessions have been deleted. Business history has been retained.",
    deletedAccount: "Deleted account",
  },
  de: {
    godmodeForbidden: "Dieser Bereich ist dem Parkventory-Systemoperator vorbehalten.",
    invalidTenantSearch: "Die Paginierungs- oder Suchparameter sind ungültig.",
    invalidTenantMembershipIdentifiers: "Die Kennungen der Organisation oder des Mitglieds sind ungültig.",
    invalidRole: "Die angeforderte Rolle ist ungültig.",
    memberNotFoundInTenant: "Dieses Mitglied existiert in dieser Organisation nicht.",
    erasedMemberCannotBecomeAdmin: "Ein Konto, dessen E-Mail-Adresse gelöscht wurde, kann nicht zum Administrator ernannt werden.",
    roleChangedConcurrently: "Die Rolle dieses Mitglieds wurde gerade geändert. Aktualisieren Sie die Seite und versuchen Sie es erneut.",
    memberPromoted: "Das Mitglied ist jetzt Administrator der Organisation.",
    memberDemoted: "Das Mitglied ist jetzt Benutzer der Organisation.",
    invalidTenantIdentifier: "Die Organisationskennung ist ungültig.",
    tenantNotFound: "Diese Organisation existiert nicht.",
    invalidUserFilters: "Die Benutzerfilter sind ungültig.",
    invalidActivityFilters: "Die Aktivitätsfilter sind ungültig.",
    invalidIntegrityCheck: "Die angeforderte Integritätsprüfung ist ungültig.",
    invalidIntegrityCursor: "Der Cursor der Integritätsprüfung ist ungültig.",
    databaseUnavailable: "Die Datenbank ist nicht verfügbar.",
    tenantAdminForbidden: "Dieser Bereich ist den Administratoren Ihrer Organisation vorbehalten.",
    tenantGone: "Diese Organisation existiert nicht mehr.",
    invalidMemberSearch: "Die Suchparameter sind ungültig.",
    invalidBranding: "Die Markenkonfiguration ist ungültig.",
    invalidHexColors: "Die Farben müssen das hexadezimale Format #RRGGBB verwenden.",
    logoNotAuthorized: "Parkventory hat noch kein Logo dieser Organisation freigegeben.",
    brandingUpdated: "Das visuelle Erscheinungsbild der Organisation wurde aktualisiert.",
    invalidMembershipIdentifier: "Die Mitgliedskennung ist ungültig.",
    eraseConfirmationRequired: "Die Bestätigung der Löschung ist erforderlich.",
    cannotEraseOwnEmail: "Sie können Ihre eigene Adresse in diesem Bereich nicht löschen.",
    memberNotFoundInOwnTenant: "Dieses Mitglied existiert in Ihrer Organisation nicht.",
    cannotEraseAdminEmail: "Das Konto eines Administrators kann hier nicht gelöscht werden.",
    emailAlreadyErased: "Diese Adresse wurde bereits gelöscht.",
    multiTenantEraseRequiresSupport: "Dieses Konto gehört zu mehreren Organisationen und muss von Parkventory bearbeitet werden.",
    emailErased: "Die E-Mail-Adresse wurde gelöscht und die Sitzungen des Kontos wurden entfernt. Die Geschäftshistorie bleibt erhalten.",
    deletedAccount: "Gelöschtes Konto",
  },
  lb: {
    godmodeForbidden: "Dëse Beräich ass fir de Systemoperateur vu Parkventory reservéiert.",
    invalidTenantSearch: "D’Parameter fir d'Säitenandeelung oder d'Sich sinn net valabel.",
    invalidTenantMembershipIdentifiers: "D’Kennunge vun der Organisatioun oder vum Member sinn net valabel.",
    invalidRole: "Déi ugefrote Roll ass net valabel.",
    memberNotFoundInTenant: "Dëse Member gëtt et net an dëser Organisatioun.",
    erasedMemberCannotBecomeAdmin: "E Kont, deem seng E-Mail-Adress geläscht gouf, kann net Administrateur ginn.",
    roleChangedConcurrently: "D’Roll vun dësem Member gouf grad geännert. Aktualiséiert d'Säit a probéiert et nach eng Kéier.",
    memberPromoted: "De Member ass elo Administrateur vun der Organisatioun.",
    memberDemoted: "De Member ass elo Benotzer vun der Organisatioun.",
    invalidTenantIdentifier: "D’Kennung vun der Organisatioun ass net valabel.",
    tenantNotFound: "Dës Organisatioun gëtt et net.",
    invalidUserFilters: "D’Benotzerfiltere sinn net valabel.",
    invalidActivityFilters: "D’Aktivitéitsfiltere sinn net valabel.",
    invalidIntegrityCheck: "Déi ugefrot Integritéitskontroll ass net valabel.",
    invalidIntegrityCursor: "De Cursor vun der Integritéitskontroll ass net valabel.",
    databaseUnavailable: "D’Datebank ass net disponibel.",
    tenantAdminForbidden: "Dëse Beräich ass fir d’Administrateure vun Ärer Organisatioun reservéiert.",
    tenantGone: "Dës Organisatioun gëtt et net méi.",
    invalidMemberSearch: "D’Sichparameter sinn net valabel.",
    invalidBranding: "D’Markekonfiguratioun ass net valabel.",
    invalidHexColors: "D’Faarwe mussen dat hexadezimalt Format #RRGGBB benotzen.",
    logoNotAuthorized: "Parkventory huet nach kee Logo vun dëser Organisatioun autoriséiert.",
    brandingUpdated: "D’visuell Identitéit vun der Organisatioun gouf aktualiséiert.",
    invalidMembershipIdentifier: "D’Kennung vum Member ass net valabel.",
    eraseConfirmationRequired: "D’Bestätegung fir d'Läschen ass néideg.",
    cannotEraseOwnEmail: "Dir kënnt Är eegen Adress net an dësem Beräich läschen.",
    memberNotFoundInOwnTenant: "Dëse Member gëtt et net an Ärer Organisatioun.",
    cannotEraseAdminEmail: "De Kont vun engem Administrateur kann hei net geläscht ginn.",
    emailAlreadyErased: "Dës Adress gouf scho geläscht.",
    multiTenantEraseRequiresSupport: "Dëse Kont gehéiert zu e puer Organisatiounen a muss vu Parkventory traitéiert ginn.",
    emailErased: "D’E-Mail-Adress gouf geläscht an d'Sessioune vum Kont goufen ewechgeholl. D'Geschäftshistorik bleift erhalen.",
    deletedAccount: "Geläschte Kont",
  },
} as const satisfies Record<Locale, AdminMessageCatalog>;

export const adminMessageKeys = Object.freeze(Object.keys(fr) as AdminMessageKey[]);

export function adminMessage(locale: Locale, key: AdminMessageKey): string {
  return messages[locale][key];
}

export function adminDisplayName(locale: Locale, displayName: unknown, emailErasedAt: unknown): string {
  return emailErasedAt === null || emailErasedAt === undefined
    ? String(displayName)
    : adminMessage(locale, "deletedAccount");
}

export function adminProblem(request: Request, status: number, key: AdminMessageKey): Response {
  const locale = requestLocale(request);
  return Response.json({
    type: "about:blank",
    title: serverMessage(locale, status >= 500 ? "serviceErrorTitle" : "requestRejectedTitle"),
    status,
    detail: adminMessage(locale, key),
  }, { status });
}

export const adminIntegrityCheckKeys = [
  "tenant_without_member",
  "spot_owner_tenant_mismatch",
  "offer_spot_owner_mismatch",
  "reservation_offer_member_mismatch",
  "active_offer_overlap",
  "multiple_confirmed_reservations",
  "system_organization_count",
  "system_membership_invalid",
  "system_business_data",
] as const;

export type AdminIntegrityCheckKey = typeof adminIntegrityCheckKeys[number];
type IntegrityMessageCatalog = Record<AdminIntegrityCheckKey, { label: string; detail: string }>;

const integrityMessages = {
  fr: {
    tenant_without_member: {
      label: "Organisations sans membre",
      detail: "Chaque organisation issue d’une connexion vérifiée devrait contenir au moins un membre.",
    },
    spot_owner_tenant_mismatch: {
      label: "Places et propriétaires incohérents",
      detail: "La place et son propriétaire doivent appartenir à la même organisation.",
    },
    offer_spot_owner_mismatch: {
      label: "Partages et places incohérents",
      detail: "Chaque partage doit référencer la place et le propriétaire de son organisation.",
    },
    reservation_offer_member_mismatch: {
      label: "Réservations inter-organisations ou invalides",
      detail: "L’offre et le réservataire doivent appartenir à la même organisation, sans auto-réservation.",
    },
    active_offer_overlap: {
      label: "Chevauchements de partages actifs",
      detail: "Une place ne doit pas avoir deux créneaux publiés qui se chevauchent.",
    },
    multiple_confirmed_reservations: {
      label: "Réservations confirmées multiples",
      detail: "Une offre ne doit avoir qu’une réservation confirmée.",
    },
    system_organization_count: {
      label: "Organisation système unique",
      detail: "Il doit exister exactement une organisation SYSTEM avec son identité interne réservée.",
    },
    system_membership_invalid: {
      label: "Opérateur système unique",
      detail: "L’organisation SYSTEM accepte au plus un membre, obligatoirement ADMIN.",
    },
    system_business_data: {
      label: "Données métier dans SYSTEM",
      detail: "L’organisation SYSTEM ne doit contenir aucune place, offre ou réservation.",
    },
  },
  en: {
    tenant_without_member: {
      label: "Organisations without members",
      detail: "Every organisation created from a verified sign-in should contain at least one member.",
    },
    spot_owner_tenant_mismatch: {
      label: "Inconsistent parking spaces and owners",
      detail: "The parking space and its owner must belong to the same organisation.",
    },
    offer_spot_owner_mismatch: {
      label: "Inconsistent shares and parking spaces",
      detail: "Every share must reference the parking space and owner from its organisation.",
    },
    reservation_offer_member_mismatch: {
      label: "Cross-organisation or invalid bookings",
      detail: "The offer and the person booking it must belong to the same organisation, without self-booking.",
    },
    active_offer_overlap: {
      label: "Overlapping active shares",
      detail: "A parking space must not have two overlapping published time slots.",
    },
    multiple_confirmed_reservations: {
      label: "Multiple confirmed bookings",
      detail: "An offer must have only one confirmed booking.",
    },
    system_organization_count: {
      label: "Unique system organisation",
      detail: "Exactly one SYSTEM organisation with its reserved internal identity must exist.",
    },
    system_membership_invalid: {
      label: "Unique system operator",
      detail: "The SYSTEM organisation may contain at most one member, who must be an ADMIN.",
    },
    system_business_data: {
      label: "Business data in SYSTEM",
      detail: "The SYSTEM organisation must not contain any parking spaces, offers or bookings.",
    },
  },
  de: {
    tenant_without_member: {
      label: "Organisationen ohne Mitglieder",
      detail: "Jede aus einer verifizierten Anmeldung hervorgegangene Organisation sollte mindestens ein Mitglied enthalten.",
    },
    spot_owner_tenant_mismatch: {
      label: "Inkonsistente Parkplätze und Eigentümer",
      detail: "Der Parkplatz und sein Eigentümer müssen derselben Organisation angehören.",
    },
    offer_spot_owner_mismatch: {
      label: "Inkonsistente Freigaben und Parkplätze",
      detail: "Jede Freigabe muss auf den Parkplatz und den Eigentümer ihrer Organisation verweisen.",
    },
    reservation_offer_member_mismatch: {
      label: "Organisationsübergreifende oder ungültige Reservierungen",
      detail: "Angebot und reservierende Person müssen derselben Organisation angehören; Selbstreservierungen sind ausgeschlossen.",
    },
    active_offer_overlap: {
      label: "Überlappende aktive Freigaben",
      detail: "Ein Parkplatz darf keine zwei sich überschneidenden veröffentlichten Zeitfenster haben.",
    },
    multiple_confirmed_reservations: {
      label: "Mehrere bestätigte Reservierungen",
      detail: "Ein Angebot darf nur eine bestätigte Reservierung haben.",
    },
    system_organization_count: {
      label: "Eindeutige Systemorganisation",
      detail: "Es muss genau eine SYSTEM-Organisation mit ihrer reservierten internen Identität geben.",
    },
    system_membership_invalid: {
      label: "Eindeutiger Systemoperator",
      detail: "Die SYSTEM-Organisation darf höchstens ein Mitglied enthalten, das zwingend ADMIN sein muss.",
    },
    system_business_data: {
      label: "Geschäftsdaten in SYSTEM",
      detail: "Die SYSTEM-Organisation darf keine Parkplätze, Angebote oder Reservierungen enthalten.",
    },
  },
  lb: {
    tenant_without_member: {
      label: "Organisatiounen ouni Member",
      detail: "All Organisatioun, déi aus enger verifizéierter Umeldung entstanen ass, sollt mindestens ee Member hunn.",
    },
    spot_owner_tenant_mismatch: {
      label: "Inkonsistent Parkplazen a Besëtzer",
      detail: "D’Parkplaz an hire Besëtzer mussen zu därselwechter Organisatioun gehéieren.",
    },
    offer_spot_owner_mismatch: {
      label: "Inkonsistent Deelungen a Parkplazen",
      detail: "All Deelung muss op d'Parkplaz an de Besëtzer vun hirer Organisatioun verweisen.",
    },
    reservation_offer_member_mismatch: {
      label: "Organisatiounsiwwergräifend oder net valabel Reservatiounen",
      detail: "D’Offer an déi reservéierend Persoun mussen zu därselwechter Organisatioun gehéieren; Selbstreservatioune sinn ausgeschloss.",
    },
    active_offer_overlap: {
      label: "Iwwerlappend aktiv Deelungen",
      detail: "Eng Parkplaz däerf keng zwee publizéiert Zäitraim hunn, déi sech iwwerschneiden.",
    },
    multiple_confirmed_reservations: {
      label: "Méi bestätegt Reservatiounen",
      detail: "Eng Offer däerf nëmmen eng bestätegt Reservatioun hunn.",
    },
    system_organization_count: {
      label: "Eenzeg Systemorganisatioun",
      detail: "Et muss genee eng SYSTEM-Organisatioun mat hirer reservéierter interner Identitéit ginn.",
    },
    system_membership_invalid: {
      label: "Eenzegen Systemoperateur",
      detail: "D’SYSTEM-Organisatioun däerf héchstens ee Member hunn, deen obligatoresch ADMIN ass.",
    },
    system_business_data: {
      label: "Geschäftsdonnéeën am SYSTEM",
      detail: "D’SYSTEM-Organisatioun däerf keng Parkplazen, Offeren oder Reservatiounen enthalen.",
    },
  },
} as const satisfies Record<Locale, IntegrityMessageCatalog>;

export function adminIntegrityMessages(locale: Locale): IntegrityMessageCatalog {
  return integrityMessages[locale];
}
