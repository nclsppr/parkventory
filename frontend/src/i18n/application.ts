import type { Locale } from "../../../shared/i18n";

interface ApplicationMessages {
  state: {
    serviceUnavailable: string;
    loadingWorkspace: string;
    openingWorkspace: string;
    dashboardLoadFailed: string;
  };
  availability: {
    dateUnknown: string;
    timeUnknown: string;
    timeZoneUnknown: string;
    localTime: string;
    levelUnknown: string;
    viewerReservation: string;
    viewerAvailability: string;
    available: string;
    reserved: string;
    published: string;
    unavailable: string;
    reservationActive: string;
    withdrawalUnavailable: string;
  };
  shell: {
    betaTitle: string;
    betaLabel: string;
    refreshing: string;
    appNavigation: string;
    mainNavigation: string;
    quickNavigation: string;
    openNavigation: string;
    closeNavigation: string;
    appHome: string;
    organizationAppHome: (companyName: string) => string;
    signingOut: string;
    signOut: string;
    logoutFailed: string;
    profile: string;
    languageUpdateFailed: string;
    navigation: {
      dashboard: string;
      share: string;
      find: string;
      dashboardShort: string;
      shareShort: string;
      findShort: string;
    };
  };
  dashboard: {
    eyebrow: string;
    greeting: (firstName: string) => string;
    introduction: string;
    liveAvailability: string;
    communitySummary: (organization: string, count: number, formattedCount: string) => string;
    quickActions: string;
    assignedSpace: (spot: string) => string;
    firstStep: string;
    shareSpace: string;
    declareSpace: string;
    shareDescription: string;
    prepareAvailability: string;
    availableSpaces: (count: number, formattedCount: string) => string;
    findSpace: string;
    findDescription: string;
    viewAvailability: string;
    weekKicker: string;
    weekTitle: string;
    viewAll: string;
    emptyTitle: string;
    emptyBody: string;
    weekActivity: string;
    shares: string;
    bookings: string;
    availableSpacesStat: string;
  };
  share: {
    eyebrow: string;
    titleAssigned: string;
    titleUnassigned: string;
    assignedIntroduction: (spot: string) => string;
    unassignedIntroduction: string;
    companyOnly: string;
    timeOrderError: string;
    declareError: string;
    publishError: string;
    withdrawError: string;
    spotAssigned: (spot: string) => string;
    publishedSuccess: (spot: string, date: string, from: string, to: string) => string;
    withdrawnSuccess: (spot: string, date: string) => string;
    withdrawConfirmation: (spot: string, date: string) => string;
    formLabel: string;
    availabilitySlot: string;
    parkingLocalTime: string;
    yourSpace: string;
    date: string;
    start: string;
    end: string;
    localTime: string;
    summary: string;
    location: string;
    schedule: string;
    privacyNote: string;
    publishing: string;
    publish: string;
    declareFormLabel: string;
    regularSpace: string;
    regularSpaceIntroduction: string;
    spotLabel: string;
    levelOrZone: string;
    optional: string;
    levelPlaceholder: string;
    saving: string;
    assignSpace: string;
    whyStep: string;
    stableSpaceTitle: string;
    stableSpaceBody: string;
    tracking: string;
    activeShares: string;
    noActiveShares: string;
    noActiveSharesBody: string;
    withdrawing: string;
    withdraw: string;
  };
  find: {
    eyebrow: string;
    title: string;
    introduction: string;
    oneSpaceOneBooking: string;
    scopeTitle: string;
    scopeIntroduction: string;
    schedules: string;
    localTime: string;
    available: string;
    timeZoneNote: string;
    backToDashboard: string;
    publishedSlots: string;
    choicesCount: (count: number, formattedCount: string) => string;
    emptyTitle: string;
    emptyBody: string;
    selected: string;
    choose: string;
    canceling: string;
    cancel: string;
    cancellationClosed: string;
    closeSelection: string;
    yourSelection: string;
    level: string;
    date: string;
    schedule: string;
    confirmationNote: string;
    confirming: string;
    confirmBooking: string;
    selectSpace: string;
    selectSpaceBody: string;
    bookedSuccess: (spot: string, date: string, time: string) => string;
    bookingConflict: string;
    bookingFailed: string;
    cancellationFailed: string;
    cancellationSuccess: (spot: string, date: string, time: string) => string;
    cancellationConfirmation: (spot: string, date: string, time: string) => string;
  };
  api: {
    timeout: string;
    unreachable: string;
    actionFailed: string;
    sessionExpired: string;
    forbidden: string;
    conflict: string;
    rateLimited: (seconds: string) => string;
    rateLimitedGeneric: string;
    serviceProblem: string;
  };
}

export const applicationMessages = {
  fr: {
    state: {
      serviceUnavailable: "Le service ne répond pas.",
      loadingWorkspace: "Chargement de votre organisation…",
      openingWorkspace: "Ouverture de votre organisation dans Parkventory.",
      dashboardLoadFailed: "Les données du parking n’ont pas pu être chargées.",
    },
    availability: {
      dateUnknown: "Date à préciser",
      timeUnknown: "Horaire à préciser",
      timeZoneUnknown: "Fuseau non renseigné",
      localTime: "Heure locale",
      levelUnknown: "Niveau non renseigné",
      viewerReservation: "Votre réservation",
      viewerAvailability: "Votre partage",
      available: "Disponible",
      reserved: "Réservée",
      published: "Publiée",
      unavailable: "Indisponible",
      reservationActive: "Réservation active",
      withdrawalUnavailable: "Retrait indisponible",
    },
    shell: {
      betaTitle: "Parkventory est en version bêta.",
      betaLabel: "Version bêta",
      refreshing: "Actualisation…",
      appNavigation: "Navigation de l’application",
      mainNavigation: "Navigation principale de l’application",
      quickNavigation: "Navigation rapide",
      openNavigation: "Ouvrir la navigation",
      closeNavigation: "Fermer la navigation",
      appHome: "Accueil de l’application Parkventory",
      organizationAppHome: (companyName) => `Accueil de l’application ${companyName} sur Parkventory`,
      signingOut: "Déconnexion…",
      signOut: "Se déconnecter",
      logoutFailed: "La déconnexion a échoué. Réessayez.",
      profile: "Profil",
      languageUpdateFailed: "La langue du profil n’a pas pu être enregistrée. Réessayez.",
      navigation: {
        dashboard: "Accueil",
        share: "Partager ma place",
        find: "Trouver une place",
        dashboardShort: "Accueil",
        shareShort: "Partager",
        findShort: "Trouver",
      },
    },
    dashboard: {
      eyebrow: "Tableau de bord",
      greeting: (firstName) => `Bonjour, ${firstName}`,
      introduction: "Partagez votre place ou réservez celle d’un collègue pour les 7 prochains jours.",
      liveAvailability: "Disponibilités · 7 jours",
      communitySummary: (organization, count, formattedCount) => count === 1
        ? `Chez ${organization}, ${formattedCount} créneau a été publié.`
        : `Chez ${organization}, ${formattedCount} créneaux ont été publiés.`,
      quickActions: "Actions principales",
      assignedSpace: (spot) => `Votre place · ${spot}`,
      firstStep: "Première étape",
      shareSpace: "Partager ma place",
      declareSpace: "Déclarer ma place",
      shareDescription: "Indiquez quand elle est libre. Aucun motif d’absence n’est demandé.",
      prepareAvailability: "Préparer la disponibilité",
      availableSpaces: (count, formattedCount) => count === 1
        ? `${formattedCount} place disponible`
        : `${formattedCount} places disponibles`,
      findSpace: "Trouver une place",
      findDescription: "Consultez les créneaux publiés dans votre organisation.",
      viewAvailability: "Voir les disponibilités",
      weekKicker: "Cette semaine",
      weekTitle: "Partages et réservations",
      viewAll: "Tout voir",
      emptyTitle: "Aucun créneau publié pour le moment.",
      emptyBody: "Commencez par partager votre place.",
      weekActivity: "Activité de la semaine",
      shares: "Partages",
      bookings: "Réservations",
      availableSpacesStat: "Places disponibles",
    },
    share: {
      eyebrow: "Partager",
      titleAssigned: "Partager ma place",
      titleUnassigned: "Déclarer ma place",
      assignedIntroduction: (spot) => `Indiquez quand ${spot} est libre. Aucun motif d’absence n’est demandé.`,
      unassignedIntroduction: "Affectez d’abord la place que vous utilisez habituellement.",
      companyOnly: "Visible seulement dans votre organisation",
      timeOrderError: "L’heure de fin doit être postérieure à l’heure de début.",
      declareError: "La place n’a pas pu être déclarée. Réessayez.",
      publishError: "La disponibilité n’a pas pu être publiée. Réessayez.",
      withdrawError: "La disponibilité n’a pas pu être retirée. Réessayez.",
      spotAssigned: (spot) => `La place ${spot} est maintenant affectée à votre compte.`,
      publishedSuccess: (spot, date, from, to) => `${spot} est disponible le ${date}, de ${from} à ${to}.`,
      withdrawnSuccess: (spot, date) => `Le partage de ${spot} pour le ${date} a été retiré.`,
      withdrawConfirmation: (spot, date) => `Retirer le partage de ${spot} pour le ${date} ?`,
      formLabel: "Formulaire de partage",
      availabilitySlot: "Créneau de disponibilité",
      parkingLocalTime: "Les heures suivent l’heure locale du parking.",
      yourSpace: "Votre place",
      date: "Date",
      start: "Début",
      end: "Fin",
      localTime: "Heure locale",
      summary: "Récapitulatif",
      location: "Emplacement",
      schedule: "Horaire",
      privacyNote: "Votre absence et son motif ne sont jamais demandés.",
      publishing: "Publication…",
      publish: "Partager ma place",
      declareFormLabel: "Déclarer ma place",
      regularSpace: "Votre place habituelle",
      regularSpaceIntroduction: "Vous pourrez la partager dès cette étape terminée.",
      spotLabel: "Libellé de la place",
      levelOrZone: "Niveau ou zone",
      optional: "optionnel",
      levelPlaceholder: "Niveau A",
      saving: "Enregistrement…",
      assignSpace: "Affecter cette place",
      whyStep: "Pourquoi cette étape ?",
      stableSpaceTitle: "Une place stable, des créneaux flexibles.",
      stableSpaceBody: "Parkventory rattache chaque disponibilité à une place précise pour éviter les conflits de réservation.",
      tracking: "Suivi",
      activeShares: "Mes partages actifs",
      noActiveShares: "Aucun partage actif.",
      noActiveSharesBody: "Le prochain créneau publié apparaîtra ici et pourra être retiré tant qu’il n’est ni réservé ni commencé.",
      withdrawing: "Retrait…",
      withdraw: "Retirer",
    },
    find: {
      eyebrow: "Réserver",
      title: "Trouver une place",
      introduction: "Choisissez une disponibilité publiée, puis confirmez votre réservation.",
      oneSpaceOneBooking: "Une place, une réservation",
      scopeTitle: "Disponibilités des 7 prochains jours",
      scopeIntroduction: "Créneaux publiés par les collègues de votre organisation.",
      schedules: "Horaires",
      localTime: "Heure locale",
      available: "Disponibles",
      timeZoneNote: "Chaque créneau suit l’heure locale de son parking.",
      backToDashboard: "Revenir au tableau de bord",
      publishedSlots: "Créneaux publiés",
      choicesCount: (count, formattedCount) => count === 1
        ? `${formattedCount} place à choisir`
        : `${formattedCount} places à choisir`,
      emptyTitle: "Aucune place n’est disponible pour le moment.",
      emptyBody: "Revenez plus tard. Les nouveaux créneaux publiés apparaîtront ici.",
      selected: "Sélectionnée",
      choose: "Choisir",
      canceling: "Annulation…",
      cancel: "Annuler",
      cancellationClosed: "Annulation fermée",
      closeSelection: "Annuler la sélection",
      yourSelection: "Votre sélection",
      level: "Niveau",
      date: "Date",
      schedule: "Horaire",
      confirmationNote: "La confirmation attribuera ce créneau uniquement à votre compte.",
      confirming: "Confirmation…",
      confirmBooking: "Confirmer la réservation",
      selectSpace: "Sélectionnez une place",
      selectSpaceBody: "Le récapitulatif apparaîtra ici avant toute réservation.",
      bookedSuccess: (spot, date, time) => `${spot} est réservée pour le ${date}, ${time}.`,
      bookingConflict: "Cette place vient d’être réservée. La liste a été actualisée.",
      bookingFailed: "La place n’a pas pu être réservée. Réessayez.",
      cancellationFailed: "La réservation n’a pas pu être annulée. Réessayez.",
      cancellationSuccess: (spot, date, time) => `Votre réservation de ${spot} pour le ${date}, ${time}, est annulée.`,
      cancellationConfirmation: (spot, date, time) => `Annuler votre réservation de ${spot} pour le ${date}, ${time} ?`,
    },
    api: {
      timeout: "Le service met trop de temps à répondre. Réessayez.",
      unreachable: "Impossible de joindre Parkventory. Réessayez dans un instant.",
      actionFailed: "Cette action n’a pas abouti. Réessayez.",
      sessionExpired: "Votre connexion a expiré. Reconnectez-vous pour continuer.",
      forbidden: "Vous n’avez pas l’autorisation d’effectuer cette action.",
      conflict: "Ces données viennent de changer. Actualisez la page et réessayez.",
      rateLimited: (seconds) => `Trop de demandes. Réessayez dans ${seconds} secondes.`,
      rateLimitedGeneric: "Trop de demandes. Patientez avant de réessayer.",
      serviceProblem: "Le service rencontre un problème. Réessayez dans un instant.",
    },
  },
  en: {
    state: {
      serviceUnavailable: "The service is not responding.",
      loadingWorkspace: "Loading your organisation…",
      openingWorkspace: "Opening your organisation in Parkventory.",
      dashboardLoadFailed: "The parking data could not be loaded.",
    },
    availability: {
      dateUnknown: "Date not provided",
      timeUnknown: "Time not provided",
      timeZoneUnknown: "Time zone not provided",
      localTime: "Local time",
      levelUnknown: "Level not provided",
      viewerReservation: "Your booking",
      viewerAvailability: "Your availability",
      available: "Available",
      reserved: "Booked",
      published: "Published",
      unavailable: "Unavailable",
      reservationActive: "Active booking",
      withdrawalUnavailable: "Cannot be withdrawn",
    },
    shell: {
      betaTitle: "Parkventory is in beta.",
      betaLabel: "Beta version",
      refreshing: "Refreshing…",
      appNavigation: "App navigation",
      mainNavigation: "Main app navigation",
      quickNavigation: "Quick navigation",
      openNavigation: "Open navigation",
      closeNavigation: "Close navigation",
      appHome: "Parkventory app home",
      organizationAppHome: (companyName) => `${companyName} app home on Parkventory`,
      signingOut: "Signing out…",
      signOut: "Sign out",
      logoutFailed: "Unable to sign out. Try again.",
      profile: "Profile",
      languageUpdateFailed: "Your profile language could not be saved. Try again.",
      navigation: {
        dashboard: "Home",
        share: "Share my space",
        find: "Find a space",
        dashboardShort: "Home",
        shareShort: "Share",
        findShort: "Find",
      },
    },
    dashboard: {
      eyebrow: "Dashboard",
      greeting: (firstName) => `Hello, ${firstName}`,
      introduction: "Share your space or book a colleague’s space for the next 7 days.",
      liveAvailability: "Availability · 7 days",
      communitySummary: (organization, count, formattedCount) => count === 1
        ? `${organization} has published ${formattedCount} time slot.`
        : `${organization} has published ${formattedCount} time slots.`,
      quickActions: "Main actions",
      assignedSpace: (spot) => `Your space · ${spot}`,
      firstStep: "First step",
      shareSpace: "Share my space",
      declareSpace: "Register my space",
      shareDescription: "Choose when it is free. You will never be asked why you are away.",
      prepareAvailability: "Set availability",
      availableSpaces: (count, formattedCount) => count === 1
        ? `${formattedCount} available space`
        : `${formattedCount} available spaces`,
      findSpace: "Find a space",
      findDescription: "View time slots published within your organisation.",
      viewAvailability: "View availability",
      weekKicker: "This week",
      weekTitle: "Availability and bookings",
      viewAll: "View all",
      emptyTitle: "No time slots have been published yet.",
      emptyBody: "Start by sharing your space.",
      weekActivity: "This week’s activity",
      shares: "Availability",
      bookings: "Bookings",
      availableSpacesStat: "Available spaces",
    },
    share: {
      eyebrow: "Share",
      titleAssigned: "Share my space",
      titleUnassigned: "Register my space",
      assignedIntroduction: (spot) => `Choose when ${spot} is free. You will never be asked why you are away.`,
      unassignedIntroduction: "First register the parking space you normally use.",
      companyOnly: "Visible only within your organisation",
      timeOrderError: "The end time must be later than the start time.",
      declareError: "The parking space could not be registered. Try again.",
      publishError: "The availability could not be published. Try again.",
      withdrawError: "The availability could not be withdrawn. Try again.",
      spotAssigned: (spot) => `${spot} is now assigned to your account.`,
      publishedSuccess: (spot, date, from, to) => `${spot} is available on ${date} from ${from} to ${to}.`,
      withdrawnSuccess: (spot, date) => `${spot} is no longer available on ${date}.`,
      withdrawConfirmation: (spot, date) => `Withdraw the availability of ${spot} on ${date}?`,
      formLabel: "Availability form",
      availabilitySlot: "Availability time slot",
      parkingLocalTime: "Times are shown in the car park’s local time.",
      yourSpace: "Your space",
      date: "Date",
      start: "Start",
      end: "End",
      localTime: "Local time",
      summary: "Summary",
      location: "Location",
      schedule: "Time",
      privacyNote: "You will never be asked about your absence or the reason for it.",
      publishing: "Publishing…",
      publish: "Share my space",
      declareFormLabel: "Register my space",
      regularSpace: "Your usual parking space",
      regularSpaceIntroduction: "You can share it as soon as this step is complete.",
      spotLabel: "Parking space label",
      levelOrZone: "Level or zone",
      optional: "optional",
      levelPlaceholder: "Level A",
      saving: "Saving…",
      assignSpace: "Assign this space",
      whyStep: "Why is this needed?",
      stableSpaceTitle: "One assigned space, flexible time slots.",
      stableSpaceBody: "Parkventory links every availability to a specific parking space to prevent booking conflicts.",
      tracking: "Tracking",
      activeShares: "My active availability",
      noActiveShares: "No active availability.",
      noActiveSharesBody: "Your next published time slot will appear here and can be withdrawn until it is booked or begins.",
      withdrawing: "Withdrawing…",
      withdraw: "Withdraw",
    },
    find: {
      eyebrow: "Book",
      title: "Find a space",
      introduction: "Choose a published availability, then confirm your booking.",
      oneSpaceOneBooking: "One space, one booking",
      scopeTitle: "Availability for the next 7 days",
      scopeIntroduction: "Time slots published by colleagues in your organisation.",
      schedules: "Times",
      localTime: "Local time",
      available: "Available",
      timeZoneNote: "Each time slot is shown in the car park’s local time.",
      backToDashboard: "Back to dashboard",
      publishedSlots: "Published time slots",
      choicesCount: (count, formattedCount) => count === 1
        ? `${formattedCount} space to choose from`
        : `${formattedCount} spaces to choose from`,
      emptyTitle: "No parking spaces are available right now.",
      emptyBody: "Check again later. Newly published time slots will appear here.",
      selected: "Selected",
      choose: "Choose",
      canceling: "Cancelling…",
      cancel: "Cancel booking",
      cancellationClosed: "Cancellation closed",
      closeSelection: "Clear selection",
      yourSelection: "Your selection",
      level: "Level",
      date: "Date",
      schedule: "Time",
      confirmationNote: "Confirming will assign this time slot only to your account.",
      confirming: "Confirming…",
      confirmBooking: "Confirm booking",
      selectSpace: "Select a parking space",
      selectSpaceBody: "A summary will appear here before you book.",
      bookedSuccess: (spot, date, time) => `${spot} is booked for ${date}, ${time}.`,
      bookingConflict: "This space has just been booked. The list has been refreshed.",
      bookingFailed: "The parking space could not be booked. Try again.",
      cancellationFailed: "The booking could not be cancelled. Try again.",
      cancellationSuccess: (spot, date, time) => `Your booking of ${spot} for ${date}, ${time}, has been cancelled.`,
      cancellationConfirmation: (spot, date, time) => `Cancel your booking of ${spot} for ${date}, ${time}?`,
    },
    api: {
      timeout: "The service is taking too long to respond. Try again.",
      unreachable: "Unable to reach Parkventory. Try again in a moment.",
      actionFailed: "This action could not be completed. Try again.",
      sessionExpired: "Your session has expired. Sign in again to continue.",
      forbidden: "You are not allowed to perform this action.",
      conflict: "This data has changed. Refresh the page and try again.",
      rateLimited: (seconds) => `Too many requests. Try again in ${seconds} seconds.`,
      rateLimitedGeneric: "Too many requests. Wait before trying again.",
      serviceProblem: "The service is experiencing a problem. Try again in a moment.",
    },
  },
  de: {
    state: {
      serviceUnavailable: "Der Dienst antwortet nicht.",
      loadingWorkspace: "Ihre Organisation wird geladen…",
      openingWorkspace: "Ihre Organisation wird in Parkventory geöffnet.",
      dashboardLoadFailed: "Die Parkplatzdaten konnten nicht geladen werden.",
    },
    availability: {
      dateUnknown: "Datum nicht angegeben",
      timeUnknown: "Uhrzeit nicht angegeben",
      timeZoneUnknown: "Zeitzone nicht angegeben",
      localTime: "Ortszeit",
      levelUnknown: "Ebene nicht angegeben",
      viewerReservation: "Ihre Reservierung",
      viewerAvailability: "Ihre Freigabe",
      available: "Verfügbar",
      reserved: "Reserviert",
      published: "Veröffentlicht",
      unavailable: "Nicht verfügbar",
      reservationActive: "Aktive Reservierung",
      withdrawalUnavailable: "Kann nicht zurückgezogen werden",
    },
    shell: {
      betaTitle: "Parkventory befindet sich in der Beta-Phase.",
      betaLabel: "Beta-Version",
      refreshing: "Wird aktualisiert…",
      appNavigation: "Anwendungsnavigation",
      mainNavigation: "Hauptnavigation der Anwendung",
      quickNavigation: "Schnellnavigation",
      openNavigation: "Navigation öffnen",
      closeNavigation: "Navigation schließen",
      appHome: "Startseite der Parkventory-Anwendung",
      organizationAppHome: (companyName) => `Startseite der Anwendung von ${companyName} auf Parkventory`,
      signingOut: "Wird abgemeldet…",
      signOut: "Abmelden",
      logoutFailed: "Die Abmeldung ist fehlgeschlagen. Versuchen Sie es erneut.",
      profile: "Profil",
      languageUpdateFailed: "Die Spracheinstellung Ihres Profils konnte nicht gespeichert werden. Versuchen Sie es erneut.",
      navigation: {
        dashboard: "Start",
        share: "Meinen Parkplatz teilen",
        find: "Parkplatz finden",
        dashboardShort: "Start",
        shareShort: "Teilen",
        findShort: "Suchen",
      },
    },
    dashboard: {
      eyebrow: "Übersicht",
      greeting: (firstName) => `Guten Tag, ${firstName}`,
      introduction: "Teilen Sie Ihren Parkplatz oder reservieren Sie den Parkplatz einer Kollegin oder eines Kollegen für die nächsten 7 Tage.",
      liveAvailability: "Verfügbarkeit · 7 Tage",
      communitySummary: (organization, count, formattedCount) => count === 1
        ? `Bei ${organization} wurde ${formattedCount} Zeitfenster veröffentlicht.`
        : `Bei ${organization} wurden ${formattedCount} Zeitfenster veröffentlicht.`,
      quickActions: "Hauptaktionen",
      assignedSpace: (spot) => `Ihr Parkplatz · ${spot}`,
      firstStep: "Erster Schritt",
      shareSpace: "Meinen Parkplatz teilen",
      declareSpace: "Parkplatz angeben",
      shareDescription: "Legen Sie fest, wann er frei ist. Der Grund Ihrer Abwesenheit wird nicht abgefragt.",
      prepareAvailability: "Verfügbarkeit festlegen",
      availableSpaces: (count, formattedCount) => count === 1
        ? `${formattedCount} verfügbarer Parkplatz`
        : `${formattedCount} verfügbare Parkplätze`,
      findSpace: "Parkplatz finden",
      findDescription: "Sehen Sie die in Ihrer Organisation veröffentlichten Zeitfenster.",
      viewAvailability: "Verfügbarkeit anzeigen",
      weekKicker: "Diese Woche",
      weekTitle: "Freigaben und Reservierungen",
      viewAll: "Alle anzeigen",
      emptyTitle: "Es wurden noch keine Zeitfenster veröffentlicht.",
      emptyBody: "Teilen Sie zunächst Ihren Parkplatz.",
      weekActivity: "Aktivität dieser Woche",
      shares: "Freigaben",
      bookings: "Reservierungen",
      availableSpacesStat: "Verfügbare Parkplätze",
    },
    share: {
      eyebrow: "Teilen",
      titleAssigned: "Meinen Parkplatz teilen",
      titleUnassigned: "Parkplatz angeben",
      assignedIntroduction: (spot) => `Legen Sie fest, wann ${spot} frei ist. Der Grund Ihrer Abwesenheit wird nicht abgefragt.`,
      unassignedIntroduction: "Geben Sie zunächst den Parkplatz an, den Sie normalerweise nutzen.",
      companyOnly: "Nur in Ihrer Organisation sichtbar",
      timeOrderError: "Die Endzeit muss nach der Startzeit liegen.",
      declareError: "Der Parkplatz konnte nicht gespeichert werden. Versuchen Sie es erneut.",
      publishError: "Die Verfügbarkeit konnte nicht veröffentlicht werden. Versuchen Sie es erneut.",
      withdrawError: "Die Freigabe konnte nicht zurückgezogen werden. Versuchen Sie es erneut.",
      spotAssigned: (spot) => `${spot} ist jetzt Ihrem Konto zugeordnet.`,
      publishedSuccess: (spot, date, from, to) => `${spot} ist am ${date} von ${from} bis ${to} verfügbar.`,
      withdrawnSuccess: (spot, date) => `Die Freigabe von ${spot} am ${date} wurde zurückgezogen.`,
      withdrawConfirmation: (spot, date) => `Die Freigabe von ${spot} am ${date} zurückziehen?`,
      formLabel: "Formular zur Parkplatzfreigabe",
      availabilitySlot: "Verfügbarkeitszeitraum",
      parkingLocalTime: "Die Zeiten werden in der Ortszeit des Parkplatzes angezeigt.",
      yourSpace: "Ihr Parkplatz",
      date: "Datum",
      start: "Beginn",
      end: "Ende",
      localTime: "Ortszeit",
      summary: "Zusammenfassung",
      location: "Standort",
      schedule: "Uhrzeit",
      privacyNote: "Ihre Abwesenheit und deren Grund werden nicht abgefragt.",
      publishing: "Wird veröffentlicht…",
      publish: "Meinen Parkplatz teilen",
      declareFormLabel: "Parkplatz angeben",
      regularSpace: "Ihr üblicher Parkplatz",
      regularSpaceIntroduction: "Nach diesem Schritt können Sie ihn teilen.",
      spotLabel: "Parkplatzbezeichnung",
      levelOrZone: "Ebene oder Bereich",
      optional: "optional",
      levelPlaceholder: "Ebene A",
      saving: "Wird gespeichert…",
      assignSpace: "Diesen Parkplatz zuordnen",
      whyStep: "Warum ist dieser Schritt erforderlich?",
      stableSpaceTitle: "Ein fester Parkplatz, flexible Zeitfenster.",
      stableSpaceBody: "Parkventory verknüpft jede Verfügbarkeit mit einem bestimmten Parkplatz, um Buchungskonflikte zu vermeiden.",
      tracking: "Übersicht",
      activeShares: "Meine aktiven Freigaben",
      noActiveShares: "Keine aktiven Freigaben.",
      noActiveSharesBody: "Ihr nächstes veröffentlichtes Zeitfenster erscheint hier und kann zurückgezogen werden, solange es weder reserviert wurde noch begonnen hat.",
      withdrawing: "Wird zurückgezogen…",
      withdraw: "Zurückziehen",
    },
    find: {
      eyebrow: "Reservieren",
      title: "Parkplatz finden",
      introduction: "Wählen Sie eine veröffentlichte Verfügbarkeit und bestätigen Sie anschließend Ihre Reservierung.",
      oneSpaceOneBooking: "Ein Parkplatz, eine Reservierung",
      scopeTitle: "Verfügbare Parkplätze der nächsten 7 Tage",
      scopeIntroduction: "Von Kolleginnen und Kollegen in Ihrer Organisation veröffentlichte Zeitfenster.",
      schedules: "Uhrzeiten",
      localTime: "Ortszeit",
      available: "Verfügbar",
      timeZoneNote: "Jedes Zeitfenster wird in der Ortszeit des Parkplatzes angezeigt.",
      backToDashboard: "Zurück zur Übersicht",
      publishedSlots: "Veröffentlichte Zeitfenster",
      choicesCount: (count, formattedCount) => count === 1
        ? `${formattedCount} Parkplatz zur Auswahl`
        : `${formattedCount} Parkplätze zur Auswahl`,
      emptyTitle: "Derzeit ist kein Parkplatz verfügbar.",
      emptyBody: "Schauen Sie später noch einmal vorbei. Neu veröffentlichte Zeitfenster erscheinen hier.",
      selected: "Ausgewählt",
      choose: "Auswählen",
      canceling: "Wird storniert…",
      cancel: "Reservierung stornieren",
      cancellationClosed: "Stornierung nicht mehr möglich",
      closeSelection: "Auswahl aufheben",
      yourSelection: "Ihre Auswahl",
      level: "Ebene",
      date: "Datum",
      schedule: "Uhrzeit",
      confirmationNote: "Mit der Bestätigung wird dieses Zeitfenster ausschließlich Ihrem Konto zugeordnet.",
      confirming: "Wird bestätigt…",
      confirmBooking: "Reservierung bestätigen",
      selectSpace: "Parkplatz auswählen",
      selectSpaceBody: "Vor der Reservierung erscheint hier eine Zusammenfassung.",
      bookedSuccess: (spot, date, time) => `${spot} ist für den ${date} ${time} reserviert.`,
      bookingConflict: "Dieser Parkplatz wurde gerade reserviert. Die Liste wurde aktualisiert.",
      bookingFailed: "Der Parkplatz konnte nicht reserviert werden. Versuchen Sie es erneut.",
      cancellationFailed: "Die Reservierung konnte nicht storniert werden. Versuchen Sie es erneut.",
      cancellationSuccess: (spot, date, time) => `Ihre Reservierung von ${spot} für den ${date} ${time} wurde storniert.`,
      cancellationConfirmation: (spot, date, time) => `Ihre Reservierung von ${spot} für den ${date} ${time} stornieren?`,
    },
    api: {
      timeout: "Der Dienst benötigt zu lange für eine Antwort. Versuchen Sie es erneut.",
      unreachable: "Parkventory ist nicht erreichbar. Versuchen Sie es in Kürze erneut.",
      actionFailed: "Diese Aktion konnte nicht abgeschlossen werden. Versuchen Sie es erneut.",
      sessionExpired: "Ihre Sitzung ist abgelaufen. Melden Sie sich erneut an, um fortzufahren.",
      forbidden: "Sie sind nicht berechtigt, diese Aktion auszuführen.",
      conflict: "Diese Daten haben sich geändert. Aktualisieren Sie die Seite und versuchen Sie es erneut.",
      rateLimited: (seconds) => `Zu viele Anfragen. Versuchen Sie es in ${seconds} Sekunden erneut.`,
      rateLimitedGeneric: "Zu viele Anfragen. Warten Sie, bevor Sie es erneut versuchen.",
      serviceProblem: "Beim Dienst ist ein Problem aufgetreten. Versuchen Sie es in Kürze erneut.",
    },
  },
  lb: {
    state: {
      serviceUnavailable: "De Service äntwert net.",
      loadingWorkspace: "Är Organisatioun gëtt gelueden…",
      openingWorkspace: "Är Organisatioun gëtt a Parkventory opgemaach.",
      dashboardLoadFailed: "D’Donnéeë vum Parking konnten net geluede ginn.",
    },
    availability: {
      dateUnknown: "Datum net uginn",
      timeUnknown: "Zäit net uginn",
      timeZoneUnknown: "Zäitzon net uginn",
      localTime: "Lokal Zäit",
      levelUnknown: "Niveau net uginn",
      viewerReservation: "Är Reservatioun",
      viewerAvailability: "Är Fräigab",
      available: "Disponibel",
      reserved: "Reservéiert",
      published: "Publizéiert",
      unavailable: "Net disponibel",
      reservationActive: "Aktiv Reservatioun",
      withdrawalUnavailable: "Kann net zeréckgezu ginn",
    },
    shell: {
      betaTitle: "Parkventory ass an der Beta-Phas.",
      betaLabel: "Beta-Versioun",
      refreshing: "Gëtt aktualiséiert…",
      appNavigation: "Navigatioun vun der Applikatioun",
      mainNavigation: "Haaptnavigatioun vun der Applikatioun",
      quickNavigation: "Schnellnavigatioun",
      openNavigation: "Navigatioun opmaachen",
      closeNavigation: "Navigatioun zoumaachen",
      appHome: "Startsäit vun der Parkventory-Applikatioun",
      organizationAppHome: (companyName) => `Startsäit vun der Applikatioun vu ${companyName} op Parkventory`,
      signingOut: "Gëtt ofgemellt…",
      signOut: "Ofmellen",
      logoutFailed: "D’Ofmelle konnt net ofgeschloss ginn. Probéiert nach eng Kéier.",
      profile: "Profil",
      languageUpdateFailed: "D’Sproochastellung vun Ärem Profil konnt net gespäichert ginn. Probéiert nach eng Kéier.",
      navigation: {
        dashboard: "Start",
        share: "Meng Parkplaz deelen",
        find: "Parkplaz fannen",
        dashboardShort: "Start",
        shareShort: "Deelen",
        findShort: "Fannen",
      },
    },
    dashboard: {
      eyebrow: "Iwwersiicht",
      greeting: (firstName) => `Moien, ${firstName}`,
      introduction: "Deelt Är Parkplaz oder reservéiert eng fräi Plaz vun engem Aarbechtskolleeg fir déi nächst 7 Deeg.",
      liveAvailability: "Disponibilitéiten · 7 Deeg",
      communitySummary: (organization, count, formattedCount) => count === 1
        ? `Bei ${organization} gouf ${formattedCount} Zäitraum publizéiert.`
        : `Bei ${organization} goufen ${formattedCount} Zäitraim publizéiert.`,
      quickActions: "Haaptaktiounen",
      assignedSpace: (spot) => `Är Parkplaz · ${spot}`,
      firstStep: "Éischte Schrëtt",
      shareSpace: "Meng Parkplaz deelen",
      declareSpace: "Parkplaz uginn",
      shareDescription: "Gitt un, wéini se fräi ass. De Grond vun Ärer Ofwiesenheet gëtt net gefrot.",
      prepareAvailability: "Disponibilitéit festleeën",
      availableSpaces: (count, formattedCount) => count === 1
        ? `${formattedCount} fräi Parkplaz`
        : `${formattedCount} fräi Parkplazen`,
      findSpace: "Parkplaz fannen",
      findDescription: "Kuckt d’Zäitraim, déi an Ärer Organisatioun publizéiert goufen.",
      viewAvailability: "Disponibilitéite weisen",
      weekKicker: "Dës Woch",
      weekTitle: "Fräigaben a Reservatiounen",
      viewAll: "Alles weisen",
      emptyTitle: "Et ass nach keen Zäitraum publizéiert.",
      emptyBody: "Deelt als Éischt Är Parkplaz.",
      weekActivity: "Aktivitéit vun dëser Woch",
      shares: "Fräigaben",
      bookings: "Reservatiounen",
      availableSpacesStat: "Fräi Parkplazen",
    },
    share: {
      eyebrow: "Deelen",
      titleAssigned: "Meng Parkplaz deelen",
      titleUnassigned: "Meng Parkplaz uginn",
      assignedIntroduction: (spot) => `Gitt un, wéini ${spot} fräi ass. De Grond vun Ärer Ofwiesenheet gëtt net gefrot.`,
      unassignedIntroduction: "Gitt fir d’éischt déi Parkplaz un, déi Dir normalerweis benotzt.",
      companyOnly: "Nëmme fir Är Organisatioun sichtbar",
      timeOrderError: "D’Ennzäit muss no der Ufankszäit leien.",
      declareError: "D’Parkplaz konnt net gespäichert ginn. Probéiert nach eng Kéier.",
      publishError: "D’Disponibilitéit konnt net publizéiert ginn. Probéiert nach eng Kéier.",
      withdrawError: "D’Fräigab konnt net zeréckgezu ginn. Probéiert nach eng Kéier.",
      spotAssigned: (spot) => `${spot} ass elo Ärem Kont zougewisen.`,
      publishedSuccess: (spot, date, from, to) => `${spot} ass den ${date} vun ${from} bis ${to} fräi.`,
      withdrawnSuccess: (spot, date) => `D’Fräigab vun ${spot} fir den ${date} gouf zeréckgezunn.`,
      withdrawConfirmation: (spot, date) => `D’Fräigab vun ${spot} fir den ${date} zeréckzéien?`,
      formLabel: "Formulaire fir d’Fräigab",
      availabilitySlot: "Zäitraum vun der Disponibilitéit",
      parkingLocalTime: "D’Zäite gi mat der lokaler Zäit vum Parking ugewisen.",
      yourSpace: "Är Parkplaz",
      date: "Datum",
      start: "Ufank",
      end: "Enn",
      localTime: "Lokal Zäit",
      summary: "Zesummefaassung",
      location: "Standuert",
      schedule: "Zäit",
      privacyNote: "Är Ofwiesenheet an hire Grond ginn ni gefrot.",
      publishing: "Gëtt publizéiert…",
      publish: "Meng Parkplaz deelen",
      declareFormLabel: "Meng Parkplaz uginn",
      regularSpace: "Är gewinnte Parkplaz",
      regularSpaceIntroduction: "Dir kënnt se deelen, soubal dëse Schrëtt fäerdeg ass.",
      spotLabel: "Bezeechnung vun der Parkplaz",
      levelOrZone: "Niveau oder Zon",
      optional: "fakultativ",
      levelPlaceholder: "Niveau A",
      saving: "Gëtt gespäichert…",
      assignSpace: "Dës Parkplaz zouweisen",
      whyStep: "Firwat ass dëse Schrëtt néideg?",
      stableSpaceTitle: "Eng fix Parkplaz, flexibel Zäitraim.",
      stableSpaceBody: "Parkventory verbënnt all Disponibilitéit mat enger bestëmmter Parkplaz, fir Reservatiounskonflikter ze verhënneren.",
      tracking: "Iwwersiicht",
      activeShares: "Meng aktiv Fräigaben",
      noActiveShares: "Keng aktiv Fräigab.",
      noActiveSharesBody: "Ären nächste publizéierten Zäitraum erschéngt hei a ka zeréckgezu ginn, soulaang en net reservéiert gouf oder ugefaangen huet.",
      withdrawing: "Gëtt zeréckgezunn…",
      withdraw: "Zeréckzéien",
    },
    find: {
      eyebrow: "Reservéieren",
      title: "Eng Parkplaz fannen",
      introduction: "Wielt eng publizéiert Disponibilitéit a bestätegt duerno Är Reservatioun.",
      oneSpaceOneBooking: "Eng Parkplaz, eng Reservatioun",
      scopeTitle: "Disponibilitéite fir déi nächst 7 Deeg",
      scopeIntroduction: "Zäitraim, déi vun Aarbechtskolleegen aus Ärer Organisatioun publizéiert goufen.",
      schedules: "Zäiten",
      localTime: "Lokal Zäit",
      available: "Disponibel",
      timeZoneNote: "All Zäitraum gëtt an der lokaler Zäit vum Parking ugewisen.",
      backToDashboard: "Zeréck bei d’Iwwersiicht",
      publishedSlots: "Publizéiert Zäitraim",
      choicesCount: (count, formattedCount) => count === 1
        ? `${formattedCount} Parkplaz zur Auswiel`
        : `${formattedCount} Parkplazen zur Auswiel`,
      emptyTitle: "Et ass de Moment keng Parkplaz disponibel.",
      emptyBody: "Kommt méi spéit zeréck. Nei publizéiert Zäitraim erschéngen hei.",
      selected: "Ausgewielt",
      choose: "Auswielen",
      canceling: "Gëtt annuléiert…",
      cancel: "Reservatioun annuléieren",
      cancellationClosed: "Annulatioun net méi méiglech",
      closeSelection: "Auswiel ophiewen",
      yourSelection: "Är Auswiel",
      level: "Niveau",
      date: "Datum",
      schedule: "Zäit",
      confirmationNote: "Mat der Bestätegung gëtt dësen Zäitraum nëmmen Ärem Kont zougewisen.",
      confirming: "Gëtt bestätegt…",
      confirmBooking: "Reservatioun bestätegen",
      selectSpace: "Wielt eng Parkplaz",
      selectSpaceBody: "Virun der Reservatioun erschéngt hei eng Zesummefaassung.",
      bookedSuccess: (spot, date, time) => `${spot} ass fir den ${date} ${time} reservéiert.`,
      bookingConflict: "Dës Parkplaz gouf grad reservéiert. D’Lëscht gouf aktualiséiert.",
      bookingFailed: "D’Parkplaz konnt net reservéiert ginn. Probéiert nach eng Kéier.",
      cancellationFailed: "D’Reservatioun konnt net annuléiert ginn. Probéiert nach eng Kéier.",
      cancellationSuccess: (spot, date, time) => `Är Reservatioun vun ${spot} fir den ${date} ${time} gouf annuléiert.`,
      cancellationConfirmation: (spot, date, time) => `Är Reservatioun vun ${spot} fir den ${date} ${time} annuléieren?`,
    },
    api: {
      timeout: "De Service brauch ze laang fir ze äntweren. Probéiert nach eng Kéier.",
      unreachable: "Parkventory ass net erreechbar. Probéiert et gläich nach eng Kéier.",
      actionFailed: "Dës Aktioun konnt net ofgeschloss ginn. Probéiert nach eng Kéier.",
      sessionExpired: "Är Sessioun ass ofgelaf. Mellt Iech nach eng Kéier un, fir weiderzefueren.",
      forbidden: "Dir sidd net berechtegt, dës Aktioun auszeféieren.",
      conflict: "Dës Donnéeën hu sech geännert. Aktualiséiert d’Säit a probéiert nach eng Kéier.",
      rateLimited: (seconds) => `Ze vill Ufroen. Probéiert et an ${seconds} Sekonnen nach eng Kéier.`,
      rateLimitedGeneric: "Ze vill Ufroen. Waart, ier Dir et nach eng Kéier probéiert.",
      serviceProblem: "Beim Service ass e Problem opgetrueden. Probéiert et gläich nach eng Kéier.",
    },
  },
} as const satisfies Record<Locale, ApplicationMessages>;
