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
  callbackExpired: string;
  callbackFailed: string;
  requestNewLink: string;
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
    callbackExpired: "Ce lien est invalide, expiré ou déjà utilisé. Demandez-en un nouveau.",
    callbackFailed: "La connexion n’a pas pu être vérifiée. Demandez un nouveau lien.",
    requestNewLink: "Demander un nouveau lien",
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
    callbackExpired: "This link is invalid, expired or has already been used. Request a new one.",
    callbackFailed: "We couldn’t verify your sign-in. Request a new link.",
    requestNewLink: "Request a new link",
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
    callbackExpired: "Dieser Link ist ungültig, abgelaufen oder wurde bereits verwendet. Fordern Sie einen neuen an.",
    callbackFailed: "Die Anmeldung konnte nicht überprüft werden. Fordern Sie einen neuen Link an.",
    requestNewLink: "Neuen Link anfordern",
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
    callbackExpired: "Dëse Link ass ongülteg, ofgelaf oder gouf scho benotzt. Frot en neien un.",
    callbackFailed: "D'Umeldung konnt net iwwerpréift ginn. Frot en neie Link un.",
    requestNewLink: "Neie Link ufroen",
  },
} satisfies Record<Locale, AuthMessages>;
