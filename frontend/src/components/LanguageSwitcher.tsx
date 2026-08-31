import { Languages } from "lucide-react";
import { localeConfig, supportedLocales, type Locale } from "../../../shared/i18n";
import { commonMessages } from "../i18n/common";
import { useI18n } from "../i18n/I18n";

interface LanguageSwitcherProps {
  className?: string;
  disabled?: boolean;
  onLocaleChange?: (locale: Locale) => void | Promise<void>;
}

export function LanguageSwitcher({
  className,
  disabled = false,
  onLocaleChange,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();
  const copy = commonMessages[locale];
  const classes = ["language-switcher", className].filter(Boolean).join(" ");

  return (
    <label
      className={classes}
      title={copy.chooseLanguage}
      aria-disabled={disabled ? "true" : undefined}
    >
      <Languages aria-hidden="true" />
      <span className="sr-only">{copy.language}</span>
      <span className="language-switcher-current" aria-hidden="true">
        {locale.toUpperCase()}
      </span>
      <select
        aria-label={copy.chooseLanguage}
        value={locale}
        disabled={disabled}
        onChange={(event) => {
          const nextLocale = event.target.value as Locale;
          void (onLocaleChange ? onLocaleChange(nextLocale) : setLocale(nextLocale));
        }}
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
