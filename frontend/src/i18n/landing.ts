import type { Locale } from "../../../shared/i18n";

interface TitledCopy {
  title: string;
  body: string;
}

interface LandingMessages {
  header: {
    brandLabel: string;
    mainNavigationLabel: string;
    howItWorks: string;
    teams: string;
    security: string;
    signIn: string;
    getStarted: string;
    openMenu: string;
    closeMenu: string;
    mobileNavigationLabel: string;
    openApp: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    summary: string;
    shareSpace: string;
    viewAvailability: string;
    note: string;
  };
  benefits: {
    label: string;
    items: readonly TitledCopy[];
  };
  signal: readonly string[];
  process: {
    index: string;
    title: string;
    titleSecondLine: string;
    introduction: string;
    discoverApp: string;
    steps: readonly TitledCopy[];
    visualLabel: string;
    visualCalloutStrong: string;
    visualCalloutRest: string;
  };
  teams: {
    kicker: string;
    title: string;
    titleSecondLine: string;
    introduction: string;
    items: readonly TitledCopy[];
  };
  security: {
    index: string;
    title: string;
    introduction: string;
    points: readonly string[];
  };
  start: {
    kicker: string;
    title: string;
    continueByEmail: string;
    note: string;
  };
  footer: {
    tagline: string;
    app: string;
    privacy: string;
    legal: string;
  };
  dashboard: {
    label: string;
    greeting: string;
    introduction: string;
    demo: string;
    availableSpaces: string;
    bookedAt: string;
    weekAvailability: string;
    available: string;
    selected: string;
  };
  parkingGridLabel: string;
  notFound: {
    kicker: string;
    title: string;
    body: string;
    backHome: string;
  };
}

export const landingMessages = {
  fr: {
    header: {
      brandLabel: "Parkventory, accueil",
      mainNavigationLabel: "Navigation principale",
      howItWorks: "Comment ça marche",
      teams: "Pour les équipes",
      security: "Sécurité",
      signIn: "Se connecter",
      getStarted: "Commencer",
      openMenu: "Ouvrir le menu",
      closeMenu: "Fermer le menu",
      mobileNavigationLabel: "Navigation mobile",
      openApp: "Ouvrir l’application",
    },
    hero: {
      eyebrow: "Le parking partagé, simplement.",
      title: "Partagez votre place.",
      titleAccent: "Gagnez du temps.",
      summary: "Quand vous êtes absent, rendez votre place disponible à vos collègues. Quand vous en avez besoin, réservez en quelques secondes.",
      shareSpace: "Partager ma place",
      viewAvailability: "Voir les disponibilités",
      note: "Aucun administrateur requis pour démarrer",
    },
    benefits: {
      label: "Bénéfices principaux",
      items: [
        { title: "Simple à partager", body: "Indiquez votre absence, votre place fait le reste." },
        { title: "Fiable à réserver", body: "Une disponibilité, une réservation, aucun doublon." },
        { title: "Pensé pour les équipes", body: "Moins de recherche, plus de fluidité au quotidien." },
      ],
    },
    signal: ["Choisir", "Partager", "Réserver", "Recommencer"],
    process: {
      index: "01 / Comment ça marche",
      title: "Une place libre.",
      titleSecondLine: "Un collègue dépanné.",
      introduction: "Parkventory transforme une absence en opportunité, sans ajouter de gestion au quotidien.",
      discoverApp: "Découvrir l’application",
      steps: [
        { title: "Indiquez votre absence", body: "Choisissez une journée ou une plage horaire." },
        { title: "La place devient disponible", body: "Elle apparaît uniquement aux collègues de votre organisation." },
        { title: "Un collègue la réserve", body: "La réservation est confirmée, sans échange manuel à organiser." },
      ],
      visualLabel: "Parking vu du ciel avec une place disponible en vert et une place sélectionnée en bleu",
      visualCalloutStrong: "Libre",
      visualCalloutRest: "devient visible à l’équipe",
    },
    teams: {
      kicker: "Communauté d’abord",
      title: "Commencez entre collègues.",
      titleSecondLine: "Structurez quand vous en avez besoin.",
      introduction: "Une adresse professionnelle vérifiée suffit pour rejoindre votre organisation. Les administrateurs restent optionnels et peuvent être nommés plus tard.",
      items: [
        { title: "Simple à démarrer", body: "Une adresse professionnelle suffit pour commencer." },
        { title: "Sans surveillance", body: "Chacun gère uniquement ses partages et réservations." },
        { title: "Évolutif", body: "Sites, places personnalisées et plan arrivent quand ils deviennent utiles." },
      ],
    },
    security: {
      index: "02 / Confiance",
      title: "Votre organisation reste votre frontière.",
      introduction: "L’adresse professionnelle sert à rejoindre la bonne organisation. Les disponibilités, membres et réservations ne passent jamais d’une organisation à l’autre.",
      points: [
        "Vérification de l’adresse avant toute adhésion",
        "Données minimales, aucun motif d’absence collecté",
        "Chacun garde la main sur ses partages et réservations",
      ],
    },
    start: {
      kicker: "Prêt à partager ?",
      title: "Votre prochaine place libre peut déjà aider quelqu’un.",
      continueByEmail: "Continuer par e-mail",
      note: "Votre adresse professionnelle sera vérifiée avant l’accès.",
    },
    footer: {
      tagline: "Le parking partagé, simplement.",
      app: "Application",
      privacy: "Confidentialité",
      legal: "Mentions légales",
    },
    dashboard: {
      label: "Aperçu de démonstration de l’application Parkventory",
      greeting: "Bonjour, Nicolas",
      introduction: "Voici les disponibilités du jour.",
      demo: "Aperçu démo",
      availableSpaces: "places disponibles",
      bookedAt: "réservée à 14:00",
      weekAvailability: "Disponibilités cette semaine",
      available: "Disponible",
      selected: "Sélectionnée",
    },
    parkingGridLabel: "Plan illustratif : places vertes disponibles, place bleue sélectionnée et places grises occupées",
    notFound: {
      kicker: "Erreur 404",
      title: "Cette place n’existe pas.",
      body: "Le lien demandé ne correspond à aucune page Parkventory.",
      backHome: "Revenir à l’accueil",
    },
  },
  en: {
    header: {
      brandLabel: "Parkventory, home",
      mainNavigationLabel: "Main navigation",
      howItWorks: "How it works",
      teams: "For teams",
      security: "Security",
      signIn: "Sign in",
      getStarted: "Get started",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      mobileNavigationLabel: "Mobile navigation",
      openApp: "Open the app",
    },
    hero: {
      eyebrow: "Shared parking, made simple.",
      title: "Share your space.",
      titleAccent: "Save time.",
      summary: "When you’re away, share your space with colleagues. When you need one, book it in seconds.",
      shareSpace: "Share my space",
      viewAvailability: "View availability",
      note: "No administrator required to get started",
    },
    benefits: {
      label: "Key benefits",
      items: [
        { title: "Easy to share", body: "Say when you’re away; your space takes care of the rest." },
        { title: "Reliable to book", body: "One availability, one booking, no duplicates." },
        { title: "Built for teams", body: "Less searching, smoother days." },
      ],
    },
    signal: ["Choose", "Share", "Book", "Repeat"],
    process: {
      index: "01 / How it works",
      title: "One free space.",
      titleSecondLine: "One colleague helped.",
      introduction: "Parkventory turns an absence into an opportunity, without adding daily admin.",
      discoverApp: "Explore the app",
      steps: [
        { title: "Mark your absence", body: "Choose a day or time slot." },
        { title: "Your space becomes available", body: "It appears only to colleagues in your organisation." },
        { title: "A colleague books it", body: "The booking is confirmed, with nothing to coordinate manually." },
      ],
      visualLabel: "Aerial view of a car park with one available space in green and one selected space in blue",
      visualCalloutStrong: "Available",
      visualCalloutRest: "becomes visible to the team",
    },
    teams: {
      kicker: "Community first",
      title: "Start with colleagues.",
      titleSecondLine: "Add structure when you need it.",
      introduction: "A verified work email is all you need to join your organisation. Administrators remain optional and can be appointed later.",
      items: [
        { title: "Easy to start", body: "A work email is all you need to get started." },
        { title: "No supervision", body: "Everyone manages only their own shares and bookings." },
        { title: "Scales with you", body: "Sites, custom spaces and a map arrive when they become useful." },
      ],
    },
    security: {
      index: "02 / Trust",
      title: "Your organisation remains your boundary.",
      introduction: "Your work email places you in the right organisation. Availability, members and bookings never cross between organisations.",
      points: [
        "Email verification before anyone joins",
        "Minimal data, with no reasons for absences collected",
        "Everyone stays in control of their shares and bookings",
      ],
    },
    start: {
      kicker: "Ready to share?",
      title: "Your next free space could already help someone.",
      continueByEmail: "Continue with email",
      note: "Your work email will be verified before access.",
    },
    footer: {
      tagline: "Shared parking, made simple.",
      app: "App",
      privacy: "Privacy",
      legal: "Legal notice",
    },
    dashboard: {
      label: "Demo preview of the Parkventory app",
      greeting: "Hello, Nicolas",
      introduction: "Here’s today’s availability.",
      demo: "Demo preview",
      availableSpaces: "spaces available",
      bookedAt: "booked at 14:00",
      weekAvailability: "Availability this week",
      available: "Available",
      selected: "Selected",
    },
    parkingGridLabel: "Illustrative map: green spaces are available, the blue space is selected and grey spaces are occupied",
    notFound: {
      kicker: "Error 404",
      title: "This space doesn’t exist.",
      body: "The requested link doesn’t match any Parkventory page.",
      backHome: "Back to home",
    },
  },
  de: {
    header: {
      brandLabel: "Parkventory, Startseite",
      mainNavigationLabel: "Hauptnavigation",
      howItWorks: "So funktioniert’s",
      teams: "Für Teams",
      security: "Sicherheit",
      signIn: "Anmelden",
      getStarted: "Loslegen",
      openMenu: "Menü öffnen",
      closeMenu: "Menü schließen",
      mobileNavigationLabel: "Mobile Navigation",
      openApp: "App öffnen",
    },
    hero: {
      eyebrow: "Parkplatz teilen, ganz einfach.",
      title: "Teilen Sie Ihren Parkplatz.",
      titleAccent: "Sparen Sie Zeit.",
      summary: "Wenn Sie nicht da sind, geben Sie Ihren Parkplatz für Kolleginnen und Kollegen frei. Wenn Sie einen brauchen, reservieren Sie ihn in wenigen Sekunden.",
      shareSpace: "Meinen Parkplatz teilen",
      viewAvailability: "Verfügbare Plätze anzeigen",
      note: "Kein Administrator nötig, um loszulegen",
    },
    benefits: {
      label: "Die wichtigsten Vorteile",
      items: [
        { title: "Einfach zu teilen", body: "Geben Sie Ihre Abwesenheit an – Ihr Parkplatz erledigt den Rest." },
        { title: "Zuverlässig zu reservieren", body: "Eine Verfügbarkeit, eine Reservierung, keine Doppelbuchung." },
        { title: "Für Teams entwickelt", body: "Weniger suchen, reibungsloser durch den Alltag." },
      ],
    },
    signal: ["Auswählen", "Teilen", "Reservieren", "Wiederholen"],
    process: {
      index: "01 / So funktioniert’s",
      title: "Ein freier Parkplatz.",
      titleSecondLine: "Ein Teammitglied unterstützt.",
      introduction: "Parkventory macht aus einer Abwesenheit eine Gelegenheit – ohne zusätzlichen Verwaltungsaufwand im Alltag.",
      discoverApp: "App entdecken",
      steps: [
        { title: "Abwesenheit angeben", body: "Wählen Sie einen Tag oder ein Zeitfenster." },
        { title: "Der Parkplatz wird verfügbar", body: "Er wird nur Kolleginnen und Kollegen in Ihrer Organisation angezeigt." },
        { title: "Ein Teammitglied reserviert ihn", body: "Die Reservierung wird bestätigt, ohne dass etwas manuell abgestimmt werden muss." },
      ],
      visualLabel: "Luftaufnahme eines Parkplatzes mit einem verfügbaren grünen und einem ausgewählten blauen Stellplatz",
      visualCalloutStrong: "Frei",
      visualCalloutRest: "wird für das Team sichtbar",
    },
    teams: {
      kicker: "Gemeinschaft zuerst",
      title: "Starten Sie mit Kolleginnen und Kollegen.",
      titleSecondLine: "Ergänzen Sie Struktur, wenn Sie sie brauchen.",
      introduction: "Eine verifizierte geschäftliche E-Mail-Adresse genügt, um Ihrer Organisation beizutreten. Administratorinnen und Administratoren bleiben optional und können später benannt werden.",
      items: [
        { title: "Einfach zu starten", body: "Eine geschäftliche E-Mail-Adresse genügt für den Einstieg." },
        { title: "Ohne zentrale Aufsicht", body: "Alle verwalten nur ihre eigenen Freigaben und Reservierungen." },
        { title: "Wächst mit Ihnen", body: "Standorte, individuelle Stellplätze und ein Lageplan kommen hinzu, wenn sie nützlich werden." },
      ],
    },
    security: {
      index: "02 / Vertrauen",
      title: "Ihre Organisation bleibt Ihre Grenze.",
      introduction: "Ihre geschäftliche E-Mail-Adresse bringt Sie in die richtige Organisation. Verfügbarkeiten, Mitglieder und Reservierungen werden nie organisationsübergreifend vermischt.",
      points: [
        "Prüfung der Adresse vor jedem Beitritt",
        "Nur notwendige Daten; Gründe für Abwesenheiten werden nicht erfasst",
        "Alle behalten die Kontrolle über ihre Freigaben und Reservierungen",
      ],
    },
    start: {
      kicker: "Bereit zum Teilen?",
      title: "Ihr nächster freier Parkplatz könnte schon jemandem helfen.",
      continueByEmail: "Mit E-Mail fortfahren",
      note: "Ihre geschäftliche E-Mail-Adresse wird vor dem Zugriff verifiziert.",
    },
    footer: {
      tagline: "Parkplatz teilen, ganz einfach.",
      app: "App",
      privacy: "Datenschutz",
      legal: "Impressum",
    },
    dashboard: {
      label: "Demo-Vorschau der Parkventory-App",
      greeting: "Hallo, Nicolas",
      introduction: "Hier sehen Sie die heutige Verfügbarkeit.",
      demo: "Demo-Vorschau",
      availableSpaces: "verfügbare Plätze",
      bookedAt: "reserviert um 14:00 Uhr",
      weekAvailability: "Verfügbarkeit diese Woche",
      available: "Verfügbar",
      selected: "Ausgewählt",
    },
    parkingGridLabel: "Illustrativer Plan: Grüne Stellplätze sind verfügbar, der blaue ist ausgewählt und graue Stellplätze sind belegt",
    notFound: {
      kicker: "Fehler 404",
      title: "Diesen Parkplatz gibt es nicht.",
      body: "Der aufgerufene Link gehört zu keiner Parkventory-Seite.",
      backHome: "Zurück zur Startseite",
    },
  },
  lb: {
    header: {
      brandLabel: "Parkventory, Startsäit",
      mainNavigationLabel: "Haaptnavigatioun",
      howItWorks: "Wéi et funktionéiert",
      teams: "Fir Ekippen",
      security: "Sécherheet",
      signIn: "Umellen",
      getStarted: "Ufänken",
      openMenu: "Menü opmaachen",
      closeMenu: "Menü zoumaachen",
      mobileNavigationLabel: "Mobil Navigatioun",
      openApp: "App opmaachen",
    },
    hero: {
      eyebrow: "Parkplazen deelen, ganz einfach.",
      title: "Deelt Är Parkplaz.",
      titleAccent: "Spuert Zäit.",
      summary: "Wann Dir net do sidd, stellt Är Parkplaz Äre Kolleegen zur Verfügung. Wann Dir eng braucht, reservéiert se an e puer Sekonnen.",
      shareSpace: "Meng Parkplaz deelen",
      viewAvailability: "Disponibilitéite kucken",
      note: "Keen Administrateur néideg fir unzefänken",
    },
    benefits: {
      label: "Haaptvirdeeler",
      items: [
        { title: "Einfach ze deelen", body: "Gitt un, wéini Dir net do sidd; Är Parkplaz mécht de Rescht." },
        { title: "Zouverlässeg ze reservéieren", body: "Eng Disponibilitéit, eng Reservatioun, keng Duebelreservatioun." },
        { title: "Fir Ekippe geduecht", body: "Manner sichen, méi flësseg am Alldag." },
      ],
    },
    signal: ["Auswielen", "Deelen", "Reservéieren", "Widderhuelen"],
    process: {
      index: "01 / Wéi et funktionéiert",
      title: "Eng fräi Parkplaz.",
      titleSecondLine: "E Kolleeg gehollef.",
      introduction: "Parkventory mécht aus enger Absence eng Geleeënheet, ouni zousätzlech Verwaltung am Alldag.",
      discoverApp: "D’App entdecken",
      steps: [
        { title: "Gitt Är Absence un", body: "Wielt en Dag oder eng Zäitfënster." },
        { title: "D’Parkplaz gëtt disponibel", body: "Si erschéngt nëmme fir d’Kolleegen aus Ärer Organisatioun." },
        { title: "E Kolleeg reservéiert se", body: "D’Reservatioun gëtt confirméiert, ouni eppes manuell ofstëmmen ze mussen." },
      ],
      visualLabel: "Vue vun uewen op e Parking mat enger disponibeler grénger an enger ausgewielter bloer Parkplaz",
      visualCalloutStrong: "Fräi",
      visualCalloutRest: "gëtt fir d’Ekipp siichtbar",
    },
    teams: {
      kicker: "D’Communautéit fir d’éischt",
      title: "Fänkt ënner Kolleegen un.",
      titleSecondLine: "Bréngt Struktur eran, wann Dir se braucht.",
      introduction: "Eng verifizéiert berufflech E-Mail-Adress geet duer, fir Ärer Organisatioun bäizetrieden. Administrateure bleiwen optional a kënne méi spéit genannt ginn.",
      items: [
        { title: "Einfach unzefänken", body: "Eng berufflech E-Mail-Adress geet duer fir unzefänken." },
        { title: "Ouni zentral Iwwerwaachung", body: "Jidderee geréiert nëmmen seng eege Fräigaben a Reservatiounen." },
        { title: "Wiisst mat Iech", body: "Standuerter, personaliséiert Parkplazen an e Plang kommen dobäi, soubal se nëtzlech ginn." },
      ],
    },
    security: {
      index: "02 / Vertrauen",
      title: "Är Organisatioun bleift Är Grenz.",
      introduction: "Déi berufflech E-Mail-Adress féiert Iech an déi richteg Organisatioun. Disponibilitéiten, Memberen a Reservatioune ginn ni tëscht Organisatioune vermëscht.",
      points: [
        "D’Adress gëtt virun all Bäitrëtt iwwerpréift",
        "Nëmmen déi néideg Donnéeën; kee Grond fir d’Absence gëtt gesammelt",
        "Jidderee behält d’Kontroll iwwer seng Fräigaben a Reservatiounen",
      ],
    },
    start: {
      kicker: "Prett fir ze deelen?",
      title: "Är nächst fräi Parkplaz kann elo schonn engem hëllefen.",
      continueByEmail: "Mat E-Mail weiderfueren",
      note: "Är berufflech E-Mail-Adress gëtt virum Zougang verifizéiert.",
    },
    footer: {
      tagline: "Parkplazen deelen, ganz einfach.",
      app: "App",
      privacy: "Dateschutz",
      legal: "Impressum",
    },
    dashboard: {
      label: "Demo-Virschau vun der Parkventory-App",
      greeting: "Moien, Nicolas",
      introduction: "Hei sinn d’Disponibilitéite fir haut.",
      demo: "Demo-Virschau",
      availableSpaces: "disponibel Parkplazen",
      bookedAt: "reservéiert fir 14:00 Auer",
      weekAvailability: "Disponibilitéiten dës Woch",
      available: "Disponibel",
      selected: "Ausgewielt",
    },
    parkingGridLabel: "Illustrative Plang: Déi gréng Parkplaze si fräi, déi blo ass ausgewielt an déi gro si besat",
    notFound: {
      kicker: "Feeler 404",
      title: "Dës Parkplaz gëtt et net.",
      body: "De gefrote Link entsprécht kenger Parkventory-Säit.",
      backHome: "Zréck op d’Startsäit",
    },
  },
} as const satisfies Record<Locale, LandingMessages>;
