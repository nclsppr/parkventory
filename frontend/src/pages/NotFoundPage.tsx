import { ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/Theme";
import { localizedUrls } from "../config";
import { useI18n } from "../i18n/I18n";
import { landingMessages } from "../i18n/landing";

export function NotFoundPage({
  showLanguageSwitcher = true,
}: {
  showLanguageSwitcher?: boolean;
}) {
  const { locale } = useI18n();
  const copy = landingMessages[locale].notFound;
  const { homeUrl } = localizedUrls(locale);

  return (
    <main className="not-found-page">
      <div className="not-found-preferences">
        {showLanguageSwitcher && <LanguageSwitcher />}
        <ThemeToggle />
      </div>
      <Logo />
      <p className="section-kicker">{copy.kicker}</p>
      <h1>{copy.title}</h1>
      <p>{copy.body}</p>
      <a className="button button-primary" href={homeUrl}><ArrowLeft aria-hidden="true" /> {copy.backHome}</a>
    </main>
  );
}
