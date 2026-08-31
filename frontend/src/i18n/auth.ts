import type { Locale } from "../../../shared/i18n";

export interface AuthMessages {
  brandHomeLabel: string;
  accessKicker: string;
  signInTitle: string;
  signInIntro: string;
  emailLabel: string;
  emailPlaceholder: string;
  sending: string;
  requestLink: string;
  defaultHint: string;
  trust: string;
  backToPresentation: string;
  invalidProfessionalEmail: string;
  admin: {
    accessKicker: string;
    signInTitle: string;
    signInIntro: string;
    emailLabel: string;
    emailPlaceholder: string;
    invalidEmail: string;
    trust: string;
  };
  securityRequired: string;
  linkSent: string;
  requestRateLimited: string;
  requestUnavailable: string;
  requestFailed: string;
  callbackKicker: string;
  callbackVerifyingTitle: string;
  callbackSuccessTitle: string;
  callbackErrorTitle: string;
  callbackVerifyingMessage: string;
  callbackIncomplete: string;
  callbackWelcome: (displayName: string) => string;
  callbackOperatorWelcome: (displayName: string) => string;
  callbackExpired: string;
  callbackFailed: string;
  requestNewLink: string;
  applicationAccess: string;
  operatorAccess: string;
}

export const authMessages = {
  fr: {
    brandHomeLabel: "Parkventory, accueil",
    accessKicker: "Accès au parking de votre organisation",
    signInTitle: "Connectez-vous sans mot de passe.",
    signInIntro:
      "Saisissez votre adresse professionnelle. Le lien privé expire après 15 minutes et ne fonctionne qu’une fois.",
    emailLabel: "Adresse e-mail professionnelle",
    emailPlaceholder: "vous@entreprise.com",
    sending: "Envoi en cours…",
    requestLink: "Recevoir mon lien de connexion",
    defaultHint: "Aucun compte n’est créé avant la validation du lien.",
    trust: "Parkventory ne vous demandera jamais votre mot de passe professionnel.",
    backToPresentation: "Retour à la présentation",
    invalidProfessionalEmail: "Utilisez une adresse e-mail professionnelle.",
    admin: {
      accessKicker: "Accès opérateur système",
      signInTitle: "Accédez à la console d’exploitation.",
      signInIntro:
        "Saisissez votre adresse opérateur autorisée. Le serveur vérifie l’accès avant d’ouvrir la console.",
      emailLabel: "Adresse opérateur autorisée",
      emailPlaceholder: "operateur@domaine.tld",
      invalidEmail: "Saisissez une adresse e-mail valide.",
      trust: "L’adresse autorisée n’est jamais affichée par Parkventory.",
    },
    securityRequired: "Validez le contrôle de sécurité avant de continuer.",
    linkSent: "Si cette adresse professionnelle est éligible, un lien de connexion a été envoyé.",
    requestRateLimited: "Trop de liens ont été demandés. Patientez avant de réessayer.",
    requestUnavailable: "La connexion par e-mail est temporairement indisponible. Réessayez plus tard.",
    requestFailed: "Le lien de connexion n’a pas pu être envoyé. Réessayez.",
    callbackKicker: "Connexion sécurisée",
    callbackVerifyingTitle: "Vérification du lien…",
    callbackSuccessTitle: "Connexion réussie",
    callbackErrorTitle: "Lien indisponible",
    callbackVerifyingMessage: "Nous vérifions votre lien privé.",
    callbackIncomplete: "Le lien de connexion est incomplet.",
    callbackWelcome: (displayName) => `Bienvenue ${displayName}. Redirection vers votre organisation…`,
    callbackOperatorWelcome: (displayName) => `Bienvenue ${displayName}. Redirection vers la console d’exploitation…`,
    callbackExpired: "Ce lien est invalide, expiré ou déjà utilisé. Demandez-en un nouveau.",
    callbackFailed: "La connexion n’a pas pu être vérifiée. Demandez un nouveau lien.",
    requestNewLink: "Demander un nouveau lien",
    applicationAccess: "Accès à l’espace parking",
    operatorAccess: "Accès opérateur",
  },
  en: {
    brandHomeLabel: "Parkventory, home",
    accessKicker: "Access your organisation’s parking",
    signInTitle: "Sign in without a password.",
    signInIntro:
      "Enter your work email address. The private link expires after 15 minutes and works only once.",
    emailLabel: "Work email address",
    emailPlaceholder: "you@company.com",
    sending: "Sending…",
    requestLink: "Email me a sign-in link",
    defaultHint: "No account is created until the link is verified.",
    trust: "Parkventory will never ask for your work password.",
    backToPresentation: "Back to the overview",
    invalidProfessionalEmail: "Use a work email address.",
    admin: {
      accessKicker: "System operator access",
      signInTitle: "Open the operations console.",
      signInIntro:
        "Enter your authorised operator email address. The server checks access before opening the console.",
      emailLabel: "Authorised operator email",
      emailPlaceholder: "operator@example.com",
      invalidEmail: "Enter a valid email address.",
      trust: "Parkventory never displays the authorised address.",
    },
    securityRequired: "Complete the security check before continuing.",
    linkSent: "If this work email address is eligible, a sign-in link has been sent.",
    requestRateLimited: "Too many links have been requested. Wait before trying again.",
    requestUnavailable: "Email sign-in is temporarily unavailable. Try again later.",
    requestFailed: "The sign-in link could not be sent. Try again.",
    callbackKicker: "Secure sign-in",
    callbackVerifyingTitle: "Verifying the link…",
    callbackSuccessTitle: "You’re signed in",
    callbackErrorTitle: "Link unavailable",
    callbackVerifyingMessage: "We’re verifying your private link.",
    callbackIncomplete: "The sign-in link is incomplete.",
    callbackWelcome: (displayName) => `Welcome, ${displayName}. Redirecting to your organisation…`,
    callbackOperatorWelcome: (displayName) => `Welcome, ${displayName}. Redirecting to the operations console…`,
    callbackExpired: "This link is invalid, expired or has already been used. Request a new one.",
    callbackFailed: "We couldn’t verify your sign-in. Request a new link.",
    requestNewLink: "Request a new link",
    applicationAccess: "Parking workspace access",
    operatorAccess: "Operator access",
  },
  de: {
    brandHomeLabel: "Parkventory, Startseite",
    accessKicker: "Zugang zu den Parkplätzen Ihrer Organisation",
    signInTitle: "Ohne Passwort anmelden.",
    signInIntro:
      "Geben Sie Ihre geschäftliche E-Mail-Adresse ein. Der private Link läuft nach 15 Minuten ab und kann nur einmal verwendet werden.",
    emailLabel: "Geschäftliche E-Mail-Adresse",
    emailPlaceholder: "sie@unternehmen.de",
    sending: "Wird gesendet…",
    requestLink: "Anmeldelink per E-Mail erhalten",
    defaultHint: "Ein Konto wird erst erstellt, nachdem der Link bestätigt wurde.",
    trust: "Parkventory fragt Sie niemals nach Ihrem beruflichen Passwort.",
    backToPresentation: "Zurück zur Übersicht",
    invalidProfessionalEmail: "Verwenden Sie eine geschäftliche E-Mail-Adresse.",
    admin: {
      accessKicker: "Zugang für Systemoperatoren",
      signInTitle: "Öffnen Sie die Betriebskonsole.",
      signInIntro:
        "Geben Sie Ihre autorisierte Operator-E-Mail-Adresse ein. Der Server prüft den Zugriff, bevor die Konsole geöffnet wird.",
      emailLabel: "Autorisierte Operator-E-Mail-Adresse",
      emailPlaceholder: "operator@beispiel.de",
      invalidEmail: "Geben Sie eine gültige E-Mail-Adresse ein.",
      trust: "Parkventory zeigt die autorisierte Adresse niemals an.",
    },
    securityRequired: "Schließen Sie die Sicherheitsprüfung ab, bevor Sie fortfahren.",
    linkSent: "Wenn diese geschäftliche E-Mail-Adresse berechtigt ist, wurde ein Anmeldelink gesendet.",
    requestRateLimited: "Es wurden zu viele Links angefordert. Warten Sie, bevor Sie es erneut versuchen.",
    requestUnavailable: "Die Anmeldung per E-Mail ist vorübergehend nicht verfügbar. Versuchen Sie es später erneut.",
    requestFailed: "Der Anmeldelink konnte nicht gesendet werden. Versuchen Sie es erneut.",
    callbackKicker: "Sichere Anmeldung",
    callbackVerifyingTitle: "Link wird überprüft…",
    callbackSuccessTitle: "Anmeldung erfolgreich",
    callbackErrorTitle: "Link nicht verfügbar",
    callbackVerifyingMessage: "Wir überprüfen Ihren privaten Link.",
    callbackIncomplete: "Der Anmeldelink ist unvollständig.",
    callbackWelcome: (displayName) => `Willkommen, ${displayName}. Sie werden zu Ihrer Organisation weitergeleitet…`,
    callbackOperatorWelcome: (displayName) => `Willkommen, ${displayName}. Sie werden zur Betriebskonsole weitergeleitet…`,
    callbackExpired: "Dieser Link ist ungültig, abgelaufen oder wurde bereits verwendet. Fordern Sie einen neuen an.",
    callbackFailed: "Die Anmeldung konnte nicht überprüft werden. Fordern Sie einen neuen Link an.",
    requestNewLink: "Neuen Link anfordern",
    applicationAccess: "Zugang zum Parkplatzbereich",
    operatorAccess: "Operatorzugang",
  },
  lb: {
    brandHomeLabel: "Parkventory, Startsäit",
    accessKicker: "Zougang zu de Parkplaze vun Ärer Organisatioun",
    signInTitle: "Mellt Iech ouni Passwuert un.",
    signInIntro:
      "Gitt Är berufflech E-Mail-Adress an. De private Link leeft no 15 Minutten of a kann nëmmen eng Kéier benotzt ginn.",
    emailLabel: "Berufflech E-Mail-Adress",
    emailPlaceholder: "dir@firma.example",
    sending: "Gëtt geschéckt…",
    requestLink: "Umeldungslink per E-Mail kréien",
    defaultHint: "Et gëtt kee Kont ugeluecht, éier de Link bestätegt ass.",
    trust: "Parkventory freet Iech ni no Ärem beruffleche Passwuert.",
    backToPresentation: "Zréck bei d’Iwwersiicht",
    invalidProfessionalEmail: "Benotzt eng berufflech E-Mail-Adress.",
    admin: {
      accessKicker: "Zougang fir de Systemoperator",
      signInTitle: "Maacht d’Operatiounskonsol op.",
      signInIntro:
        "Gitt Är autoriséiert Operator-E-Mail-Adress an. De Server kontrolléiert den Zougang, éier d’Konsol opgemaach gëtt.",
      emailLabel: "Autoriséiert Operator-E-Mail-Adress",
      emailPlaceholder: "operator@beispill.lu",
      invalidEmail: "Gitt eng valabel E-Mail-Adress an.",
      trust: "Parkventory weist déi autoriséiert Adress ni un.",
    },
    securityRequired: "Maacht d'Sécherheetskontroll fäerdeg, éier Dir weiderfuert.",
    linkSent: "Wann dës berufflech E-Mail-Adress zougelooss ass, gouf en Umeldungslink geschéckt.",
    requestRateLimited: "Et goufen ze vill Linken ugefrot. Waart, éier Dir et nach eng Kéier probéiert.",
    requestUnavailable: "D'Umeldung per E-Mail ass de Moment net verfügbar. Probéiert et méi spéit nach eng Kéier.",
    requestFailed: "Den Umeldungslink konnt net geschéckt ginn. Probéiert et nach eng Kéier.",
    callbackKicker: "Sécher Umeldung",
    callbackVerifyingTitle: "De Link gëtt iwwerpréift…",
    callbackSuccessTitle: "Umeldung erfollegräich",
    callbackErrorTitle: "Link net verfügbar",
    callbackVerifyingMessage: "Mir iwwerpréiwen Äre private Link.",
    callbackIncomplete: "Den Umeldungslink ass net komplett.",
    callbackWelcome: (displayName) => `Wëllkomm, ${displayName}. Dir gitt an Är Organisatioun weidergeleet…`,
    callbackOperatorWelcome: (displayName) => `Wëllkomm, ${displayName}. Dir gitt an d’Operatiounskonsol weidergeleet…`,
    callbackExpired: "Dëse Link ass ongülteg, ofgelaf oder gouf scho benotzt. Frot en neien un.",
    callbackFailed: "D'Umeldung konnt net iwwerpréift ginn. Frot en neie Link un.",
    requestNewLink: "Neie Link ufroen",
    applicationAccess: "Zougang zum Parkberäich",
    operatorAccess: "Operator-Zougang",
  },
} satisfies Record<Locale, AuthMessages>;
