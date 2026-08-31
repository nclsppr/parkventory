import { Languages } from "lucide-react";
import { localeConfig, supportedLocales, type Locale } from "../../../shared/i18n";
import { commonMessages } from "../i18n/common";
import { useI18n } from "../i18n/I18n";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const copy = commonMessages[locale];
  const classes = ["language-switcher", className].filter(Boolean).join(" ");

  return (
    <label className={classes} title={copy.chooseLanguage}>
      <Languages aria-hidden="true" />
      <span className="sr-only">{copy.language}</span>
      <span className="language-switcher-current" aria-hidden="true">
        {locale.toUpperCase()}
      </span>
      <select
        aria-label={copy.chooseLanguage}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {supportedLocales.map((option) => (
          <option key={option} value={option} lang={localeConfig[option].htmlLang}>
            {localeConfig[option].label}
          </option>
        ))}
      </select>
    </label>
  );
}
