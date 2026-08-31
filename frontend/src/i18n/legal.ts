import type { Locale } from "../../../shared/i18n";

interface LegalLayoutMessages {
  brandHomeLabel: string;
  backHome: string;
  updatedAt: string;
  navigationLabel: string;
  privacyLink: string;
  legalNoticeLink: string;
}

interface PrivacyMessages {
  title: string;
  lead: string;
  controllerTitle: string;
  controllerText: string;
  dataTitle: string;
  dataItems: readonly string[];
  dataNotCollected: string;
  purposeTitle: string;
  purposeText: string;
  providersTitle: string;
  providersText: string;
  retentionTitle: string;
  retentionItems: readonly string[];
  retentionText: string;
  rightsTitle: string;
  tenantAdminErasureText: string;
  rightsText: string;
  rightsAuthority: string;
  cookiesTitle: string;
  cookiesText: string;
}

interface LegalNoticeMessages {
  title: string;
  lead: string;
  publishingTitle: string;
  publisherLabel: string;
  publisherName: string;
  establishmentLabel: string;
  establishmentValue: string;
  contactLabel: string;
  postalAddress: string;
  hostingTitle: string;
  hostingBeforeLink: string;
  betaTitle: string;
  betaText: string;
  contentTitle: string;
  contentText: string;
  reportLabel: string;
}

export interface LegalMessages {
  layout: LegalLayoutMessages;
  privacy: PrivacyMessages;
  legalNotice: LegalNoticeMessages;
}

export const legalMessages = {
  fr: {
    layout: {
      brandHomeLabel: "Revenir à l’accueil Parkventory",
      backHome: "Accueil",
      updatedAt: "Bêta publique · mise à jour le 31 août 2026",
      navigationLabel: "Informations légales",
      privacyLink: "Confidentialité",
      legalNoticeLink: "Mentions légales",
    },
    privacy: {
      title: "Confidentialité",
      lead:
        "Parkventory collecte uniquement ce qui est nécessaire pour partager et réserver une place entre collègues. Aucun outil publicitaire ou de mesure d’audience n’est chargé dans l’application.",
      controllerTitle: "Responsable et contact",
      controllerText:
        "Parkventory est édité par Nicolas Pieper au Luxembourg. Pour exercer un droit, signaler un problème de confidentialité ou demander les coordonnées postales de l’éditeur, écrivez à",
      dataTitle: "Données utilisées avec un compte",
      dataItems: [
        "Adresse e-mail professionnelle et nom déduit de cette adresse.",
        "Organisation et adhésion déduites du domaine professionnel.",
        "Préférence de langue enregistrée automatiquement à la première connexion puis modifiable dans le profil.",
        "Place déclarée, disponibilités et réservations.",
        "Identifiants techniques de session, événements de sécurité et journaux bornés.",
      ],
      dataNotCollected:
        "Parkventory ne demande ni motif d’absence, ni plaque d’immatriculation, ni calendrier personnel, ni géolocalisation continue.",
      purposeTitle: "Pourquoi",
      purposeText:
        "Ces données servent à fournir le service demandé, empêcher les doubles réservations, isoler les organisations, sécuriser les comptes, envoyer les liens de connexion et diagnostiquer un incident. Elles ne sont ni vendues ni utilisées pour de la publicité.",
      providersTitle: "Prestataires",
      providersText:
        "Le prestataire d’hébergement fournit aussi la vérification de sécurité et l’envoi des liens de connexion. Il traite les informations nécessaires à ces services ; Parkventory limite les données à ce qui est utile au service.",
      retentionTitle: "Conservation pendant la bêta",
      retentionItems: [
        "Les liens de connexion expirent après 15 minutes et les sessions après 7 jours.",
        "Le compte, l’adhésion et l’historique métier sont conservés pendant la bêta pour faire fonctionner et sécuriser le service.",
        "Les journaux techniques et sauvegardes suivent les limites configurées par l’hébergeur et ne sont pas conservés au-delà du besoin d’exploitation.",
      ],
      retentionText:
        "Les demandes d’accès, d’export et de suppression sont traitées manuellement. Aucune purge automatique n’est présentée comme active à ce stade ; des durées plus précises seront publiées avec son automatisation.",
      rightsTitle: "Vos choix et vos droits",
      tenantAdminErasureText:
        "Un administrateur de votre organisation peut effacer l’adresse e-mail d’un compte membre et révoquer ses sessions ; l’historique de partage et de réservation reste alors conservé sans afficher cette adresse.",
      rightsText:
        "Vous pouvez demander l’accès, la correction, l’export ou la suppression de vos données, ainsi que vous opposer à un traitement lorsque le droit le permet. La demande est traitée manuellement pendant la bêta via",
      rightsAuthority:
        "Vous pouvez également introduire une réclamation auprès de votre autorité de contrôle.",
      cookiesTitle: "Cookies",
      cookiesText:
        "Parkventory utilise seulement les cookies techniques nécessaires à la connexion et au maintien de la session. Le choix du thème est conservé dans le stockage local de votre navigateur. Avant connexion, le choix de la langue est conservé dans ce même stockage local ainsi que dans un cookie technique. Lors de la première connexion, la langue alors utilisée est automatiquement enregistrée dans votre compte ; vous pouvez ensuite la modifier dans votre profil pour les prochaines sessions. Aucun cookie publicitaire n’est utilisé.",
    },
    legalNotice: {
      title: "Mentions légales",
      lead:
        "Parkventory est une bêta publique indépendante de partage de places de parking entre collègues.",
      publishingTitle: "Édition et publication",
      publisherLabel: "Éditeur et directeur de publication",
      publisherName: "Nicolas Pieper",
      establishmentLabel: "Établissement",
      establishmentValue: "Luxembourg",
      contactLabel: "Contact",
      postalAddress:
        "L’adresse postale complète est communiquée sur demande pendant la bêta et sera ajoutée ici avec la forme juridique définitive du service.",
      hostingTitle: "Hébergement",
      hostingBeforeLink: "Le service Parkventory est hébergé sur le réseau Cloudflare :",
      betaTitle: "Disponibilité de la bêta",
      betaText:
        "Le service peut évoluer rapidement ou connaître de courtes interruptions annoncées. Une place reste régie par les règles de l’organisation ou du site concerné ; Parkventory ne garantit pas un droit de stationnement indépendant de ces règles.",
      contentTitle: "Contenus et signalement",
      contentText:
        "Le nom, le logo, l’interface et les contenus Parkventory sont protégés par leurs droits respectifs.",
      reportLabel:
        "Pour signaler un contenu, une place contestée ou un usage abusif, contactez",
    },
  },
  en: {
    layout: {
      brandHomeLabel: "Return to the Parkventory home page",
      backHome: "Home",
      updatedAt: "Public beta · updated 31 August 2026",
      navigationLabel: "Legal information",
      privacyLink: "Privacy",
      legalNoticeLink: "Legal notice",
    },
    privacy: {
      title: "Privacy",
      lead:
        "Parkventory collects only what is needed to share and book a parking space among colleagues. No advertising or audience measurement tool is loaded in the application.",
      controllerTitle: "Controller and contact",
      controllerText:
        "Parkventory is published by Nicolas Pieper in Luxembourg. To exercise a right, report a privacy issue or request the publisher’s postal contact details, write to",
      dataTitle: "Data used with an account",
      dataItems: [
        "Work email address and name inferred from that address.",
        "Organisation and membership inferred from the work email domain.",
        "Language preference saved automatically at first sign-in and changeable later in the profile.",
        "Declared parking space, availability and bookings.",
        "Technical session identifiers, security events and limited logs.",
      ],
      dataNotCollected:
        "Parkventory does not ask for a reason for absence, a vehicle registration number, a personal calendar or continuous geolocation.",
      purposeTitle: "Why these data are used",
      purposeText:
        "These data are used to provide the requested service, prevent double bookings, keep organisations separate, secure accounts, send sign-in links and diagnose incidents. They are neither sold nor used for advertising.",
      providersTitle: "Service providers",
      providersText:
        "The hosting provider also supplies the security check and sends sign-in links. It processes the information needed for those services; Parkventory limits data to what the service needs.",
      retentionTitle: "Retention during the beta",
      retentionItems: [
        "Sign-in links expire after 15 minutes and sessions after 7 days.",
        "The account, membership and service history are retained during the beta to operate and secure the service.",
        "Technical logs and backups follow the limits configured by the hosting provider and are not retained beyond operational need.",
      ],
      retentionText:
        "Requests for access, export and deletion are handled manually. No automatic purge is presented as active at this stage; more precise periods will be published when it is automated.",
      rightsTitle: "Your choices and rights",
      tenantAdminErasureText:
        "An administrator in your organisation can erase a member account’s email address and revoke its sessions; sharing and booking history is then retained without displaying that address.",
      rightsText:
        "You can request access to, correction, export or deletion of your data, and object to processing where the law permits. Requests are handled manually during the beta via",
      rightsAuthority:
        "You can also lodge a complaint with your supervisory authority.",
      cookiesTitle: "Cookies",
      cookiesText:
        "Parkventory uses only the technical cookies required for sign-in and maintaining the session. Your theme choice is stored in your browser’s local storage. Before sign-in, your language choice is stored in the same local storage and in a technical cookie. At first sign-in, the language then in use is automatically saved to your account; you can change it later in your profile for future sessions. No advertising cookies are used.",
    },
    legalNotice: {
      title: "Legal notice",
      lead:
        "Parkventory is an independent public beta for sharing parking spaces among colleagues.",
      publishingTitle: "Publishing",
      publisherLabel: "Publisher and publication director",
      publisherName: "Nicolas Pieper",
      establishmentLabel: "Establishment",
      establishmentValue: "Luxembourg",
      contactLabel: "Contact",
      postalAddress:
        "The full postal address is provided on request during the beta and will be added here with the service’s final legal form.",
      hostingTitle: "Hosting",
      hostingBeforeLink: "The Parkventory service is hosted on the Cloudflare network:",
      betaTitle: "Beta availability",
      betaText:
        "The service may change quickly or experience short, announced interruptions. A parking space remains governed by the rules of the relevant organisation or site; Parkventory does not guarantee a right to park independently of those rules.",
      contentTitle: "Content and reporting",
      contentText:
        "The Parkventory name, logo, interface and content are protected by their respective rights.",
      reportLabel: "To report content, a disputed parking space or misuse, contact",
    },
  },
  de: {
    layout: {
      brandHomeLabel: "Zur Parkventory-Startseite zurückkehren",
      backHome: "Startseite",
      updatedAt: "Öffentliche Beta · aktualisiert am 31. August 2026",
      navigationLabel: "Rechtliche Informationen",
      privacyLink: "Datenschutz",
      legalNoticeLink: "Impressum",
    },
    privacy: {
      title: "Datenschutz",
      lead:
        "Parkventory erhebt nur die Daten, die erforderlich sind, um Parkplätze unter Kolleginnen und Kollegen zu teilen und zu buchen. In der Anwendung werden keine Werbe- oder Reichweitenmessungsdienste geladen.",
      controllerTitle: "Verantwortlicher und Kontakt",
      controllerText:
        "Parkventory wird von Nicolas Pieper in Luxemburg herausgegeben. Um ein Recht auszuüben, ein Datenschutzproblem zu melden oder die Postanschrift des Herausgebers anzufordern, schreiben Sie an",
      dataTitle: "Mit einem Konto verwendete Daten",
      dataItems: [
        "Geschäftliche E-Mail-Adresse und aus dieser Adresse abgeleiteter Name.",
        "Organisation und Mitgliedschaft, die aus der geschäftlichen Domain abgeleitet werden.",
        "Bei der ersten Anmeldung automatisch gespeicherte und anschließend im Profil änderbare Spracheinstellung.",
        "Gemeldeter Parkplatz, Verfügbarkeiten und Buchungen.",
        "Technische Sitzungskennungen, Sicherheitsereignisse und begrenzte Protokolle.",
      ],
      dataNotCollected:
        "Parkventory fragt weder nach Abwesenheitsgründen noch nach Kennzeichen, persönlichen Kalendern oder einer kontinuierlichen Standortbestimmung.",
      purposeTitle: "Warum diese Daten verwendet werden",
      purposeText:
        "Diese Daten werden verwendet, um den angeforderten Dienst bereitzustellen, Doppelbuchungen zu verhindern, Organisationen voneinander zu trennen, Konten zu schützen, Anmeldelinks zu senden und Störungen zu diagnostizieren. Sie werden weder verkauft noch für Werbung genutzt.",
      providersTitle: "Dienstleister",
      providersText:
        "Der Hosting-Anbieter stellt auch die Sicherheitsprüfung bereit und versendet die Anmeldelinks. Er verarbeitet die für diese Dienste erforderlichen Informationen; Parkventory beschränkt die Daten auf das, was für den Dienst notwendig ist.",
      retentionTitle: "Speicherung während der Beta",
      retentionItems: [
        "Anmeldelinks laufen nach 15 Minuten und Sitzungen nach 7 Tagen ab.",
        "Konto, Mitgliedschaft und Dienstverlauf werden während der Beta gespeichert, um den Dienst zu betreiben und zu schützen.",
        "Technische Protokolle und Sicherungskopien richten sich nach den beim Hosting-Anbieter konfigurierten Grenzen und werden nicht länger als betrieblich erforderlich aufbewahrt.",
      ],
      retentionText:
        "Anträge auf Auskunft, Export und Löschung werden manuell bearbeitet. Eine automatische Löschung wird derzeit nicht als aktiv dargestellt; genauere Fristen werden mit ihrer Automatisierung veröffentlicht.",
      rightsTitle: "Ihre Wahlmöglichkeiten und Rechte",
      tenantAdminErasureText:
        "Eine Administration Ihrer Organisation kann die E-Mail-Adresse eines Mitgliedskontos löschen und dessen Sitzungen widerrufen; der Verlauf von Freigaben und Buchungen bleibt anschließend ohne Anzeige dieser Adresse erhalten.",
      rightsText:
        "Sie können Auskunft, Berichtigung, Export oder Löschung Ihrer Daten verlangen und der Verarbeitung widersprechen, soweit das Recht dies zulässt. Anträge werden während der Beta manuell bearbeitet über",
      rightsAuthority:
        "Sie können außerdem eine Beschwerde bei Ihrer Aufsichtsbehörde einreichen.",
      cookiesTitle: "Cookies",
      cookiesText:
        "Parkventory verwendet nur technische Cookies, die für die Anmeldung und Aufrechterhaltung der Sitzung erforderlich sind. Ihre Designauswahl wird im lokalen Speicher Ihres Browsers gespeichert. Vor der Anmeldung wird Ihre Sprachauswahl im selben lokalen Speicher und in einem technischen Cookie gespeichert. Bei der ersten Anmeldung wird die dann verwendete Sprache automatisch in Ihrem Konto gespeichert; Sie können sie später im Profil für künftige Sitzungen ändern. Werbe-Cookies werden nicht verwendet.",
    },
    legalNotice: {
      title: "Impressum",
      lead:
        "Parkventory ist eine unabhängige öffentliche Beta zum Teilen von Parkplätzen unter Kolleginnen und Kollegen.",
      publishingTitle: "Herausgabe und Veröffentlichung",
      publisherLabel: "Herausgeber und inhaltlich Verantwortlicher",
      publisherName: "Nicolas Pieper",
      establishmentLabel: "Niederlassung",
      establishmentValue: "Luxemburg",
      contactLabel: "Kontakt",
      postalAddress:
        "Die vollständige Postanschrift wird während der Beta auf Anfrage mitgeteilt und hier zusammen mit der endgültigen Rechtsform des Dienstes ergänzt.",
      hostingTitle: "Hosting",
      hostingBeforeLink: "Der Dienst Parkventory wird im Cloudflare-Netzwerk gehostet:",
      betaTitle: "Verfügbarkeit der Beta",
      betaText:
        "Der Dienst kann sich schnell ändern oder kurze, angekündigte Unterbrechungen erfahren. Ein Parkplatz unterliegt weiterhin den Regeln der betreffenden Organisation oder des Standorts; Parkventory garantiert kein von diesen Regeln unabhängiges Parkrecht.",
      contentTitle: "Inhalte und Meldungen",
      contentText:
        "Der Name, das Logo, die Benutzeroberfläche und die Inhalte von Parkventory sind durch ihre jeweiligen Rechte geschützt.",
      reportLabel: "Um Inhalte, einen strittigen Parkplatz oder Missbrauch zu melden, kontaktieren Sie",
    },
  },
  lb: {
    layout: {
      brandHomeLabel: "Zréck op d’Parkventory-Startsäit",
      backHome: "Startsäit",
      updatedAt: "Ëffentlech Beta · aktualiséiert den 31. August 2026",
      navigationLabel: "Juristesch Informatiounen",
      privacyLink: "Dateschutz",
      legalNoticeLink: "Impressum",
    },
    privacy: {
      title: "Dateschutz",
      lead:
        "Parkventory sammelt nëmmen dat, wat néideg ass, fir Parkplazen ënner Aarbechtskolleegen ze deelen an ze reservéieren. An der Applikatioun gëtt keen Instrument fir Reklammen oder Reechwäitmiessung gelueden.",
      controllerTitle: "Verantwortlechen a Kontakt",
      controllerText:
        "Parkventory gëtt vum Nicolas Pieper zu Lëtzebuerg publizéiert. Fir e Recht auszeüben, en Dateschutzproblem ze mellen oder d’Postadress vum Editeur unzefroen, schreift un",
      dataTitle: "Donnéeën, déi mat engem Kont benotzt ginn",
      dataItems: [
        "Berufflech E-Mail-Adress an Numm, deen aus dëser Adress ofgeleet gëtt.",
        "Organisatioun a Memberschaft, déi aus dem berufflechen Domain ofgeleet ginn.",
        "Sproochastellung, déi bei der éischter Umeldung automatesch gespäichert gëtt an duerno am Profil geännert ka ginn.",
        "Gemellte Parkplaz, Disponibilitéiten a Reservatiounen.",
        "Technesch Sessiounsidentifikatiounen, Sécherheetsevenementer a begrenzte Logbicher.",
      ],
      dataNotCollected:
        "Parkventory freet weder no engem Grond fir d’Absence nach no enger Autosplack, engem perséinleche Kalenner oder enger kontinuéierlecher Geolokalisatioun.",
      purposeTitle: "Firwat dës Donnéeë benotzt ginn",
      purposeText:
        "Dës Donnéeë gi benotzt, fir de gewënschte Service unzebidden, duebel Reservatiounen ze verhënneren, Organisatiounen ze trennen, Konten ze sécheren, Umeldungslinken ze schécken an Tëschefäll ze diagnostizéieren. Si gi weder verkaaft nach fir Reklamme benotzt.",
      providersTitle: "Déngschtleeschter",
      providersText:
        "Den Hosting-Provider stellt och d’Sécherheetskontroll zur Verfügung a schéckt d’Umeldungslinken. Hie verschafft d’Informatiounen, déi fir dës Servicer néideg sinn; Parkventory limitéiert d’Donnéeën op dat, wat fir de Service gebraucht gëtt.",
      retentionTitle: "Späicherdauer wärend der Beta",
      retentionItems: [
        "Umeldungslinke lafen no 15 Minutten a Sessiounen no 7 Deeg of.",
        "De Kont, d’Memberschaft an de Verlaf vum Service gi wärend der Beta gespäichert, fir de Service ze bedreiwen an ze sécheren.",
        "Technesch Logbicher a Backuppe respektéieren d’Grenzen, déi vum Hosting-Provider konfiguréiert sinn, a ginn net méi laang wéi fir de Betrib néideg gespäichert.",
      ],
      retentionText:
        "Ufroe fir Zougang, Export a Läschung gi manuell behandelt. Eng automatesch Läschung gëtt an dësem Stadium net als aktiv duergestallt; méi genee Friste gi mat hirer Automatiséierung verëffentlecht.",
      rightsTitle: "Är Choixen a Rechter",
      tenantAdminErasureText:
        "Eng Administratioun vun Ärer Organisatioun kann d’E-Mail-Adress vun engem Memberskonto läschen a seng Sessiounen zréckruffen; d’Historik vun Deelen a Reservatioune bleift dono erhalen, ouni dës Adress unzeweisen.",
      rightsText:
        "Dir kënnt Zougang, Korrektur, Export oder Läschung vun Ären Donnéeë froen an enger Veraarbechtung widderspriechen, wann d’Recht dat erlaabt. D’Ufro gëtt wärend der Beta manuell behandelt iwwer",
      rightsAuthority:
        "Dir kënnt och eng Plainte bei Ärer zoustänneger Opsiichtsautoritéit maachen.",
      cookiesTitle: "Cookien",
      cookiesText:
        "Parkventory benotzt nëmmen technesch Cookien, déi fir d’Umeldung an d’Erhale vun der Sessioun néideg sinn. Är Wiel vum Thema gëtt am lokale Späicher vun Ärem Browser gespäichert. Virun der Umeldung gëtt Är Sproochwahl am selwechte lokale Späicher an an engem technesche Cookie gespäichert. Bei der éischter Umeldung gëtt d’Sprooch, déi dobäi benotzt gëtt, automatesch als Astellung an Ärem Kont gespäichert; duerno kënnt Dir se am Profil änneren. Et gi keng Reklamme-Cookië benotzt.",
    },
    legalNotice: {
      title: "Impressum",
      lead:
        "Parkventory ass eng onofhängeg ëffentlech Beta fir Parkplazen ënner Aarbechtskolleegen ze deelen.",
      publishingTitle: "Editeur a Publikatioun",
      publisherLabel: "Editeur a Verantwortleche fir d’Publikatioun",
      publisherName: "Nicolas Pieper",
      establishmentLabel: "Etablissement",
      establishmentValue: "Lëtzebuerg",
      contactLabel: "Kontakt",
      postalAddress:
        "Déi voll Postadress gëtt wärend der Beta op Ufro matgedeelt a gëtt hei mat der definitiver Rechtsform vum Service ergänzt.",
      hostingTitle: "Hosting",
      hostingBeforeLink: "De Service Parkventory gëtt am Cloudflare-Netzwierk gehost:",
      betaTitle: "Disponibilitéit vun der Beta",
      betaText:
        "De Service ka sech séier änneren oder kuerz, ugekënnegt Ënnerbriechungen hunn. Eng Parkplaz bleift de Reegele vun der betraffener Organisatioun oder vum betraffene Site ënnerworf; Parkventory garantéiert keen onofhängegt Parkrecht baussent dëse Reegelen.",
      contentTitle: "Inhalter a Meldungen",
      contentText:
        "Den Numm, de Logo, den Interface an d’Inhalter vu Parkventory sinn duerch hir jeeweileg Rechter geschützt.",
      reportLabel: "Fir en Inhalt, eng ëmstridde Parkplaz oder e mëssbräichleche Gebrauch ze mellen, kontaktéiert",
    },
  },
} satisfies Record<Locale, LegalMessages>;
