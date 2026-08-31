import { useEffect, useRef } from "react";
import type { Locale } from "../../../shared/i18n";
import { commonMessages } from "../i18n/common";
import { useI18n } from "../i18n/I18n";

type TurnstileLanguage = "fr" | "en" | "de";

interface TurnstileApi {
  render(element: HTMLElement, options: {
    sitekey: string;
    theme: "auto";
    size: "flexible";
    language: TurnstileLanguage;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const scriptId = "cloudflare-turnstile-script";
const developmentSiteKey = "1x00000000000000000000AA";
const turnstileLanguages = {
  fr: "fr",
  en: "en",
  de: "de",
  // Luxembourgish is not in Turnstile's supported-language list; use French explicitly.
  lb: "fr",
} as const satisfies Record<Locale, TurnstileLanguage>;

export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const { locale } = useI18n();
  const copy = commonMessages[locale];
  const language = turnstileLanguages[locale];
  const container = useRef<HTMLDivElement>(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
    || (import.meta.env.DEV ? developmentSiteKey : "");

  useEffect(() => {
    if (!siteKey || !container.current) {
      onToken(null);
      return;
    }

    let active = true;
    let widgetId: string | null = null;
    const render = () => {
      if (!active || !container.current || !window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        theme: "auto",
        size: "flexible",
        language,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    };

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) render();
      else existing.addEventListener("load", render, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", render, { once: true });
      document.head.append(script);
    }

    return () => {
      active = false;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      onToken(null);
    };
  }, [language, onToken, siteKey]);

  if (!siteKey) {
    return <p className="field-error" role="alert">{copy.securityUnavailable}</p>;
  }
  return <div className="turnstile-container" ref={container} />;
}
