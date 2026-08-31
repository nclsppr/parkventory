import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { publicContactEmail } from "../../../shared/site";
import { AppLink } from "../components/AppLink";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/Theme";
import { localizedUrls } from "../config";
import { commonMessages } from "../i18n/common";
import { useI18n } from "../i18n/I18n";
import { legalMessages } from "../i18n/legal";

function LegalLayout({
  children,
  current,
  title,
}: {
  children: ReactNode;
  current: "legal" | "privacy";
  title: string;
}) {
  const { locale } = useI18n();
  const copy = legalMessages[locale].layout;
  const common = commonMessages[locale];
  const { homeUrl, legalUrl, privacyUrl } = localizedUrls(locale);

  return (
    <div className="legal-page">
      <a className="skip-link" href="#legal-content">{common.skipToContent}</a>
      <header className="legal-header">
        <AppLink href={homeUrl} aria-label={copy.brandHomeLabel}>
          <Logo />
        </AppLink>
        <div className="legal-preferences">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main id="legal-content" className="legal-main">
        <AppLink className="legal-back" href={homeUrl}>
          <ArrowLeft aria-hidden="true" /> {copy.backHome}
        </AppLink>
        <p className="section-kicker">{copy.updatedAt}</p>
        <h1>{title}</h1>
        {children}
      </main>
      <footer className="legal-footer">
        <nav aria-label={copy.navigationLabel}>
          <AppLink aria-current={current === "privacy" ? "page" : undefined} href={privacyUrl}>
            {copy.privacyLink}
          </AppLink>
          <AppLink aria-current={current === "legal" ? "page" : undefined} href={legalUrl}>
            {copy.legalNoticeLink}
          </AppLink>
        </nav>
        <p>© 2026 Nicolas Pieper</p>
      </footer>
    </div>
  );
}

export function PrivacyPage() {
  const { locale } = useI18n();
  const copy = legalMessages[locale].privacy;

  return (
    <LegalLayout current="privacy" title={copy.title}>
      <p className="legal-lead">{copy.lead}</p>

      <section>
        <h2>{copy.controllerTitle}</h2>
        <p>
          {copy.controllerText}{" "}
          <a href={`mailto:${publicContactEmail}`}>{publicContactEmail}</a>.
        </p>
      </section>

      <section>
        <h2>{copy.dataTitle}</h2>
        <ul>
          {copy.dataItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p>{copy.dataNotCollected}</p>
      </section>

      <section>
        <h2>{copy.purposeTitle}</h2>
        <p>{copy.purposeText}</p>
      </section>

      <section>
        <h2>{copy.providersTitle}</h2>
        <p>{copy.providersText}</p>
      </section>

      <section>
        <h2>{copy.retentionTitle}</h2>
        <ul>
          {copy.retentionItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p>{copy.retentionText}</p>
      </section>

      <section>
        <h2>{copy.rightsTitle}</h2>
        <p>
          {copy.rightsText}{" "}
          <a href={`mailto:${publicContactEmail}`}>{publicContactEmail}</a>. {copy.rightsAuthority}
        </p>
      </section>

      <section>
        <h2>{copy.cookiesTitle}</h2>
        <p>{copy.cookiesText}</p>
      </section>
    </LegalLayout>
  );
}

export function LegalNoticePage() {
  const { locale } = useI18n();
  const copy = legalMessages[locale].legalNotice;

  return (
    <LegalLayout current="legal" title={copy.title}>
      <p className="legal-lead">{copy.lead}</p>

      <section>
        <h2>{copy.publishingTitle}</h2>
        <dl className="legal-details">
          <div><dt>{copy.publisherLabel}</dt><dd>{copy.publisherName}</dd></div>
          <div><dt>{copy.establishmentLabel}</dt><dd>{copy.establishmentValue}</dd></div>
          <div><dt>{copy.contactLabel}</dt><dd><a href={`mailto:${publicContactEmail}`}>{publicContactEmail}</a></dd></div>
        </dl>
        <p>{copy.postalAddress}</p>
      </section>

      <section>
        <h2>{copy.hostingTitle}</h2>
        <p>
          {copy.hostingBeforeLink}
          {" "}<a href="https://www.cloudflare.com/" rel="noreferrer" target="_blank">
            cloudflare.com <ExternalLink aria-hidden="true" />
          </a>.
        </p>
      </section>

      <section>
        <h2>{copy.betaTitle}</h2>
        <p>{copy.betaText}</p>
      </section>

      <section>
        <h2>{copy.contentTitle}</h2>
        <p>
          {copy.contentText} {copy.reportLabel}{" "}
          <a href={`mailto:${publicContactEmail}`}>{publicContactEmail}</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
