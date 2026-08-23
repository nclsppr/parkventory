import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AppLink } from "../components/AppLink";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/Theme";
import { homeUrl, isPublicDemo, legalUrl, privacyUrl } from "../config";

const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim() || "nicolas@pieper.fr";

function LegalLayout({
  children,
  current,
  title,
}: {
  children: ReactNode;
  current: "legal" | "privacy";
  title: string;
}) {
  return (
    <div className="legal-page">
      <a className="skip-link" href="#legal-content">Aller au contenu</a>
      <header className="legal-header">
        <AppLink href={homeUrl} aria-label="Revenir à l’accueil Parkventory">
          <Logo />
        </AppLink>
        <ThemeToggle />
      </header>
      <main id="legal-content" className="legal-main">
        <AppLink className="legal-back" href={homeUrl}>
          <ArrowLeft aria-hidden="true" /> Accueil
        </AppLink>
        <p className="section-kicker">Bêta publique · mise à jour le 23 août 2026</p>
        <h1>{title}</h1>
        {children}
      </main>
      <footer className="legal-footer">
        <nav aria-label="Informations légales">
          <AppLink aria-current={current === "privacy" ? "page" : undefined} href={privacyUrl}>
            Confidentialité
          </AppLink>
          <AppLink aria-current={current === "legal" ? "page" : undefined} href={legalUrl}>
            Mentions légales
          </AppLink>
        </nav>
        <p>© 2026 Nicolas Pieper</p>
      </footer>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout current="privacy" title="Confidentialité">
      <p className="legal-lead">
        {isPublicDemo
          ? "Cette démonstration ne crée aucun compte et n’envoie aucune donnée de réservation à Parkventory."
          : "Parkventory collecte uniquement ce qui est nécessaire pour partager et réserver une place entre collègues."}
        {" "}Aucun outil publicitaire ou de mesure d’audience n’est chargé dans l’application.
      </p>

      {isPublicDemo && (
        <section>
          <h2>Cette démonstration</h2>
          <p>
            Les exemples affichés et les actions réalisées dans la démo restent dans votre
            navigateur et sont réinitialisés lorsque la page est rechargée. Aucun e-mail n’est
            envoyé. L’hébergeur peut conserver des journaux de connexion techniques et bornés.
          </p>
        </section>
      )}

      <section>
        <h2>Responsable et contact</h2>
        <p>
          Parkventory est édité par Nicolas Pieper au Luxembourg. Pour exercer un droit,
          signaler un problème de confidentialité ou demander les coordonnées postales de
          l’éditeur, écrivez à <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </section>

      <section>
        <h2>Données utilisées avec un compte</h2>
        <ul>
          <li>adresse e-mail professionnelle et identité fournie par le service de connexion ;</li>
          <li>organisation, adhésion et site de rattachement ;</li>
          <li>place déclarée, disponibilités, réservations et invitations ;</li>
          <li>identifiants techniques de session, événements de sécurité et journaux bornés.</li>
        </ul>
        <p>
          Parkventory ne demande ni motif d’absence, ni plaque d’immatriculation, ni calendrier
          personnel, ni géolocalisation continue.
        </p>
      </section>

      <section>
        <h2>Pourquoi</h2>
        <p>
          Ces données servent à fournir le service demandé, empêcher les doubles réservations,
          isoler les organisations, sécuriser les comptes, envoyer les notifications utiles et
          diagnostiquer un incident. Elles ne sont ni vendues ni utilisées pour de la publicité.
        </p>
      </section>

      <section>
        <h2>Prestataires</h2>
        <p>
          {isPublicDemo ? "La version dynamique sera hébergée" : "L’application est hébergée"}
          {" "}sur un serveur OVHcloud en France. Auth0 EU
          {isPublicDemo ? " traitera" : " traite"} le parcours de connexion par e-mail. Un
          prestataire d’e-mail transactionnel achemine les invitations et notifications. Ces
          prestataires reçoivent seulement les données utiles à leur fonction.
        </p>
      </section>

      <section>
        <h2>Durées de la bêta</h2>
        <ul>
          <li>compte et adhésion : pendant l’utilisation du service, puis suppression sur demande ;</li>
          <li>invitations expirées : 30 jours ;</li>
          <li>offres et réservations terminées : 12 mois au maximum ;</li>
          <li>journaux techniques : 30 jours ;</li>
          <li>sauvegardes : rotation sur 30 jours.</li>
        </ul>
        <p>
          Les purges sont contrôlées manuellement pendant la bêta avant leur automatisation.
        </p>
      </section>

      <section>
        <h2>Vos choix et vos droits</h2>
        <p>
          Vous pouvez demander l’accès, la correction, l’export ou la suppression de vos données,
          ainsi que vous opposer à un traitement lorsque le droit le permet. La demande est
          traitée manuellement pendant la bêta via <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          Vous pouvez également introduire une réclamation auprès de votre autorité de contrôle.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Parkventory utilise seulement les cookies techniques nécessaires à la connexion et au
          maintien de la session. Le choix du thème est conservé dans votre navigateur. Aucun
          cookie publicitaire n’est utilisé.
        </p>
      </section>
    </LegalLayout>
  );
}

export function LegalNoticePage() {
  return (
    <LegalLayout current="legal" title="Mentions légales">
      <p className="legal-lead">
        Parkventory est une bêta publique indépendante de partage de places de parking entre
        collègues.
      </p>

      <section>
        <h2>Édition et publication</h2>
        <dl className="legal-details">
          <div><dt>Éditeur et directeur de publication</dt><dd>Nicolas Pieper</dd></div>
          <div><dt>Établissement</dt><dd>Luxembourg</dd></div>
          <div><dt>Contact</dt><dd><a href={`mailto:${contactEmail}`}>{contactEmail}</a></dd></div>
        </dl>
        <p>
          L’adresse postale complète est communiquée sur demande pendant la bêta et sera ajoutée
          ici avec la forme juridique définitive du service.
        </p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p>
          Le service public sur parkventory.com est hébergé par OVH SAS, 2 rue Kellermann,
          59100 Roubaix, France —
          {" "}<a href="https://www.ovhcloud.com/fr/" rel="noreferrer" target="_blank">
            ovhcloud.com <ExternalLink aria-hidden="true" />
          </a>.
        </p>
        {isPublicDemo && (
          <p>
            La copie de démonstration disponible sur GitHub Pages est également servie par
            GitHub, Inc., 88 Colin P Kelly Jr Street, San Francisco, CA 94107, États-Unis.
          </p>
        )}
      </section>

      <section>
        <h2>Disponibilité de la bêta</h2>
        <p>
          Le service peut évoluer rapidement ou connaître de courtes interruptions annoncées.
          Une place reste régie par les règles de l’entreprise ou du site concerné ; Parkventory
          ne garantit pas un droit de stationnement indépendant de ces règles.
        </p>
      </section>

      <section>
        <h2>Contenus et signalement</h2>
        <p>
          Le nom, le logo, l’interface et les contenus Parkventory sont protégés par leurs droits
          respectifs. Pour signaler un contenu, une place contestée ou un usage abusif, contactez
          {" "}<a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
