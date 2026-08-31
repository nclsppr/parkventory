import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "../../../shared/i18n";
import { I18nProvider } from "../i18n/I18n";
import { Turnstile } from "./Turnstile";

const languageExpectations: readonly {
  locale: Locale;
  widgetLanguage: "fr" | "en" | "de";
}[] = [
  { locale: "fr", widgetLanguage: "fr" },
  { locale: "en", widgetLanguage: "en" },
  { locale: "de", widgetLanguage: "de" },
  { locale: "lb", widgetLanguage: "fr" },
];

type TurnstileApi = NonNullable<Window["turnstile"]>;

const renderWidget = vi.fn<TurnstileApi["render"]>();
const removeWidget = vi.fn<TurnstileApi["remove"]>();

beforeAll(() => {
  vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "test-site-key");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  renderWidget.mockReset();
  renderWidget.mockImplementation(() => "widget-1");
  removeWidget.mockReset();
  window.turnstile = {
    render: renderWidget,
    remove: removeWidget,
  };

  const script = document.createElement("script");
  script.id = "cloudflare-turnstile-script";
  document.head.append(script);
});

afterEach(() => {
  cleanup();
  document.getElementById("cloudflare-turnstile-script")?.remove();
  delete window.turnstile;
  window.localStorage.clear();
  document.documentElement.removeAttribute("lang");
  window.history.replaceState({}, "", "/");
});

describe.each(languageExpectations)("Turnstile pour $locale", ({ locale, widgetLanguage }) => {
  it(`transmet explicitement ${widgetLanguage} au widget`, () => {
    const onToken = vi.fn();
    window.history.replaceState({}, "", `/${locale}/app`);

    render(
      <I18nProvider>
        <Turnstile onToken={onToken} />
      </I18nProvider>,
    );

    expect(renderWidget).toHaveBeenCalledOnce();
    expect(renderWidget).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        sitekey: "test-site-key",
        theme: "auto",
        size: "flexible",
        language: widgetLanguage,
      }),
    );
  });
});
