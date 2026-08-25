import { useEffect, useRef } from "react";

interface TurnstileApi {
  render(element: HTMLElement, options: {
    sitekey: string;
    theme: "auto";
    size: "flexible";
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

export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
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
  }, [onToken, siteKey]);

  if (!siteKey) {
    return <p className="field-error" role="alert">La vérification de sécurité est indisponible. Réessayez plus tard.</p>;
  }
  return <div className="turnstile-container" ref={container} />;
}
