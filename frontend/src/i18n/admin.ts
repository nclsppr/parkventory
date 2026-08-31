import type { Locale } from "../../../shared/i18n";

export interface AdminMessages {
  common: {
    loadingData: string;
    loadFailed: string;
    unavailableTitle: string;
    pageChangeFailed: string;
    refreshFailed: string;
    refresh: string;
    never: string;
    erasedEmail: string;
    unknownActor: string;
    unknownOrganization: string;
    entity: string;
    request: string;
    incident: string;
    activity: string;
    viewAll: string;
    search: string;
    clear: string;
    reset: string;
    role: { ADMIN: string; MEMBER: string };
    severity: { INFO: string; WARNING: string; ERROR: string };
    outcome: { SUCCESS: string; DENIED: string; FAILED: string };
  };
  shell: {
    overview: string;
    overviewShort: string;
    organizations: string;
    organizationsShort: string;
    users: string;
    usersShort: string;
    operations: string;
    operationsShort: string;
    homeLabel: string;
    navigationLabel: string;
    quickNavigationLabel: string;
    sidebarLabel: string;
    systemOperator: string;
  };
  pager: {
    label: string;
    previous: string;
    next: string;
    loading: string;
    loaded: string;
  };
  activity: {
    unknownEvent: (type: string) => string;
  };
  eventTypes: Record<string, string>;
  entityTypes: Record<string, string>;
  trend: {
    title: string;
    subtitle: string;
    legendLabel: string;
    newOrganizations: string;
    newUsers: string;
    shares: string;
    bookings: string;
    incidents: string;
    description: (days: number, formattedDays: string, maximum: number, formattedMaximum: string) => string;
    noMeasurements: string;
    noData: string;
    tableCaption: string;
    date: string;
  };
  overview: {
    title: string;
    description: string;
    loading: string;
    networkPosture: string;
    statusAt: (date: string) => string;
    databaseOperational: string;
    incidents24h: (count: number, formattedCount: string) => string;
    totalsLabel: string;
    organizations: string;
    users: string;
    parkingSpaces: string;
    shares: string;
    bookings: string;
    activeSessions: string;
    addedOver30Days: (formattedCount: string) => string;
    over30Days: (formattedCount: string) => string;
    thirtyDayActivityLabel: string;
    activeUsers7d: string;
    activeUsers30d: string;
    bookingShareRate: string;
    withdrawalsCancellations: string;
    incidents: string;
    recentOrganizations: string;
    recentOrganizationsSubtitle: string;
    activeSessionCount: (count: number, formattedCount: string) => string;
    noOrganizations: string;
    noOrganizationsBody: string;
    recentActivity: string;
    recentActivitySubtitle: string;
    openOperations: string;
    noRecentEvents: string;
    emptyActivity: string;
  };
  organizations: {
    title: string;
    description: string;
    searchLabel: string;
    searchPlaceholder: string;
    loading: string;
    noMatch: string;
    none: string;
    noMatchBody: string;
    noneBody: string;
    tableLabel: string;
    matchingCaption: (query: string) => string;
    allCaption: string;
    organization: string;
    members: string;
    parkingSpaces: string;
    shares: string;
    bookings: string;
    sessions: string;
    lastActivity: string;
  };
  organization: {
    back: string;
    loading: string;
    notFound: string;
    notFoundBody: string;
    created: (domain: string, date: string) => string;
    viewActivity: string;
    metricsLabel: (name: string) => string;
    users: string;
    parkingSpaces: string;
    shares: string;
    bookings: string;
    activeSessions: string;
    openFilteredUsers: string;
    viewOrganizationEvents: string;
    configuration: string;
    configurationSubtitle: string;
    name: string;
    domain: string;
    cobranded: string;
    enabled: string;
    parkventoryDefault: string;
    displayName: string;
    recentActivity: string;
    organizationEvents: string;
    noRecentEvent: string;
    noRecentEventBody: string;
    recentMembers: string;
    recentMembersSubtitle: string;
    filteredList: string;
    membersTableLabel: string;
    membersCaption: (name: string) => string;
    member: string;
    role: string;
    registered: string;
    sessions: string;
    lastActivity: string;
    facts: string;
    confirm: string;
    cancel: string;
    removeAdmin: string;
    appointAdmin: string;
    roleUpdateFailed: string;
    noRecentMember: string;
    noRecentMemberBody: string;
    recentSpaces: string;
    recentSpacesSubtitle: string;
    fullInventory: string;
    spacesTableLabel: string;
    spacesCaption: (name: string) => string;
    parkingSpace: string;
    owner: string;
    createdAt: string;
    noRecentSpace: string;
    noRecentSpaceBody: string;
  };
  users: {
    title: string;
    description: string;
    searchLabel: string;
    searchPlaceholder: string;
    activeOrganization: string;
    removeOrganizationFilter: string;
    loading: string;
    noMatch: string;
    noMatchBody: string;
    tableLabel: string;
    caption: string;
    user: string;
    organization: string;
    role: string;
    parkingSpace: string;
    sessions: string;
    shares: string;
    bookings: string;
    lastActivity: string;
    facts: string;
  };
  operations: {
    title: string;
    description: string;
    viewsLabel: string;
    activityTab: string;
    diagnosticsTab: string;
    activityTitle: string;
    activitySubtitle: string;
    organizationId: string;
    userId: string;
    eventType: string;
    exactErrorCode: string;
    reference: string;
    referencePlaceholder: string;
    severity: string;
    allSeverities: string;
    filter: string;
    loadingJournal: string;
    noMatchingEvent: string;
    removeFilter: string;
    newEventsHere: string;
    diagnosticsTitle: string;
    diagnosticsSubtitle: string;
    runningDiagnostics: string;
    databaseOperational: string;
    incidents24h: (count: number, formattedCount: string) => string;
    generatedAt: (date: string) => string;
    integrityTitle: string;
    noIssues: string;
    issuesToReview: (count: number, formattedCount: string) => string;
    integritySeverity: { WARNING: string; ERROR: string };
    integrityStatus: { ok: string; attention: string };
    viewRows: string;
    checkNotFound: string;
    backToDiagnostics: string;
    checkNotFoundBody: string;
    telemetry: string;
    journalDepth: string;
    events: string;
    oldest: string;
    latest: string;
    authentication: string;
    linksAndSessions: string;
    pendingLinks: string;
    expiredLinks: string;
    organizationSessions: string;
    systemSessions: string;
    revokedSessions: string;
    recentIncidents: string;
    incidents7d: (formattedCount: string) => string;
    filterByErrorCode: (code: string) => string;
    incidentWithoutCode: string;
    unknownRoute: string;
    noRecentIncident: string;
    noRecentIncidentBody: string;
  };
  integrityDetails: {
    title: string;
    close: string;
    loading: string;
    emptyPage: string;
    none: string;
    previousPageBody: string;
    resolvedBody: string;
    missing: string;
    row: string;
    openOrganization: (id: string) => string;
    organization: string;
    systemScope: string;
    noOrganization: string;
    searchReference: (type: string, id: string) => string;
    searchReferenceTitle: (id: string) => string;
    noReference: string;
    occurrences: (count: number) => string;
  };
  integrityChecks: Record<string, { label: string; detail: string }>;
}

export const adminMessages: Record<Locale, AdminMessages> = {
  fr: {
    common: {
      loadingData: "Chargement des données…", loadFailed: "Le chargement a échoué.", unavailableTitle: "Les données ne répondent pas.",
      pageChangeFailed: "Le changement de page a échoué.", refreshFailed: "L’actualisation a échoué.", refresh: "Actualiser", never: "Jamais",
      erasedEmail: "E-mail effacé", unknownActor: "Acteur inconnu", unknownOrganization: "Organisation inconnue", entity: "Entité", request: "Requête",
      incident: "Incident", activity: "Activité", viewAll: "Tout voir", search: "Rechercher", clear: "Effacer", reset: "Réinitialiser",
      role: { ADMIN: "Administrateur", MEMBER: "Membre" },
      severity: { INFO: "Information", WARNING: "Avertissement", ERROR: "Erreur" }, outcome: { SUCCESS: "Réussi", DENIED: "Refusé", FAILED: "Échoué" },
    },
    shell: {
      overview: "Vue d’ensemble", overviewShort: "Vue", organizations: "Organisations", organizationsShort: "Organisations", users: "Utilisateurs", usersShort: "Comptes",
      operations: "Opérations", operationsShort: "Suivi", homeLabel: "Vue d’ensemble de la console Parkventory", navigationLabel: "Navigation de la console d’administration",
      quickNavigationLabel: "Navigation rapide de la console", sidebarLabel: "Console d’administration Parkventory", systemOperator: "Opérateur système",
    },
    pager: { label: "Pagination des résultats", previous: "Précédent", next: "Suivant", loading: "Chargement…", loaded: "Page chargée" },
    activity: { unknownEvent: (type) => `Événement inconnu · ${type}` },
    eventTypes: {
      ORGANIZATION_CREATED: "Organisation créée", ORGANISATION_CREATED: "Organisation créée", MEMBER_CREATED: "Membre inscrit", MEMBER_JOINED: "Membre inscrit",
      MEMBER_REGISTERED: "Membre inscrit", SESSION_CREATED: "Session ouverte", SESSION_OPENED: "Session ouverte", SESSION_STARTED: "Session ouverte",
      SESSION_REVOKED: "Session révoquée", SPOT_CREATED: "Place déclarée", SPOT_DECLARED: "Place déclarée", SHARE_CREATED: "Partage publié",
      SHARE_PUBLISHED: "Partage publié", SHARE_WITHDRAWN: "Partage retiré", RESERVATION_CREATED: "Réservation confirmée", RESERVATION_CONFIRMED: "Réservation confirmée",
      RESERVATION_CANCELLED: "Réservation annulée", INCIDENT: "Incident enregistré", INCIDENT_RECORDED: "Incident enregistré", ACCESS_DENIED: "Accès refusé",
      GODMODE_ACCESS_DENIED: "Accès opérateur refusé", BUSINESS_RULE_REJECTED: "Règle métier refusée", TENANT_ADMIN_ACCESS_DENIED: "Accès administrateur refusé",
      TENANT_BRANDING_UPDATED: "Identité visuelle actualisée", TENANT_ADMIN_GRANTED: "Administrateur nommé", TENANT_ADMIN_REVOKED: "Rôle d’administrateur retiré",
      TENANT_MEMBER_EMAIL_ERASED: "Adresse e-mail du membre effacée",
    },
    entityTypes: { ORGANIZATION: "Organisation", MEMBERSHIP: "Adhésion", APP_SESSION: "Session", PARKING_SPOT: "Place", AVAILABILITY_OFFER: "Partage", RESERVATION: "Réservation" },
    trend: {
      title: "Évolution du réseau", subtitle: "Acquisition, usage et incidents · 30 jours", legendLabel: "Séries affichées", newOrganizations: "Nouvelles organisations",
      newUsers: "Nouveaux utilisateurs", shares: "Partages", bookings: "Réservations", incidents: "Incidents",
      description: (days, formattedDays, maximum, formattedMaximum) => `${formattedDays} ${days === 1 ? "jour" : "jours"}. Maximum observé : ${formattedMaximum} ${maximum === 1 ? "événement" : "événements"} par jour.`,
      noMeasurements: "Aucune mesure disponible sur la période.", noData: "Aucune donnée", tableCaption: "Données quotidiennes du graphique", date: "Date",
    },
    overview: {
      title: "Vue d’ensemble", description: "État du réseau Parkventory, activité récente et signaux à examiner. L’organisation système est exclue des métriques.",
      loading: "Construction de la vue réseau…", networkPosture: "Posture du réseau", statusAt: (date) => `État au ${date}`, databaseOperational: "Base de données opérationnelle",
      incidents24h: (count, formattedCount) => `${formattedCount} ${count === 1 ? "incident" : "incidents"} · 24 h`, totalsLabel: "Totaux du réseau",
      organizations: "Organisations", users: "Utilisateurs", parkingSpaces: "Places", shares: "Partages", bookings: "Réservations", activeSessions: "Sessions actives",
      addedOver30Days: (formattedCount) => `+${formattedCount} sur 30 j`, over30Days: (formattedCount) => `${formattedCount} sur 30 j`,
      thirtyDayActivityLabel: "Activité sur la fenêtre de trente jours", activeUsers7d: "Utilisateurs actifs · 7 j", activeUsers30d: "Utilisateurs actifs · 30 j",
      bookingShareRate: "Réservations / partages", withdrawalsCancellations: "Retraits / annulations", incidents: "Incidents",
      recentOrganizations: "Organisations les plus récentes", recentOrganizationsSubtitle: "Adoption et dernière activité observée",
      activeSessionCount: (count, formattedCount) => `${formattedCount} ${count === 1 ? "session active" : "sessions actives"}`,
      noOrganizations: "Aucune organisation cliente.", noOrganizationsBody: "Les premières organisations apparaîtront ici.", recentActivity: "Activité récente",
      recentActivitySubtitle: "Derniers événements du réseau", openOperations: "Ouvrir les opérations", noRecentEvents: "Aucun événement récent.", emptyActivity: "Le journal d’activité est vide pour le moment.",
    },
    organizations: {
      title: "Organisations", description: "Organisations clientes, adoption et activité opérationnelle.", searchLabel: "Rechercher une organisation", searchPlaceholder: "Nom ou domaine",
      loading: "Chargement des organisations…", noMatch: "Aucune organisation correspondante.", none: "Aucune organisation enregistrée.",
      noMatchBody: "Essayez un nom ou un domaine différent.", noneBody: "Les nouvelles organisations apparaîtront ici.", tableLabel: "Table des organisations, défilement horizontal",
      matchingCaption: (query) => `Organisations correspondant à « ${query} »`, allCaption: "Toutes les organisations clientes", organization: "Organisation", members: "Membres",
      parkingSpaces: "Places", shares: "Partages", bookings: "Réservations", sessions: "Sessions", lastActivity: "Dernière activité",
    },
    organization: {
      back: "Toutes les organisations", loading: "Chargement de l’organisation…", notFound: "Organisation introuvable.", notFoundBody: "Elle a peut-être été supprimée ou le lien est incomplet.",
      created: (domain, date) => `${domain} · créée le ${date}`, viewActivity: "Voir l’activité", metricsLabel: (name) => `Indicateurs de ${name}`,
      users: "Utilisateurs", parkingSpaces: "Places", shares: "Partages", bookings: "Réservations", activeSessions: "Sessions actives",
      openFilteredUsers: "Ouvrir la liste filtrée", viewOrganizationEvents: "Voir les faits de l’organisation", configuration: "Configuration",
      configurationSubtitle: "Identité et présentation de l’organisation", name: "Nom", domain: "Domaine", cobranded: "Co-marque", enabled: "Activée",
      parkventoryDefault: "Parkventory par défaut", displayName: "Nom affiché", recentActivity: "Activité récente", organizationEvents: "Événements rattachés à cette organisation",
      noRecentEvent: "Aucun événement récent.", noRecentEventBody: "L’activité de cette organisation apparaîtra ici.", recentMembers: "Membres récents",
      recentMembersSubtitle: "Comptes les plus récemment rattachés à l’organisation", filteredList: "Liste filtrée", membersTableLabel: "Table des membres récents, défilement horizontal",
      membersCaption: (name) => `Membres récents de ${name}`, member: "Membre", role: "Rôle", registered: "Inscription", sessions: "Sessions", lastActivity: "Dernière activité", facts: "Faits",
      confirm: "Confirmer", cancel: "Annuler", removeAdmin: "Retirer l’accès administrateur", appointAdmin: "Nommer administrateur de l’organisation",
      roleUpdateFailed: "Le rôle n’a pas pu être modifié.", noRecentMember: "Aucun membre récent.", noRecentMemberBody: "Les membres rattachés apparaîtront ici.",
      recentSpaces: "Places récentes", recentSpacesSubtitle: "Inventaire, propriétaires et utilisation observée", fullInventory: "Inventaire complet",
      spacesTableLabel: "Table des places récentes, défilement horizontal", spacesCaption: (name) => `Places récentes de ${name}`, parkingSpace: "Place", owner: "Propriétaire",
      createdAt: "Création", noRecentSpace: "Aucune place récente.", noRecentSpaceBody: "Les places déclarées apparaîtront ici.",
    },
    users: {
      title: "Utilisateurs", description: "Comptes clients, rattachements, activité et sessions en cours. Le compte système est exclu.", searchLabel: "Rechercher un utilisateur",
      searchPlaceholder: "Nom ou adresse e-mail", activeOrganization: "Organisation", removeOrganizationFilter: "Retirer le filtre organisation", loading: "Chargement des utilisateurs…",
      noMatch: "Aucun utilisateur correspondant.", noMatchBody: "Modifiez la recherche ou retirez le filtre organisation.", tableLabel: "Table des utilisateurs, défilement horizontal",
      caption: "Utilisateurs clients du réseau Parkventory", user: "Utilisateur", organization: "Organisation", role: "Rôle", parkingSpace: "Place", sessions: "Sessions",
      shares: "Partages", bookings: "Réservations", lastActivity: "Dernière activité", facts: "Faits",
    },
    operations: {
      title: "Opérations", description: "Événements de sécurité et de produit, incidents et intégrité du service.", viewsLabel: "Vues des opérations", activityTab: "Activité", diagnosticsTab: "Diagnostics",
      activityTitle: "Journal d’activité", activitySubtitle: "Les événements les plus récents sont affichés en premier.", organizationId: "ID de l’organisation", userId: "ID de l’utilisateur",
      eventType: "Type d’événement", exactErrorCode: "Code d’erreur exact", reference: "Référence", referencePlaceholder: "Incident, requête ou entité", severity: "Sévérité",
      allSeverities: "Toutes", filter: "Filtrer", loadingJournal: "Chargement du journal…", noMatchingEvent: "Aucun événement correspondant.", removeFilter: "Retirez un filtre pour élargir la recherche.",
      newEventsHere: "Les nouveaux événements apparaîtront ici.", diagnosticsTitle: "Diagnostics", diagnosticsSubtitle: "Intégrité, télémétrie, authentification et incidents récents.",
      runningDiagnostics: "Exécution des diagnostics…", databaseOperational: "Base de données opérationnelle",
      incidents24h: (count, formattedCount) => `${formattedCount} ${count === 1 ? "incident" : "incidents"} · 24 h`, generatedAt: (date) => `Généré ${date}`,
      integrityTitle: "Contrôles d’intégrité", noIssues: "Aucune anomalie détectée", issuesToReview: (count, formattedCount) => `${formattedCount} ${count === 1 ? "anomalie" : "anomalies"} à examiner`,
      integritySeverity: { WARNING: "Avertissement", ERROR: "Erreur" }, integrityStatus: { ok: "Conforme", attention: "À examiner" }, viewRows: "Voir les lignes",
      checkNotFound: "Contrôle introuvable.", backToDiagnostics: "Revenir aux diagnostics", checkNotFoundBody: "Ce contrôle n’est pas proposé par les diagnostics actuels.",
      telemetry: "Télémétrie", journalDepth: "Profondeur du journal", events: "Événements", oldest: "Plus ancien", latest: "Plus récent", authentication: "Authentification",
      linksAndSessions: "Liens et sessions", pendingLinks: "Liens en attente", expiredLinks: "Liens expirés", organizationSessions: "Sessions des organisations", systemSessions: "Sessions système",
      revokedSessions: "Sessions révoquées", recentIncidents: "Incidents récents", incidents7d: (formattedCount) => `${formattedCount} sur les sept derniers jours`,
      filterByErrorCode: (code) => `Filtrer le journal sur le code ${code}`, incidentWithoutCode: "Incident sans code", unknownRoute: "Route inconnue",
      noRecentIncident: "Aucun incident récent.", noRecentIncidentBody: "Aucun incident n’est enregistré sur la période.",
    },
    integrityDetails: {
      title: "Lignes à examiner", close: "Fermer le détail", loading: "Chargement des lignes concernées…", emptyPage: "Cette page ne contient plus de ligne.", none: "Aucune ligne concernée.",
      previousPageBody: "Revenez à la page précédente pour poursuivre l’examen.", resolvedBody: "Le contrôle ne remonte plus d’anomalie à examiner.", missing: "Manquante", row: "Ligne",
      openOrganization: (id) => `Ouvrir l’organisation ${id}`, organization: "Organisation", systemScope: "Portée système", noOrganization: "Aucune organisation associée",
      searchReference: (type, id) => `Rechercher la référence ${type} ${id} dans le journal`, searchReferenceTitle: (id) => `Rechercher la référence ${id} dans le journal`,
      noReference: "Aucune référence associée", occurrences: (count) => count === 1 ? "occurrence" : "occurrences",
    },
    integrityChecks: {
      tenant_without_member: { label: "Organisations sans membre", detail: "Chaque organisation issue d’une connexion vérifiée devrait compter au moins un membre." },
      spot_owner_tenant_mismatch: { label: "Places et propriétaires incohérents", detail: "La place et son propriétaire doivent appartenir à la même organisation." },
      offer_spot_owner_mismatch: { label: "Partages et places incohérents", detail: "Chaque partage doit référencer une place et un propriétaire de la même organisation." },
      reservation_offer_member_mismatch: { label: "Réservations inter-organisations ou invalides", detail: "Le partage et la personne qui réserve doivent appartenir à la même organisation ; l’auto-réservation est interdite." },
      active_offer_overlap: { label: "Chevauchements de partages actifs", detail: "Une place ne doit pas avoir deux créneaux publiés qui se chevauchent." },
      multiple_confirmed_reservations: { label: "Réservations confirmées multiples", detail: "Un partage ne doit avoir qu’une réservation confirmée." },
      system_organization_count: { label: "Organisation système unique", detail: "Il doit exister exactement une organisation système avec l’identité interne réservée." },
      system_membership_invalid: { label: "Opérateur système unique", detail: "L’organisation système accepte au plus un membre, qui doit être administrateur." },
      system_business_data: { label: "Données métier dans l’organisation système", detail: "L’organisation système ne doit contenir aucune place, aucun partage ni aucune réservation." },
    },
  },
  en: {
    common: {
      loadingData: "Loading data…", loadFailed: "Loading failed.", unavailableTitle: "The data is unavailable.", pageChangeFailed: "The page change failed.",
      refreshFailed: "The refresh failed.", refresh: "Refresh", never: "Never", erasedEmail: "Email address erased", unknownActor: "Unknown actor", unknownOrganization: "Unknown organisation",
      entity: "Entity", request: "Request", incident: "Incident", activity: "Activity", viewAll: "View all", search: "Search", clear: "Clear", reset: "Reset",
      role: { ADMIN: "Administrator", MEMBER: "Member" }, severity: { INFO: "Information", WARNING: "Warning", ERROR: "Error" }, outcome: { SUCCESS: "Successful", DENIED: "Denied", FAILED: "Failed" },
    },
    shell: {
      overview: "Overview", overviewShort: "Overview", organizations: "Organisations", organizationsShort: "Organisations", users: "Users", usersShort: "Accounts",
      operations: "Operations", operationsShort: "Monitor", homeLabel: "Parkventory console overview", navigationLabel: "Administration console navigation",
      quickNavigationLabel: "Console quick navigation", sidebarLabel: "Parkventory administration console", systemOperator: "System operator",
    },
    pager: { label: "Results pagination", previous: "Previous", next: "Next", loading: "Loading…", loaded: "Page loaded" },
    activity: { unknownEvent: (type) => `Unknown event · ${type}` },
    eventTypes: {
      ORGANIZATION_CREATED: "Organisation created", ORGANISATION_CREATED: "Organisation created", MEMBER_CREATED: "Member joined", MEMBER_JOINED: "Member joined",
      MEMBER_REGISTERED: "Member joined", SESSION_CREATED: "Session started", SESSION_OPENED: "Session started", SESSION_STARTED: "Session started", SESSION_REVOKED: "Session revoked",
      SPOT_CREATED: "Parking space registered", SPOT_DECLARED: "Parking space registered", SHARE_CREATED: "Availability published", SHARE_PUBLISHED: "Availability published",
      SHARE_WITHDRAWN: "Availability withdrawn", RESERVATION_CREATED: "Booking confirmed", RESERVATION_CONFIRMED: "Booking confirmed", RESERVATION_CANCELLED: "Booking cancelled",
      INCIDENT: "Incident recorded", INCIDENT_RECORDED: "Incident recorded", ACCESS_DENIED: "Access denied", GODMODE_ACCESS_DENIED: "System operator access denied",
      BUSINESS_RULE_REJECTED: "Business rule rejected", TENANT_ADMIN_ACCESS_DENIED: "Organisation administrator access denied", TENANT_BRANDING_UPDATED: "Visual identity updated",
      TENANT_ADMIN_GRANTED: "Organisation administrator appointed", TENANT_ADMIN_REVOKED: "Administrator role removed", TENANT_MEMBER_EMAIL_ERASED: "Member email address erased",
    },
    entityTypes: { ORGANIZATION: "Organisation", MEMBERSHIP: "Membership", APP_SESSION: "Session", PARKING_SPOT: "Parking space", AVAILABILITY_OFFER: "Availability", RESERVATION: "Booking" },
    trend: {
      title: "Network activity", subtitle: "Acquisition, usage and incidents · 30 days", legendLabel: "Displayed series", newOrganizations: "New organisations", newUsers: "New users",
      shares: "Availability", bookings: "Bookings", incidents: "Incidents",
      description: (days, formattedDays, maximum, formattedMaximum) => `${formattedDays} ${days === 1 ? "day" : "days"}. Highest observed value: ${formattedMaximum} ${maximum === 1 ? "event" : "events"} per day.`,
      noMeasurements: "No measurements are available for this period.", noData: "No data", tableCaption: "Daily chart data", date: "Date",
    },
    overview: {
      title: "Overview", description: "Parkventory network status, recent activity and signals to review. The system organisation is excluded from the metrics.",
      loading: "Building the network overview…", networkPosture: "Network posture", statusAt: (date) => `Status at ${date}`, databaseOperational: "Database operational",
      incidents24h: (count, formattedCount) => `${formattedCount} ${count === 1 ? "incident" : "incidents"} · 24 h`, totalsLabel: "Network totals",
      organizations: "Organisations", users: "Users", parkingSpaces: "Parking spaces", shares: "Availability", bookings: "Bookings", activeSessions: "Active sessions",
      addedOver30Days: (formattedCount) => `+${formattedCount} over 30 days`, over30Days: (formattedCount) => `${formattedCount} over 30 days`, thirtyDayActivityLabel: "Activity over the 30-day window",
      activeUsers7d: "Active users · 7 days", activeUsers30d: "Active users · 30 days", bookingShareRate: "Bookings / availability", withdrawalsCancellations: "Withdrawals / cancellations", incidents: "Incidents",
      recentOrganizations: "Newest organisations", recentOrganizationsSubtitle: "Adoption and latest observed activity", activeSessionCount: (count, formattedCount) => `${formattedCount} active ${count === 1 ? "session" : "sessions"}`,
      noOrganizations: "No customer organisations.", noOrganizationsBody: "The first organisations will appear here.", recentActivity: "Recent activity",
      recentActivitySubtitle: "Latest network events", openOperations: "Open operations", noRecentEvents: "No recent events.", emptyActivity: "The activity log is currently empty.",
    },
    organizations: {
      title: "Organisations", description: "Customer organisations, adoption and operational activity.", searchLabel: "Search organisations", searchPlaceholder: "Name or domain",
      loading: "Loading organisations…", noMatch: "No matching organisation.", none: "No organisation registered.", noMatchBody: "Try a different name or domain.",
      noneBody: "New organisations will appear here.", tableLabel: "Organisations table, horizontally scrollable", matchingCaption: (query) => `Organisations matching “${query}”`,
      allCaption: "All customer organisations", organization: "Organisation", members: "Members", parkingSpaces: "Parking spaces", shares: "Availability", bookings: "Bookings", sessions: "Sessions", lastActivity: "Last activity",
    },
    organization: {
      back: "All organisations", loading: "Loading the organisation…", notFound: "Organisation not found.", notFoundBody: "It may have been deleted, or the link may be incomplete.",
      created: (domain, date) => `${domain} · created ${date}`, viewActivity: "View activity", metricsLabel: (name) => `Metrics for ${name}`, users: "Users", parkingSpaces: "Parking spaces",
      shares: "Availability", bookings: "Bookings", activeSessions: "Active sessions", openFilteredUsers: "Open the filtered list", viewOrganizationEvents: "View organisation events",
      configuration: "Configuration", configurationSubtitle: "Organisation identity and presentation", name: "Name", domain: "Domain", cobranded: "Co-branding", enabled: "Enabled",
      parkventoryDefault: "Parkventory default", displayName: "Display name", recentActivity: "Recent activity", organizationEvents: "Events linked to this organisation",
      noRecentEvent: "No recent events.", noRecentEventBody: "Activity for this organisation will appear here.", recentMembers: "Recent members", recentMembersSubtitle: "Accounts most recently linked to the organisation",
      filteredList: "Filtered list", membersTableLabel: "Recent members table, horizontally scrollable", membersCaption: (name) => `Recent members of ${name}`, member: "Member", role: "Role",
      registered: "Registered", sessions: "Sessions", lastActivity: "Last activity", facts: "Events", confirm: "Confirm", cancel: "Cancel", removeAdmin: "Remove administrator access",
      appointAdmin: "Appoint organisation administrator", roleUpdateFailed: "The role could not be updated.", noRecentMember: "No recent members.", noRecentMemberBody: "Linked members will appear here.",
      recentSpaces: "Recent parking spaces", recentSpacesSubtitle: "Inventory, owners and observed usage", fullInventory: "Full inventory", spacesTableLabel: "Recent parking spaces table, horizontally scrollable",
      spacesCaption: (name) => `Recent parking spaces for ${name}`, parkingSpace: "Parking space", owner: "Owner", createdAt: "Created", noRecentSpace: "No recent parking spaces.", noRecentSpaceBody: "Registered parking spaces will appear here.",
    },
    users: {
      title: "Users", description: "Customer accounts, memberships, activity and current sessions. The system account is excluded.", searchLabel: "Search users", searchPlaceholder: "Name or email address",
      activeOrganization: "Organisation", removeOrganizationFilter: "Remove organisation filter", loading: "Loading users…", noMatch: "No matching user.",
      noMatchBody: "Change the search or remove the organisation filter.", tableLabel: "Users table, horizontally scrollable", caption: "Customer users across the Parkventory network",
      user: "User", organization: "Organisation", role: "Role", parkingSpace: "Parking space", sessions: "Sessions", shares: "Availability", bookings: "Bookings", lastActivity: "Last activity", facts: "Events",
    },
    operations: {
      title: "Operations", description: "Security and product events, incidents and service integrity.", viewsLabel: "Operations views", activityTab: "Activity", diagnosticsTab: "Diagnostics",
      activityTitle: "Activity log", activitySubtitle: "The most recent events are shown first.", organizationId: "Organisation ID", userId: "User ID", eventType: "Event type",
      exactErrorCode: "Exact error code", reference: "Reference", referencePlaceholder: "Incident, request or entity", severity: "Severity", allSeverities: "All",
      filter: "Filter", loadingJournal: "Loading the log…", noMatchingEvent: "No matching event.", removeFilter: "Remove a filter to broaden the search.", newEventsHere: "New events will appear here.",
      diagnosticsTitle: "Diagnostics", diagnosticsSubtitle: "Integrity, telemetry, authentication and recent incidents.", runningDiagnostics: "Running diagnostics…", databaseOperational: "Database operational",
      incidents24h: (count, formattedCount) => `${formattedCount} ${count === 1 ? "incident" : "incidents"} · 24 h`, generatedAt: (date) => `Generated ${date}`,
      integrityTitle: "Integrity checks", noIssues: "No issues detected", issuesToReview: (count, formattedCount) => `${formattedCount} ${count === 1 ? "issue" : "issues"} to review`,
      integritySeverity: { WARNING: "Warning", ERROR: "Error" }, integrityStatus: { ok: "Healthy", attention: "Needs review" }, viewRows: "View rows",
      checkNotFound: "Check not found.", backToDiagnostics: "Back to diagnostics", checkNotFoundBody: "This check is not provided by the current diagnostics.", telemetry: "Telemetry",
      journalDepth: "Log depth", events: "Events", oldest: "Oldest", latest: "Latest", authentication: "Authentication", linksAndSessions: "Links and sessions",
      pendingLinks: "Pending links", expiredLinks: "Expired links", organizationSessions: "Organisation sessions", systemSessions: "System sessions", revokedSessions: "Revoked sessions",
      recentIncidents: "Recent incidents", incidents7d: (formattedCount) => `${formattedCount} over the last seven days`, filterByErrorCode: (code) => `Filter the log by code ${code}`,
      incidentWithoutCode: "Incident without a code", unknownRoute: "Unknown route", noRecentIncident: "No recent incidents.", noRecentIncidentBody: "No incidents were recorded during this period.",
    },
    integrityDetails: {
      title: "Rows to review", close: "Close details", loading: "Loading affected rows…", emptyPage: "This page no longer contains any rows.", none: "No affected rows.",
      previousPageBody: "Return to the previous page to continue the review.", resolvedBody: "This check no longer reports any issues to review.", missing: "Missing", row: "Row",
      openOrganization: (id) => `Open organisation ${id}`, organization: "Organisation", systemScope: "System scope", noOrganization: "No organisation associated",
      searchReference: (type, id) => `Search for reference ${type} ${id} in the log`, searchReferenceTitle: (id) => `Search for reference ${id} in the log`,
      noReference: "No associated reference", occurrences: (count) => count === 1 ? "occurrence" : "occurrences",
    },
    integrityChecks: {
      tenant_without_member: { label: "Organisations without members", detail: "Every organisation created through a verified sign-in should contain at least one member." },
      spot_owner_tenant_mismatch: { label: "Parking spaces and owners do not match", detail: "A parking space and its owner must belong to the same organisation." },
      offer_spot_owner_mismatch: { label: "Availability and parking spaces do not match", detail: "Each availability entry must reference a parking space and owner from the same organisation." },
      reservation_offer_member_mismatch: { label: "Cross-organisation or invalid bookings", detail: "The availability entry and booking member must belong to the same organisation; self-booking is not allowed." },
      active_offer_overlap: { label: "Overlapping active availability", detail: "A parking space must not have two overlapping published slots." },
      multiple_confirmed_reservations: { label: "Multiple confirmed bookings", detail: "An availability entry may have only one confirmed booking." },
      system_organization_count: { label: "Unique system organisation", detail: "Exactly one system organisation with the reserved internal identity must exist." },
      system_membership_invalid: { label: "Unique system operator", detail: "The system organisation may contain at most one member, who must be an administrator." },
      system_business_data: { label: "Service records in the system organisation", detail: "The system organisation must not contain any parking spaces, availability or bookings." },
    },
  },
  de: {
    common: {
      loadingData: "Daten werden geladen…", loadFailed: "Laden fehlgeschlagen.", unavailableTitle: "Die Daten sind nicht verfügbar.",
      pageChangeFailed: "Der Seitenwechsel ist fehlgeschlagen.", refreshFailed: "Die Aktualisierung ist fehlgeschlagen.", refresh: "Aktualisieren", never: "Nie",
      erasedEmail: "E-Mail-Adresse gelöscht", unknownActor: "Unbekannter Akteur", unknownOrganization: "Unbekannte Organisation", entity: "Entität", request: "Anfrage",
      incident: "Vorfall", activity: "Aktivität", viewAll: "Alle anzeigen", search: "Suchen", clear: "Löschen", reset: "Zurücksetzen",
      role: { ADMIN: "Administrator", MEMBER: "Mitglied" }, severity: { INFO: "Information", WARNING: "Warnung", ERROR: "Fehler" }, outcome: { SUCCESS: "Erfolgreich", DENIED: "Abgelehnt", FAILED: "Fehlgeschlagen" },
    },
    shell: {
      overview: "Übersicht", overviewShort: "Übersicht", organizations: "Organisationen", organizationsShort: "Organisationen", users: "Benutzer", usersShort: "Konten",
      operations: "Betrieb", operationsShort: "Überwachung", homeLabel: "Übersicht der Parkventory-Konsole", navigationLabel: "Navigation der Administrationskonsole",
      quickNavigationLabel: "Schnellnavigation der Konsole", sidebarLabel: "Parkventory-Administrationskonsole", systemOperator: "Systemoperator",
    },
    pager: { label: "Seitennavigation der Ergebnisse", previous: "Zurück", next: "Weiter", loading: "Wird geladen…", loaded: "Seite geladen" },
    activity: { unknownEvent: (type) => `Unbekanntes Ereignis · ${type}` },
    eventTypes: {
      ORGANIZATION_CREATED: "Organisation erstellt", ORGANISATION_CREATED: "Organisation erstellt", MEMBER_CREATED: "Mitglied beigetreten", MEMBER_JOINED: "Mitglied beigetreten",
      MEMBER_REGISTERED: "Mitglied beigetreten", SESSION_CREATED: "Sitzung gestartet", SESSION_OPENED: "Sitzung gestartet", SESSION_STARTED: "Sitzung gestartet", SESSION_REVOKED: "Sitzung widerrufen",
      SPOT_CREATED: "Parkplatz eingetragen", SPOT_DECLARED: "Parkplatz eingetragen", SHARE_CREATED: "Freigabe veröffentlicht", SHARE_PUBLISHED: "Freigabe veröffentlicht",
      SHARE_WITHDRAWN: "Freigabe zurückgezogen", RESERVATION_CREATED: "Reservierung bestätigt", RESERVATION_CONFIRMED: "Reservierung bestätigt", RESERVATION_CANCELLED: "Reservierung storniert",
      INCIDENT: "Vorfall erfasst", INCIDENT_RECORDED: "Vorfall erfasst", ACCESS_DENIED: "Zugriff verweigert", GODMODE_ACCESS_DENIED: "Systemoperatorzugriff verweigert",
      BUSINESS_RULE_REJECTED: "Geschäftsregel abgelehnt", TENANT_ADMIN_ACCESS_DENIED: "Zugriff für Organisationsadministrator verweigert", TENANT_BRANDING_UPDATED: "Visuelle Identität aktualisiert",
      TENANT_ADMIN_GRANTED: "Organisationsadministrator ernannt", TENANT_ADMIN_REVOKED: "Administratorrolle entzogen", TENANT_MEMBER_EMAIL_ERASED: "E-Mail-Adresse des Mitglieds gelöscht",
    },
    entityTypes: { ORGANIZATION: "Organisation", MEMBERSHIP: "Mitgliedschaft", APP_SESSION: "Sitzung", PARKING_SPOT: "Parkplatz", AVAILABILITY_OFFER: "Freigabe", RESERVATION: "Reservierung" },
    trend: {
      title: "Netzwerkentwicklung", subtitle: "Akquise, Nutzung und Vorfälle · 30 Tage", legendLabel: "Angezeigte Reihen", newOrganizations: "Neue Organisationen", newUsers: "Neue Benutzer",
      shares: "Freigaben", bookings: "Reservierungen", incidents: "Vorfälle",
      description: (days, formattedDays, maximum, formattedMaximum) => `${formattedDays} ${days === 1 ? "Tag" : "Tage"}. Höchster beobachteter Wert: ${formattedMaximum} ${maximum === 1 ? "Ereignis" : "Ereignisse"} pro Tag.`,
      noMeasurements: "Für diesen Zeitraum sind keine Messwerte verfügbar.", noData: "Keine Daten", tableCaption: "Tagesdaten des Diagramms", date: "Datum",
    },
    overview: {
      title: "Übersicht", description: "Status des Parkventory-Netzwerks, letzte Aktivitäten und zu prüfende Signale. Die Systemorganisation ist von den Kennzahlen ausgenommen.",
      loading: "Netzwerkübersicht wird erstellt…", networkPosture: "Netzwerkstatus", statusAt: (date) => `Stand: ${date}`, databaseOperational: "Datenbank betriebsbereit",
      incidents24h: (count, formattedCount) => `${formattedCount} ${count === 1 ? "Vorfall" : "Vorfälle"} · 24 Std.`, totalsLabel: "Netzwerkgesamtwerte",
      organizations: "Organisationen", users: "Benutzer", parkingSpaces: "Parkplätze", shares: "Freigaben", bookings: "Reservierungen", activeSessions: "Aktive Sitzungen",
      addedOver30Days: (formattedCount) => `+${formattedCount} in 30 Tagen`, over30Days: (formattedCount) => `${formattedCount} in 30 Tagen`, thirtyDayActivityLabel: "Aktivität im 30-Tage-Zeitraum",
      activeUsers7d: "Aktive Benutzer · 7 Tage", activeUsers30d: "Aktive Benutzer · 30 Tage", bookingShareRate: "Reservierungen / Freigaben", withdrawalsCancellations: "Rücknahmen / Stornierungen", incidents: "Vorfälle",
      recentOrganizations: "Neueste Organisationen", recentOrganizationsSubtitle: "Akzeptanz und zuletzt beobachtete Aktivität", activeSessionCount: (count, formattedCount) => `${formattedCount} ${count === 1 ? "aktive Sitzung" : "aktive Sitzungen"}`,
      noOrganizations: "Keine Kundenorganisationen.", noOrganizationsBody: "Die ersten Organisationen werden hier angezeigt.", recentActivity: "Letzte Aktivitäten",
      recentActivitySubtitle: "Neueste Netzwerkereignisse", openOperations: "Betrieb öffnen", noRecentEvents: "Keine aktuellen Ereignisse.", emptyActivity: "Das Aktivitätsprotokoll ist derzeit leer.",
    },
    organizations: {
      title: "Organisationen", description: "Kundenorganisationen, Akzeptanz und betriebliche Aktivität.", searchLabel: "Organisationen suchen", searchPlaceholder: "Name oder Domain",
      loading: "Organisationen werden geladen…", noMatch: "Keine passende Organisation.", none: "Keine Organisation registriert.", noMatchBody: "Versuchen Sie einen anderen Namen oder eine andere Domain.",
      noneBody: "Neue Organisationen werden hier angezeigt.", tableLabel: "Organisationstabelle, horizontal scrollbar", matchingCaption: (query) => `Organisationen für „${query}“`,
      allCaption: "Alle Kundenorganisationen", organization: "Organisation", members: "Mitglieder", parkingSpaces: "Parkplätze", shares: "Freigaben", bookings: "Reservierungen", sessions: "Sitzungen", lastActivity: "Letzte Aktivität",
    },
    organization: {
      back: "Alle Organisationen", loading: "Organisation wird geladen…", notFound: "Organisation nicht gefunden.", notFoundBody: "Sie wurde möglicherweise gelöscht oder der Link ist unvollständig.",
      created: (domain, date) => `${domain} · erstellt am ${date}`, viewActivity: "Aktivität anzeigen", metricsLabel: (name) => `Kennzahlen für ${name}`, users: "Benutzer", parkingSpaces: "Parkplätze",
      shares: "Freigaben", bookings: "Reservierungen", activeSessions: "Aktive Sitzungen", openFilteredUsers: "Gefilterte Liste öffnen", viewOrganizationEvents: "Ereignisse der Organisation anzeigen",
      configuration: "Konfiguration", configurationSubtitle: "Identität und Darstellung der Organisation", name: "Name", domain: "Domain", cobranded: "Co-Branding", enabled: "Aktiviert",
      parkventoryDefault: "Parkventory-Standard", displayName: "Anzeigename", recentActivity: "Letzte Aktivitäten", organizationEvents: "Mit dieser Organisation verknüpfte Ereignisse",
      noRecentEvent: "Keine aktuellen Ereignisse.", noRecentEventBody: "Die Aktivität dieser Organisation wird hier angezeigt.", recentMembers: "Neue Mitglieder", recentMembersSubtitle: "Zuletzt mit der Organisation verknüpfte Konten",
      filteredList: "Gefilterte Liste", membersTableLabel: "Tabelle der neuen Mitglieder, horizontal scrollbar", membersCaption: (name) => `Neue Mitglieder von ${name}`, member: "Mitglied", role: "Rolle",
      registered: "Registriert", sessions: "Sitzungen", lastActivity: "Letzte Aktivität", facts: "Ereignisse", confirm: "Bestätigen", cancel: "Abbrechen", removeAdmin: "Administratorzugriff entfernen",
      appointAdmin: "Organisationsadministrator ernennen", roleUpdateFailed: "Die Rolle konnte nicht geändert werden.", noRecentMember: "Keine neuen Mitglieder.", noRecentMemberBody: "Verknüpfte Mitglieder werden hier angezeigt.",
      recentSpaces: "Neue Parkplätze", recentSpacesSubtitle: "Bestand, Eigentümer und beobachtete Nutzung", fullInventory: "Gesamter Bestand", spacesTableLabel: "Tabelle der neuen Parkplätze, horizontal scrollbar",
      spacesCaption: (name) => `Neue Parkplätze von ${name}`, parkingSpace: "Parkplatz", owner: "Eigentümer", createdAt: "Erstellt", noRecentSpace: "Keine neuen Parkplätze.", noRecentSpaceBody: "Eingetragene Parkplätze werden hier angezeigt.",
    },
    users: {
      title: "Benutzer", description: "Kundenkonten, Mitgliedschaften, Aktivität und laufende Sitzungen. Das Systemkonto ist ausgeschlossen.", searchLabel: "Benutzer suchen", searchPlaceholder: "Name oder E-Mail-Adresse",
      activeOrganization: "Organisation", removeOrganizationFilter: "Organisationsfilter entfernen", loading: "Benutzer werden geladen…", noMatch: "Kein passender Benutzer.",
      noMatchBody: "Ändern Sie die Suche oder entfernen Sie den Organisationsfilter.", tableLabel: "Benutzertabelle, horizontal scrollbar", caption: "Kundenbenutzer im Parkventory-Netzwerk",
      user: "Benutzer", organization: "Organisation", role: "Rolle", parkingSpace: "Parkplatz", sessions: "Sitzungen", shares: "Freigaben", bookings: "Reservierungen", lastActivity: "Letzte Aktivität", facts: "Ereignisse",
    },
    operations: {
      title: "Betrieb", description: "Sicherheits- und Produktereignisse, Vorfälle und Dienstintegrität.", viewsLabel: "Betriebsansichten", activityTab: "Aktivität", diagnosticsTab: "Diagnose",
      activityTitle: "Aktivitätsprotokoll", activitySubtitle: "Die neuesten Ereignisse werden zuerst angezeigt.", organizationId: "Organisations-ID", userId: "Benutzer-ID", eventType: "Ereignistyp",
      exactErrorCode: "Genauer Fehlercode", reference: "Referenz", referencePlaceholder: "Vorfall, Anfrage oder Entität", severity: "Schweregrad", allSeverities: "Alle",
      filter: "Filtern", loadingJournal: "Protokoll wird geladen…", noMatchingEvent: "Kein passendes Ereignis.", removeFilter: "Entfernen Sie einen Filter, um die Suche zu erweitern.", newEventsHere: "Neue Ereignisse werden hier angezeigt.",
      diagnosticsTitle: "Diagnose", diagnosticsSubtitle: "Integrität, Telemetrie, Authentifizierung und aktuelle Vorfälle.", runningDiagnostics: "Diagnose wird ausgeführt…", databaseOperational: "Datenbank betriebsbereit",
      incidents24h: (count, formattedCount) => `${formattedCount} ${count === 1 ? "Vorfall" : "Vorfälle"} · 24 Std.`, generatedAt: (date) => `Erstellt: ${date}`,
      integrityTitle: "Integritätsprüfungen", noIssues: "Keine Anomalien erkannt", issuesToReview: (count, formattedCount) => `${formattedCount} ${count === 1 ? "Anomalie" : "Anomalien"} zu prüfen`,
      integritySeverity: { WARNING: "Warnung", ERROR: "Fehler" }, integrityStatus: { ok: "In Ordnung", attention: "Zu prüfen" }, viewRows: "Zeilen anzeigen",
      checkNotFound: "Prüfung nicht gefunden.", backToDiagnostics: "Zurück zur Diagnose", checkNotFoundBody: "Diese Prüfung ist in der aktuellen Diagnose nicht enthalten.", telemetry: "Telemetrie",
      journalDepth: "Protokolltiefe", events: "Ereignisse", oldest: "Ältestes", latest: "Neuestes", authentication: "Authentifizierung", linksAndSessions: "Links und Sitzungen",
      pendingLinks: "Ausstehende Links", expiredLinks: "Abgelaufene Links", organizationSessions: "Organisationssitzungen", systemSessions: "Systemsitzungen", revokedSessions: "Widerrufene Sitzungen",
      recentIncidents: "Aktuelle Vorfälle", incidents7d: (formattedCount) => `${formattedCount} in den letzten sieben Tagen`, filterByErrorCode: (code) => `Protokoll nach Code ${code} filtern`,
      incidentWithoutCode: "Vorfall ohne Code", unknownRoute: "Unbekannte Route", noRecentIncident: "Keine aktuellen Vorfälle.", noRecentIncidentBody: "In diesem Zeitraum wurden keine Vorfälle erfasst.",
    },
    integrityDetails: {
      title: "Zu prüfende Zeilen", close: "Details schließen", loading: "Betroffene Zeilen werden geladen…", emptyPage: "Diese Seite enthält keine Zeilen mehr.", none: "Keine betroffenen Zeilen.",
      previousPageBody: "Kehren Sie zur vorherigen Seite zurück, um die Prüfung fortzusetzen.", resolvedBody: "Diese Prüfung meldet keine zu prüfenden Anomalien mehr.", missing: "Fehlt", row: "Zeile",
      openOrganization: (id) => `Organisation ${id} öffnen`, organization: "Organisation", systemScope: "Systembereich", noOrganization: "Keine Organisation zugeordnet",
      searchReference: (type, id) => `Referenz ${type} ${id} im Protokoll suchen`, searchReferenceTitle: (id) => `Referenz ${id} im Protokoll suchen`,
      noReference: "Keine zugeordnete Referenz", occurrences: () => "Vorkommen",
    },
    integrityChecks: {
      tenant_without_member: { label: "Organisationen ohne Mitglieder", detail: "Jede durch eine verifizierte Anmeldung erstellte Organisation sollte mindestens ein Mitglied haben." },
      spot_owner_tenant_mismatch: { label: "Parkplätze und Eigentümer stimmen nicht überein", detail: "Ein Parkplatz und sein Eigentümer müssen derselben Organisation angehören." },
      offer_spot_owner_mismatch: { label: "Freigaben und Parkplätze stimmen nicht überein", detail: "Jede Freigabe muss auf einen Parkplatz und einen Eigentümer derselben Organisation verweisen." },
      reservation_offer_member_mismatch: { label: "Organisationsübergreifende oder ungültige Reservierungen", detail: "Freigabe und reservierendes Mitglied müssen derselben Organisation angehören; Selbstreservierungen sind nicht zulässig." },
      active_offer_overlap: { label: "Überschneidende aktive Freigaben", detail: "Für einen Parkplatz dürfen sich zwei veröffentlichte Zeiträume nicht überschneiden." },
      multiple_confirmed_reservations: { label: "Mehrere bestätigte Reservierungen", detail: "Eine Freigabe darf nur eine bestätigte Reservierung haben." },
      system_organization_count: { label: "Eindeutige Systemorganisation", detail: "Es muss genau eine Systemorganisation mit der reservierten internen Identität geben." },
      system_membership_invalid: { label: "Eindeutiger Systemoperator", detail: "Die Systemorganisation darf höchstens ein Mitglied enthalten, das Administrator sein muss." },
      system_business_data: { label: "Fachdaten in der Systemorganisation", detail: "Die Systemorganisation darf keine Parkplätze, Freigaben oder Reservierungen enthalten." },
    },
  },
  lb: {
    common: {
      loadingData: "D'Donnéeë gi gelueden…", loadFailed: "D'Lueden ass feelgeschloen.", unavailableTitle: "D'Donnéeë sinn net disponibel.",
      pageChangeFailed: "D'Wiesselen op déi aner Säit ass feelgeschloen.", refreshFailed: "D'Aktualiséierung ass feelgeschloen.", refresh: "Aktualiséieren", never: "Ni",
      erasedEmail: "E-Mail-Adress geläscht", unknownActor: "Onbekannten Acteur", unknownOrganization: "Onbekannt Organisatioun", entity: "Entitéit", request: "Ufro",
      incident: "Tëschefall", activity: "Aktivitéit", viewAll: "Alles weisen", search: "Sichen", clear: "Läschen", reset: "Zrécksetzen",
      role: { ADMIN: "Administrateur", MEMBER: "Member" }, severity: { INFO: "Informatioun", WARNING: "Warnung", ERROR: "Feeler" }, outcome: { SUCCESS: "Erfollegräich", DENIED: "Refuséiert", FAILED: "Feelgeschloen" },
    },
    shell: {
      overview: "Iwwersiicht", overviewShort: "Iwwersiicht", organizations: "Organisatiounen", organizationsShort: "Organisatiounen", users: "Benotzer", usersShort: "Konten",
      operations: "Operatiounen", operationsShort: "Iwwerwaachung", homeLabel: "Iwwersiicht vun der Parkventory-Konsol", navigationLabel: "Navigatioun vun der Administratiounskonsol",
      quickNavigationLabel: "Séier Navigatioun vun der Konsol", sidebarLabel: "Parkventory-Administratiounskonsol", systemOperator: "Systemoperator",
    },
    pager: { label: "Navigatioun duerch d'Resultater", previous: "Vireg Säit", next: "Nächst Säit", loading: "Gëtt gelueden…", loaded: "Säit gelueden" },
    activity: { unknownEvent: (type) => `Onbekannt Evenement · ${type}` },
    eventTypes: {
      ORGANIZATION_CREATED: "Organisatioun ugeluecht", ORGANISATION_CREATED: "Organisatioun ugeluecht", MEMBER_CREATED: "Member bäigedrueden", MEMBER_JOINED: "Member bäigedrueden",
      MEMBER_REGISTERED: "Member bäigedrueden", SESSION_CREATED: "Sessioun opgemaach", SESSION_OPENED: "Sessioun opgemaach", SESSION_STARTED: "Sessioun opgemaach", SESSION_REVOKED: "Sessioun zréckgezunn",
      SPOT_CREATED: "Parkplaz registréiert", SPOT_DECLARED: "Parkplaz registréiert", SHARE_CREATED: "Fräigab publizéiert", SHARE_PUBLISHED: "Fräigab publizéiert",
      SHARE_WITHDRAWN: "Fräigab zréckgezunn", RESERVATION_CREATED: "Reservatioun confirméiert", RESERVATION_CONFIRMED: "Reservatioun confirméiert", RESERVATION_CANCELLED: "Reservatioun annuléiert",
      INCIDENT: "Tëschefall registréiert", INCIDENT_RECORDED: "Tëschefall registréiert", ACCESS_DENIED: "Zougang refuséiert", GODMODE_ACCESS_DENIED: "Zougang fir de Systemoperator refuséiert",
      BUSINESS_RULE_REJECTED: "Geschäftsreegel refuséiert", TENANT_ADMIN_ACCESS_DENIED: "Zougang fir den Administrateur vun der Organisatioun refuséiert", TENANT_BRANDING_UPDATED: "Visuell Identitéit aktualiséiert",
      TENANT_ADMIN_GRANTED: "Administrateur vun der Organisatioun ernannt", TENANT_ADMIN_REVOKED: "Administrateursroll ewechgeholl", TENANT_MEMBER_EMAIL_ERASED: "E-Mail-Adress vum Member geläscht",
    },
    entityTypes: { ORGANIZATION: "Organisatioun", MEMBERSHIP: "Memberschaft", APP_SESSION: "Sessioun", PARKING_SPOT: "Parkplaz", AVAILABILITY_OFFER: "Fräigab", RESERVATION: "Reservatioun" },
    trend: {
      title: "Entwécklung vum Netzwierk", subtitle: "Acquisitioun, Notzung an Tëschefäll · 30 Deeg", legendLabel: "Ugewisen Datenreien", newOrganizations: "Nei Organisatiounen",
      newUsers: "Nei Benotzer", shares: "Fräigaben", bookings: "Reservatiounen", incidents: "Tëschefäll",
      description: (days, formattedDays, maximum, formattedMaximum) => `${formattedDays} ${days === 1 ? "Dag" : "Deeg"}. Héchste beobachte Wäert: ${formattedMaximum} ${maximum === 1 ? "Evenement" : "Evenementer"} pro Dag.`,
      noMeasurements: "Fir dësen Zäitraum si keng Miesswäerter disponibel.", noData: "Keng Donnéeën", tableCaption: "Deeglech Donnéeë vum Diagramm", date: "Datum",
    },
    overview: {
      title: "Iwwersiicht", description: "Zoustand vum Parkventory-Netzwierk, rezent Aktivitéit a Signaler, déi ze kontrolléiere sinn. D'Systemorganisatioun ass net an de Kennzuelen enthalen.",
      loading: "D'Netzwierkiwwersiicht gëtt opgebaut…", networkPosture: "Zoustand vum Netzwierk", statusAt: (date) => `Stand: ${date}`, databaseOperational: "Datebank operationell",
      incidents24h: (count, formattedCount) => `${formattedCount} ${count === 1 ? "Tëschefall" : "Tëschefäll"} · 24 St.`, totalsLabel: "Gesamtwäerter vum Netzwierk",
      organizations: "Organisatiounen", users: "Benotzer", parkingSpaces: "Parkplazen", shares: "Fräigaben", bookings: "Reservatiounen", activeSessions: "Aktiv Sessiounen",
      addedOver30Days: (formattedCount) => `+${formattedCount} iwwer 30 Deeg`, over30Days: (formattedCount) => `${formattedCount} iwwer 30 Deeg`, thirtyDayActivityLabel: "Aktivitéit am Zäitraum vun 30 Deeg",
      activeUsers7d: "Aktiv Benotzer · 7 Deeg", activeUsers30d: "Aktiv Benotzer · 30 Deeg", bookingShareRate: "Reservatiounen / Fräigaben", withdrawalsCancellations: "Zréckzéien / Annulatiounen", incidents: "Tëschefäll",
      recentOrganizations: "Neisten Organisatiounen", recentOrganizationsSubtitle: "Adoptioun a lescht observéiert Aktivitéit", activeSessionCount: (count, formattedCount) => `${formattedCount} ${count === 1 ? "aktiv Sessioun" : "aktiv Sessiounen"}`,
      noOrganizations: "Keng Clientsorganisatiounen.", noOrganizationsBody: "Déi éischt Organisatioune ginn hei ugewisen.", recentActivity: "Rezent Aktivitéit",
      recentActivitySubtitle: "Lescht Evenementer am Netzwierk", openOperations: "Operatiounen opmaachen", noRecentEvents: "Keng rezent Evenementer.", emptyActivity: "Den Aktivitéitsjournal ass den Ament eidel.",
    },
    organizations: {
      title: "Organisatiounen", description: "Clientsorganisatiounen, Adoptioun an operationell Aktivitéit.", searchLabel: "No Organisatioune sichen", searchPlaceholder: "Numm oder Domain",
      loading: "D'Organisatioune gi gelueden…", noMatch: "Keng passend Organisatioun.", none: "Keng Organisatioun registréiert.", noMatchBody: "Probéiert en aneren Numm oder eng aner Domain.",
      noneBody: "Nei Organisatioune ginn hei ugewisen.", tableLabel: "Tabell vun den Organisatiounen, horizontal scrollbar", matchingCaption: (query) => `Organisatiounen, déi mat „${query}“ iwwereneestëmmen`,
      allCaption: "All Clientsorganisatiounen", organization: "Organisatioun", members: "Memberen", parkingSpaces: "Parkplazen", shares: "Fräigaben", bookings: "Reservatiounen", sessions: "Sessiounen", lastActivity: "Lescht Aktivitéit",
    },
    organization: {
      back: "All Organisatiounen", loading: "D'Organisatioun gëtt gelueden…", notFound: "Organisatioun net fonnt.", notFoundBody: "Si gouf vläicht geläscht oder de Link ass net komplett.",
      created: (domain, date) => `${domain} · den ${date} ugeluecht`, viewActivity: "Aktivitéit weisen", metricsLabel: (name) => `Kennzuele fir ${name}`, users: "Benotzer", parkingSpaces: "Parkplazen",
      shares: "Fräigaben", bookings: "Reservatiounen", activeSessions: "Aktiv Sessiounen", openFilteredUsers: "Gefiltert Lëscht opmaachen", viewOrganizationEvents: "Evenementer vun der Organisatioun weisen",
      configuration: "Konfiguratioun", configurationSubtitle: "Identitéit a Presentatioun vun der Organisatioun", name: "Numm", domain: "Domain", cobranded: "Co-Branding", enabled: "Aktivéiert",
      parkventoryDefault: "Parkventory-Standard", displayName: "Ugewisenen Numm", recentActivity: "Rezent Aktivitéit", organizationEvents: "Evenementer vun dëser Organisatioun",
      noRecentEvent: "Keng rezent Evenementer.", noRecentEventBody: "D'Aktivitéit vun dëser Organisatioun gëtt hei ugewisen.", recentMembers: "Rezent Memberen", recentMembersSubtitle: "D'Konten, déi fir d'lescht mat der Organisatioun verbonne goufen",
      filteredList: "Gefiltert Lëscht", membersTableLabel: "Tabell vun de rezente Memberen, horizontal scrollbar", membersCaption: (name) => `Rezent Membere vun ${name}`, member: "Member", role: "Roll",
      registered: "Registréiert", sessions: "Sessiounen", lastActivity: "Lescht Aktivitéit", facts: "Evenementer", confirm: "Bestätegen", cancel: "Ofbriechen", removeAdmin: "Administrateurszougang ewechhuelen",
      appointAdmin: "Administrateur vun der Organisatioun ernennen", roleUpdateFailed: "D'Roll konnt net geännert ginn.", noRecentMember: "Keng rezent Memberen.", noRecentMemberBody: "Verbonne Membere ginn hei ugewisen.",
      recentSpaces: "Rezent Parkplazen", recentSpacesSubtitle: "Inventaire, Proprietären an observéiert Notzung", fullInventory: "Kompletten Inventaire", spacesTableLabel: "Tabell vun de rezente Parkplazen, horizontal scrollbar",
      spacesCaption: (name) => `Rezent Parkplaze vun ${name}`, parkingSpace: "Parkplaz", owner: "Proprietär", createdAt: "Ugeluecht", noRecentSpace: "Keng rezent Parkplaz.", noRecentSpaceBody: "Registréiert Parkplaze ginn hei ugewisen.",
    },
    users: {
      title: "Benotzer", description: "Clientskonten, Memberschaften, Aktivitéit an aktuell Sessiounen. De Systemkonto ass ausgeschloss.", searchLabel: "No engem Benotzer sichen", searchPlaceholder: "Numm oder E-Mail-Adress",
      activeOrganization: "Organisatioun", removeOrganizationFilter: "Organisatiounsfilter ewechhuelen", loading: "D'Benotzer gi gelueden…", noMatch: "Kee passende Benotzer.",
      noMatchBody: "Ännert d'Sich oder huelt den Organisatiounsfilter ewech.", tableLabel: "Tabell vun de Benotzer, horizontal scrollbar", caption: "Clientsbenotzer am Parkventory-Netzwierk",
      user: "Benotzer", organization: "Organisatioun", role: "Roll", parkingSpace: "Parkplaz", sessions: "Sessiounen", shares: "Fräigaben", bookings: "Reservatiounen", lastActivity: "Lescht Aktivitéit", facts: "Evenementer",
    },
    operations: {
      title: "Operatiounen", description: "Sécherheets- a Produktevenementer, Tëschefäll an Integritéit vum Service.", viewsLabel: "Usiichte vun den Operatiounen", activityTab: "Aktivitéit", diagnosticsTab: "Diagnostik",
      activityTitle: "Aktivitéitsjournal", activitySubtitle: "Déi neisten Evenementer ginn als éischt ugewisen.", organizationId: "ID vun der Organisatioun", userId: "Benotzer-ID", eventType: "Typ vum Evenement",
      exactErrorCode: "Geneeë Feelercode", reference: "Referenz", referencePlaceholder: "Tëschefall, Ufro oder Entitéit", severity: "Schwéiergrad", allSeverities: "All",
      filter: "Filteren", loadingJournal: "De Journal gëtt gelueden…", noMatchingEvent: "Kee passend Evenement.", removeFilter: "Huelt e Filter ewech, fir d'Sich auszebreeden.", newEventsHere: "Nei Evenementer ginn hei ugewisen.",
      diagnosticsTitle: "Diagnostik", diagnosticsSubtitle: "Integritéit, Telemetrie, Authentifikatioun a rezent Tëschefäll.", runningDiagnostics: "D'Diagnostik gëtt ausgeféiert…", databaseOperational: "Datebank operationell",
      incidents24h: (count, formattedCount) => `${formattedCount} ${count === 1 ? "Tëschefall" : "Tëschefäll"} · 24 St.`, generatedAt: (date) => `Generéiert: ${date}`,
      integrityTitle: "Integritéitskontrollen", noIssues: "Keng Anomalie festgestallt", issuesToReview: (count, formattedCount) => `${formattedCount} ${count === 1 ? "Anomalie" : "Anomalien"} ze kontrolléieren`,
      integritySeverity: { WARNING: "Warnung", ERROR: "Feeler" }, integrityStatus: { ok: "An der Rei", attention: "Ze kontrolléieren" }, viewRows: "Datensätz weisen",
      checkNotFound: "Kontroll net fonnt.", backToDiagnostics: "Zréck bei d'Diagnostik", checkNotFoundBody: "Dës Kontroll ass net an der aktueller Diagnostik enthalen.", telemetry: "Telemetrie",
      journalDepth: "Déift vum Journal", events: "Evenementer", oldest: "Eelsten", latest: "Neisten", authentication: "Authentifikatioun", linksAndSessions: "Linken a Sessiounen",
      pendingLinks: "Linken an der Waardeschleif", expiredLinks: "Ofgelafe Linken", organizationSessions: "Sessioune vun den Organisatiounen", systemSessions: "Systemsessiounen", revokedSessions: "Zréckgezunne Sessiounen",
      recentIncidents: "Rezent Tëschefäll", incidents7d: (formattedCount) => `${formattedCount} an de leschte siwen Deeg`, filterByErrorCode: (code) => `De Journal nom Code ${code} filteren`,
      incidentWithoutCode: "Tëschefall ouni Code", unknownRoute: "Onbekannt Route", noRecentIncident: "Keng rezent Tëschefäll.", noRecentIncidentBody: "An dësem Zäitraum gouf keen Tëschefall registréiert.",
    },
    integrityDetails: {
      title: "Datensätz fir ze kontrolléieren", close: "Detailer zoumaachen", loading: "Déi betraffen Datensätz gi gelueden…", emptyPage: "Dës Säit enthält keng Datensätz méi.", none: "Keng betraffen Datensätz.",
      previousPageBody: "Gitt zeréck op déi vireg Säit, fir d'Kontroll virunzeféieren.", resolvedBody: "Dës Kontroll mellt keng Anomalie méi, déi ze kontrolléieren ass.", missing: "Feelt", row: "Datensaz",
      openOrganization: (id) => `Organisatioun ${id} opmaachen`, organization: "Organisatioun", systemScope: "Systemberäich", noOrganization: "Keng Organisatioun zougeuerdent",
      searchReference: (type, id) => `D'Referenz ${type} ${id} am Journal sichen`, searchReferenceTitle: (id) => `D'Referenz ${id} am Journal sichen`,
      noReference: "Keng zougeuerdent Referenz", occurrences: (count) => count === 1 ? "Optriede" : "Optrieden",
    },
    integrityChecks: {
      tenant_without_member: { label: "Organisatiounen ouni Member", detail: "All Organisatioun, déi duerch eng verifizéiert Umeldung ugeluecht gouf, sollt mindestens ee Member hunn." },
      spot_owner_tenant_mismatch: { label: "Parkplazen a Proprietäre passen net zesummen", detail: "Eng Parkplaz an hire Proprietär mussen zu därselwechter Organisatioun gehéieren." },
      offer_spot_owner_mismatch: { label: "Fräigaben a Parkplaze passen net zesummen", detail: "All Fräigab muss op eng Parkplaz an e Proprietär aus därselwechter Organisatioun verweisen." },
      reservation_offer_member_mismatch: { label: "Organisatiounsiwwergräifend oder ongülteg Reservatiounen", detail: "D'Fräigab an de Member, dee reservéiert, mussen zu därselwechter Organisatioun gehéieren; Selbstreservatioune sinn net erlaabt." },
      active_offer_overlap: { label: "Iwwerlappend aktiv Fräigaben", detail: "Eng Parkplaz däerf keng zwee publizéiert Zäitraim hunn, déi sech iwwerschneiden." },
      multiple_confirmed_reservations: { label: "Méi confirméiert Reservatiounen", detail: "Eng Fräigab däerf nëmmen eng confirméiert Reservatioun hunn." },
      system_organization_count: { label: "Eenzeg Systemorganisatioun", detail: "Et muss genee eng Systemorganisatioun mat der reservéierter interner Identitéit ginn." },
      system_membership_invalid: { label: "Eenzegen Systemoperator", detail: "D'Systemorganisatioun däerf héchstens ee Member hunn, deen Administrateur muss sinn." },
      system_business_data: { label: "Fachdonnéeën an der Systemorganisatioun", detail: "D'Systemorganisatioun däerf keng Parkplazen, Fräigaben oder Reservatiounen enthalen." },
    },
  },
};
