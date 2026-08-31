import type { Locale } from "../../../shared/i18n";

export interface TenantAdminMessages {
  common: {
    actionFailed: string;
    never: string;
    retry: string;
  };
  state: {
    unavailable: string;
    opening: string;
    loadingWorkspace: (organizationName: string) => string;
  };
  header: {
    eyebrow: string;
    scopeDescription: (domain: string) => string;
    scopeBadge: string;
  };
  metrics: {
    regionLabel: string;
    users: string;
    administrators: string;
    parkingSpaces: string;
    shares: string;
    bookings: string;
    activeSessions: string;
  };
  usage: {
    eyebrow: string;
    title: (days: number, formattedDays: string) => string;
    chartLabel: (days: number, formattedDays: string) => string;
    daySummary: (
      date: string,
      shares: number,
      formattedShares: string,
      bookings: number,
      formattedBookings: string,
    ) => string;
    activeUsers: string;
    shares: string;
    bookings: string;
  };
  branding: {
    eyebrow: string;
    title: string;
    introduction: string;
    enable: string;
    enableHelp: string;
    actionColor: string;
    availabilityColor: string;
    colorPicker: string;
    hexadecimalValue: string;
    colorFormatError: string;
    useLogo: string;
    logoAuthorized: string;
    logoUnavailable: string;
    saving: string;
    save: string;
    saved: string;
    previewAria: string;
    preview: string;
    logoAlt: (tenantName: string) => string;
    previewSentence: string;
    previewShare: string;
    previewAvailable: string;
  };
  members: {
    eyebrow: string;
    title: string;
    introduction: string;
    searchLabel: string;
    searchPlaceholder: string;
    search: string;
    regionLabel: string;
    caption: (tenantName: string) => string;
    memberColumn: string;
    roleColumn: string;
    sessionsColumn: string;
    lastActivityColumn: string;
    privacyColumn: string;
    selfSuffix: string;
    erasedEmail: string;
    administratorRole: string;
    memberRole: string;
    eraseEmail: string;
    erased: string;
    unavailable: string;
    empty: string;
    loading: string;
    loadMore: string;
  };
  erase: {
    close: string;
    eyebrow: string;
    title: (displayName: string) => string;
    detail: string;
    note: string;
    cancel: string;
    erasing: string;
    confirm: string;
    success: (displayName: string) => string;
  };
}

export const tenantAdminMessages = {
  fr: {
    common: {
      actionFailed: "Cette action n’a pas abouti.",
      never: "Jamais",
      retry: "Réessayer",
    },
    state: {
      unavailable: "L’administration de cette organisation est indisponible.",
      opening: "Ouverture de l’administration…",
      loadingWorkspace: (organizationName) => `Chargement de l’espace ${organizationName}.`,
    },
    header: {
      eyebrow: "Administration limitée à cette organisation",
      scopeDescription: (domain) => `${domain} · vous ne voyez que les données de cette organisation.`,
      scopeBadge: "Périmètre de l’organisation",
    },
    metrics: {
      regionLabel: "Indicateurs de l’organisation",
      users: "Utilisateurs",
      administrators: "Administrateurs",
      parkingSpaces: "Places",
      shares: "Partages",
      bookings: "Réservations",
      activeSessions: "Sessions actives",
    },
    usage: {
      eyebrow: "Usage",
      title: (_days, formattedDays) => `Activité des ${formattedDays} derniers jours`,
      chartLabel: (_days, formattedDays) => `Partages et réservations quotidiens des ${formattedDays} derniers jours`,
      daySummary: (date, shares, formattedShares, bookings, formattedBookings) =>
        `${date} · ${formattedShares} partage${shares === 1 ? "" : "s"} · ${formattedBookings} réservation${bookings === 1 ? "" : "s"}`,
      activeUsers: "Utilisateurs actifs",
      shares: "Partages",
      bookings: "Réservations",
    },
    branding: {
      eyebrow: "Identité visuelle",
      title: "Couleurs et logo de l’organisation",
      introduction: "Les couleurs secondaires accessibles sont calculées automatiquement.",
      enable: "Activer la co-marque",
      enableHelp: "Appliquer ces couleurs dans l’espace de l’organisation.",
      actionColor: "Couleur d’action",
      availabilityColor: "Couleur de disponibilité",
      colorPicker: "sélecteur de couleur",
      hexadecimalValue: "valeur hexadécimale",
      colorFormatError: "Utilisez le format #RRGGBB pour les deux couleurs.",
      useLogo: "Utiliser le logo de l’organisation",
      logoAuthorized: "Logo autorisé par Parkventory.",
      logoUnavailable: "Aucun logo n’a encore été autorisé.",
      saving: "Enregistrement…",
      save: "Enregistrer l’identité",
      saved: "L’identité visuelle de l’organisation a été mise à jour.",
      previewAria: "Aperçu de l’identité visuelle",
      preview: "Aperçu",
      logoAlt: (tenantName) => `Logo ${tenantName}`,
      previewSentence: "Une place partagée, disponible aujourd’hui.",
      previewShare: "Partager",
      previewAvailable: "Disponible",
    },
    members: {
      eyebrow: "Membres",
      title: "Comptes de l’organisation",
      introduction: "Les rôles administrateur sont attribués uniquement par Parkventory.",
      searchLabel: "Rechercher un membre",
      searchPlaceholder: "Nom ou e-mail",
      search: "Rechercher",
      regionLabel: "Membres de l’organisation",
      caption: (tenantName) => `Membres de ${tenantName}`,
      memberColumn: "Membre",
      roleColumn: "Rôle",
      sessionsColumn: "Sessions",
      lastActivityColumn: "Dernière activité",
      privacyColumn: "Confidentialité",
      selfSuffix: " (vous)",
      erasedEmail: "E-mail effacé",
      administratorRole: "Administrateur de l’organisation",
      memberRole: "Membre",
      eraseEmail: "Effacer l’e-mail",
      erased: "Effacé",
      unavailable: "Non disponible",
      empty: "Aucun membre ne correspond à cette recherche.",
      loading: "Chargement des membres…",
      loadMore: "Charger les membres suivants",
    },
    erase: {
      close: "Annuler et fermer",
      eyebrow: "Confidentialité · action sensible",
      title: (displayName) => `Effacer l’e-mail de ${displayName} ?`,
      detail: "L’adresse sera remplacée par un identifiant irréversible et toutes les sessions du compte seront supprimées. Les partages, réservations et autres faits métier resteront conservés sans afficher l’e-mail.",
      note: "Une future connexion vérifiée avec la même adresse pourra recréer l’accès au compte.",
      cancel: "Annuler",
      erasing: "Effacement…",
      confirm: "Confirmer l’effacement",
      success: (displayName) => `L’adresse e-mail de ${displayName} a été effacée et ses sessions ont été supprimées.`,
    },
  },
  en: {
    common: {
      actionFailed: "This action could not be completed.",
      never: "Never",
      retry: "Try again",
    },
    state: {
      unavailable: "Administration for this organisation is unavailable.",
      opening: "Opening administration…",
      loadingWorkspace: (organizationName) => `Loading the ${organizationName} workspace.`,
    },
    header: {
      eyebrow: "Administration limited to this organisation",
      scopeDescription: (domain) => `${domain} · you can only see data from this organisation.`,
      scopeBadge: "Organisation scope",
    },
    metrics: {
      regionLabel: "Organisation metrics",
      users: "Users",
      administrators: "Administrators",
      parkingSpaces: "Parking spaces",
      shares: "Shares",
      bookings: "Bookings",
      activeSessions: "Active sessions",
    },
    usage: {
      eyebrow: "Usage",
      title: (_days, formattedDays) => `Activity over the last ${formattedDays} days`,
      chartLabel: (_days, formattedDays) => `Daily shares and bookings over the last ${formattedDays} days`,
      daySummary: (date, shares, formattedShares, bookings, formattedBookings) =>
        `${date} · ${formattedShares} share${shares === 1 ? "" : "s"} · ${formattedBookings} booking${bookings === 1 ? "" : "s"}`,
      activeUsers: "Active users",
      shares: "Shares",
      bookings: "Bookings",
    },
    branding: {
      eyebrow: "Visual identity",
      title: "Organisation colours and logo",
      introduction: "Accessible supporting colours are calculated automatically.",
      enable: "Enable co-branding",
      enableHelp: "Apply these colours in the organisation workspace.",
      actionColor: "Action colour",
      availabilityColor: "Availability colour",
      colorPicker: "colour picker",
      hexadecimalValue: "hexadecimal value",
      colorFormatError: "Use the #RRGGBB format for both colours.",
      useLogo: "Use the organisation logo",
      logoAuthorized: "Logo approved by Parkventory.",
      logoUnavailable: "No logo has been approved yet.",
      saving: "Saving…",
      save: "Save identity",
      saved: "The organisation’s visual identity has been updated.",
      previewAria: "Visual identity preview",
      preview: "Preview",
      logoAlt: (tenantName) => `${tenantName} logo`,
      previewSentence: "A shared parking space, available today.",
      previewShare: "Share",
      previewAvailable: "Available",
    },
    members: {
      eyebrow: "Members",
      title: "Organisation accounts",
      introduction: "Administrator roles are assigned only by Parkventory.",
      searchLabel: "Search for a member",
      searchPlaceholder: "Name or email",
      search: "Search",
      regionLabel: "Organisation members",
      caption: (tenantName) => `${tenantName} members`,
      memberColumn: "Member",
      roleColumn: "Role",
      sessionsColumn: "Sessions",
      lastActivityColumn: "Last activity",
      privacyColumn: "Privacy",
      selfSuffix: " (you)",
      erasedEmail: "Email erased",
      administratorRole: "Organisation administrator",
      memberRole: "Member",
      eraseEmail: "Erase email",
      erased: "Erased",
      unavailable: "Unavailable",
      empty: "No member matches this search.",
      loading: "Loading members…",
      loadMore: "Load more members",
    },
    erase: {
      close: "Cancel and close",
      eyebrow: "Privacy · sensitive action",
      title: (displayName) => `Erase ${displayName}’s email address?`,
      detail: "The address will be replaced with an irreversible identifier and all account sessions will be deleted. Shares, bookings and other business records will be retained without displaying the email address.",
      note: "A future verified sign-in with the same address may recreate access to the account.",
      cancel: "Cancel",
      erasing: "Erasing…",
      confirm: "Confirm erasure",
      success: (displayName) => `${displayName}’s email address has been erased and their sessions have been deleted.`,
    },
  },
  de: {
    common: {
      actionFailed: "Diese Aktion konnte nicht abgeschlossen werden.",
      never: "Nie",
      retry: "Erneut versuchen",
    },
    state: {
      unavailable: "Die Verwaltung dieser Organisation ist nicht verfügbar.",
      opening: "Verwaltung wird geöffnet…",
      loadingWorkspace: (organizationName) => `Der Bereich ${organizationName} wird geladen.`,
    },
    header: {
      eyebrow: "Auf diese Organisation beschränkte Verwaltung",
      scopeDescription: (domain) => `${domain} · Sie sehen nur die Daten dieser Organisation.`,
      scopeBadge: "Organisationsbereich",
    },
    metrics: {
      regionLabel: "Kennzahlen der Organisation",
      users: "Benutzer",
      administrators: "Administratoren",
      parkingSpaces: "Parkplätze",
      shares: "Freigaben",
      bookings: "Reservierungen",
      activeSessions: "Aktive Sitzungen",
    },
    usage: {
      eyebrow: "Nutzung",
      title: (_days, formattedDays) => `Aktivität der letzten ${formattedDays} Tage`,
      chartLabel: (_days, formattedDays) => `Tägliche Freigaben und Reservierungen der letzten ${formattedDays} Tage`,
      daySummary: (date, shares, formattedShares, bookings, formattedBookings) =>
        `${date} · ${formattedShares} Freigabe${shares === 1 ? "" : "n"} · ${formattedBookings} Reservierung${bookings === 1 ? "" : "en"}`,
      activeUsers: "Aktive Benutzer",
      shares: "Freigaben",
      bookings: "Reservierungen",
    },
    branding: {
      eyebrow: "Visuelles Erscheinungsbild",
      title: "Farben und Logo der Organisation",
      introduction: "Barrierefreie Ergänzungsfarben werden automatisch berechnet.",
      enable: "Co-Branding aktivieren",
      enableHelp: "Diese Farben im Bereich der Organisation anwenden.",
      actionColor: "Aktionsfarbe",
      availabilityColor: "Verfügbarkeitsfarbe",
      colorPicker: "Farbauswahl",
      hexadecimalValue: "Hexadezimalwert",
      colorFormatError: "Verwenden Sie für beide Farben das Format #RRGGBB.",
      useLogo: "Logo der Organisation verwenden",
      logoAuthorized: "Logo von Parkventory freigegeben.",
      logoUnavailable: "Es wurde noch kein Logo freigegeben.",
      saving: "Wird gespeichert…",
      save: "Erscheinungsbild speichern",
      saved: "Das visuelle Erscheinungsbild der Organisation wurde aktualisiert.",
      previewAria: "Vorschau des visuellen Erscheinungsbilds",
      preview: "Vorschau",
      logoAlt: (tenantName) => `Logo von ${tenantName}`,
      previewSentence: "Ein geteilter Parkplatz, heute verfügbar.",
      previewShare: "Teilen",
      previewAvailable: "Verfügbar",
    },
    members: {
      eyebrow: "Mitglieder",
      title: "Konten der Organisation",
      introduction: "Administratorrollen werden ausschließlich von Parkventory vergeben.",
      searchLabel: "Mitglied suchen",
      searchPlaceholder: "Name oder E-Mail-Adresse",
      search: "Suchen",
      regionLabel: "Mitglieder der Organisation",
      caption: (tenantName) => `Mitglieder von ${tenantName}`,
      memberColumn: "Mitglied",
      roleColumn: "Rolle",
      sessionsColumn: "Sitzungen",
      lastActivityColumn: "Letzte Aktivität",
      privacyColumn: "Datenschutz",
      selfSuffix: " (Sie)",
      erasedEmail: "E-Mail-Adresse gelöscht",
      administratorRole: "Administrator der Organisation",
      memberRole: "Mitglied",
      eraseEmail: "E-Mail-Adresse löschen",
      erased: "Gelöscht",
      unavailable: "Nicht verfügbar",
      empty: "Kein Mitglied entspricht dieser Suche.",
      loading: "Mitglieder werden geladen…",
      loadMore: "Weitere Mitglieder laden",
    },
    erase: {
      close: "Abbrechen und schließen",
      eyebrow: "Datenschutz · sensible Aktion",
      title: (displayName) => `E-Mail-Adresse von ${displayName} löschen?`,
      detail: "Die Adresse wird durch eine unumkehrbare Kennung ersetzt und alle Sitzungen des Kontos werden gelöscht. Freigaben, Reservierungen und andere Geschäftsdaten bleiben erhalten, ohne dass die E-Mail-Adresse angezeigt wird.",
      note: "Eine spätere verifizierte Anmeldung mit derselben Adresse kann den Kontozugang neu erstellen.",
      cancel: "Abbrechen",
      erasing: "Wird gelöscht…",
      confirm: "Löschen bestätigen",
      success: (displayName) => `Die E-Mail-Adresse von ${displayName} wurde gelöscht und die Sitzungen wurden entfernt.`,
    },
  },
  lb: {
    common: {
      actionFailed: "Dës Aktioun konnt net ofgeschloss ginn.",
      never: "Ni",
      retry: "Nach eng Kéier probéieren",
    },
    state: {
      unavailable: "D'Administratioun vun dëser Organisatioun ass net disponibel.",
      opening: "D'Administratioun gëtt opgemaach…",
      loadingWorkspace: (organizationName) => `De Beräich ${organizationName} gëtt gelueden.`,
    },
    header: {
      eyebrow: "Administratioun limitéiert op dës Organisatioun",
      scopeDescription: (domain) => `${domain} · Dir gesitt nëmmen d'Donnéeë vun dëser Organisatioun.`,
      scopeBadge: "Ëmfang vun der Organisatioun",
    },
    metrics: {
      regionLabel: "Indicateure vun der Organisatioun",
      users: "Benotzer",
      administrators: "Administrateuren",
      parkingSpaces: "Parkplazen",
      shares: "Deelungen",
      bookings: "Reservatiounen",
      activeSessions: "Aktiv Sessiounen",
    },
    usage: {
      eyebrow: "Notzung",
      title: (_days, formattedDays) => `Aktivitéit vun de leschten ${formattedDays} Deeg`,
      chartLabel: (_days, formattedDays) => `Deelungen a Reservatioune pro Dag an de leschten ${formattedDays} Deeg`,
      daySummary: (date, shares, formattedShares, bookings, formattedBookings) =>
        `${date} · ${formattedShares} Deelung${shares === 1 ? "" : "en"} · ${formattedBookings} Reservatioun${bookings === 1 ? "" : "en"}`,
      activeUsers: "Aktiv Benotzer",
      shares: "Deelungen",
      bookings: "Reservatiounen",
    },
    branding: {
      eyebrow: "Visuell Identitéit",
      title: "Faarwen a Logo vun der Organisatioun",
      introduction: "Accessibel Ergänzungsfaarwe ginn automatesch berechent.",
      enable: "Co-Branding aktivéieren",
      enableHelp: "Dës Faarwen am Beräich vun der Organisatioun uwenden.",
      actionColor: "Aktiounsfaarf",
      availabilityColor: "Disponibilitéitsfaarf",
      colorPicker: "Faarfauswiel",
      hexadecimalValue: "hexadezimal Wäert",
      colorFormatError: "Benotzt fir béid Faarwen d'Format #RRGGBB.",
      useLogo: "De Logo vun der Organisatioun benotzen",
      logoAuthorized: "Logo vu Parkventory autoriséiert.",
      logoUnavailable: "Et gouf nach kee Logo autoriséiert.",
      saving: "Gëtt gespäichert…",
      save: "Identitéit späicheren",
      saved: "D'visuell Identitéit vun der Organisatioun gouf aktualiséiert.",
      previewAria: "Virschau vun der visueller Identitéit",
      preview: "Virschau",
      logoAlt: (tenantName) => `Logo vun ${tenantName}`,
      previewSentence: "Eng gedeelt Parkplaz, haut disponibel.",
      previewShare: "Deelen",
      previewAvailable: "Disponibel",
    },
    members: {
      eyebrow: "Memberen",
      title: "Konte vun der Organisatioun",
      introduction: "Administrateursrolle ginn nëmme vu Parkventory zougewisen.",
      searchLabel: "No engem Member sichen",
      searchPlaceholder: "Numm oder E-Mail-Adress",
      search: "Sichen",
      regionLabel: "Membere vun der Organisatioun",
      caption: (tenantName) => `Membere vun ${tenantName}`,
      memberColumn: "Member",
      roleColumn: "Roll",
      sessionsColumn: "Sessiounen",
      lastActivityColumn: "Lescht Aktivitéit",
      privacyColumn: "Dateschutz",
      selfSuffix: " (Dir)",
      erasedEmail: "E-Mail-Adress geläscht",
      administratorRole: "Administrateur vun der Organisatioun",
      memberRole: "Member",
      eraseEmail: "E-Mail-Adress läschen",
      erased: "Geläscht",
      unavailable: "Net disponibel",
      empty: "Kee Member entsprécht dëser Sich.",
      loading: "D'Membere gi gelueden…",
      loadMore: "Déi nächst Membere lueden",
    },
    erase: {
      close: "Ofbriechen an zoumaachen",
      eyebrow: "Dateschutz · sensibel Aktioun",
      title: (displayName) => `D'E-Mail-Adress vum ${displayName} läschen?`,
      detail: "D'Adress gëtt duerch eng irreversibel Kennung ersat an all Sessioune vum Kont gi geläscht. Deelungen, Reservatiounen an aner Geschäftsdonnéeë bleiwen erhalen, ouni d'E-Mail-Adress unzeweisen.",
      note: "Eng spéider verifizéiert Umeldung mat därselwechter Adress kann den Zougang zum Kont nei uleeën.",
      cancel: "Ofbriechen",
      erasing: "Gëtt geläscht…",
      confirm: "D'Läsche bestätegen",
      success: (displayName) => `D'E-Mail-Adress vum ${displayName} gouf geläscht an d'Sessioune goufe geläscht.`,
    },
  },
} satisfies Record<Locale, TenantAdminMessages>;
