import { localizedPath, type Locale, type RouteId } from "../../shared/i18n";
import { publicContactEmail } from "../../shared/site";
import { landingMessages } from "../../frontend/src/i18n/landing";
import { legalMessages } from "../../frontend/src/i18n/legal";
import { escapeHtml } from "./security";

function text(value: string) {
  return escapeHtml(value);
}

function anchor(href: string, label: string) {
  return `<a href="${text(href)}">${text(label)}</a>`;
}

function unorderedList(items: readonly string[]) {
  return `<ul>${items.map((item) => `<li>${text(item)}</li>`).join("")}</ul>`;
}

function publicHeader(locale: Locale) {
  const layout = legalMessages[locale].layout;
  return `<header class="seo-prerender-header">
    ${anchor(localizedPath(locale, "home"), "Parkventory")}
    <nav aria-label="${text(layout.navigationLabel)}">
      ${anchor(localizedPath(locale, "privacy"), layout.privacyLink)}
      ${anchor(localizedPath(locale, "legal"), layout.legalNoticeLink)}
    </nav>
  </header>`;
}

function publicFooter(locale: Locale) {
  const layout = legalMessages[locale].layout;
  return `<footer class="seo-prerender-footer">
    <nav aria-label="${text(layout.navigationLabel)}">
      ${anchor(localizedPath(locale, "privacy"), layout.privacyLink)}
      ${anchor(localizedPath(locale, "legal"), layout.legalNoticeLink)}
    </nav>
    <p>© 2026 Nicolas Pieper</p>
  </footer>`;
}

function homeContent(locale: Locale) {
  const copy = landingMessages[locale];
  return `<div class="seo-prerender" data-server-rendered="home">
    ${publicHeader(locale)}
    <main class="seo-prerender-main">
      <p class="section-kicker">${text(copy.hero.eyebrow)}</p>
      <h1>${text(copy.hero.title)} <span>${text(copy.hero.titleAccent)}</span></h1>
      <p class="seo-prerender-lead">${text(copy.hero.summary)}</p>
      <p class="seo-prerender-actions">
        ${anchor(localizedPath(locale, "share"), copy.hero.shareSpace)}
        ${anchor(localizedPath(locale, "find"), copy.hero.viewAvailability)}
      </p>
      <p>${text(copy.hero.note)}</p>

      <section>
        <h2>${text(copy.benefits.label)}</h2>
        <ul>${copy.benefits.items.map((item) => `<li><strong>${text(item.title)}</strong><br>${text(item.body)}</li>`).join("")}</ul>
      </section>
      <section>
        <p class="section-kicker">${text(copy.process.index)}</p>
        <h2>${text(copy.process.title)} ${text(copy.process.titleSecondLine)}</h2>
        <p>${text(copy.process.introduction)}</p>
        <ol>${copy.process.steps.map((step) => `<li><strong>${text(step.title)}</strong><br>${text(step.body)}</li>`).join("")}</ol>
      </section>
      <section>
        <p class="section-kicker">${text(copy.teams.kicker)}</p>
        <h2>${text(copy.teams.title)} ${text(copy.teams.titleSecondLine)}</h2>
        <p>${text(copy.teams.introduction)}</p>
        <ul>${copy.teams.items.map((item) => `<li><strong>${text(item.title)}</strong><br>${text(item.body)}</li>`).join("")}</ul>
      </section>
      <section>
        <p class="section-kicker">${text(copy.security.index)}</p>
        <h2>${text(copy.security.title)}</h2>
        <p>${text(copy.security.introduction)}</p>
        ${unorderedList(copy.security.points)}
      </section>
      <section>
        <p class="section-kicker">${text(copy.start.kicker)}</p>
        <h2>${text(copy.start.title)}</h2>
        <p>${anchor(localizedPath(locale, "app"), copy.start.continueByEmail)}</p>
        <p>${text(copy.start.note)}</p>
      </section>
    </main>
    ${publicFooter(locale)}
  </div>`;
}

function privacyContent(locale: Locale) {
  const copy = legalMessages[locale].privacy;
  const layout = legalMessages[locale].layout;
  const email = anchor(`mailto:${publicContactEmail}`, publicContactEmail);
  return `<div class="seo-prerender seo-prerender-legal" data-server-rendered="privacy">
    ${publicHeader(locale)}
    <main class="seo-prerender-main">
      <p class="section-kicker">${text(layout.updatedAt)}</p>
      <h1>${text(copy.title)}</h1>
      <p class="seo-prerender-lead">${text(copy.lead)}</p>
      <section><h2>${text(copy.controllerTitle)}</h2><p>${text(copy.controllerText)} ${email}.</p></section>
      <section><h2>${text(copy.dataTitle)}</h2>${unorderedList(copy.dataItems)}<p>${text(copy.dataNotCollected)}</p></section>
      <section><h2>${text(copy.purposeTitle)}</h2><p>${text(copy.purposeText)}</p></section>
      <section><h2>${text(copy.providersTitle)}</h2><p>${text(copy.providersText)}</p></section>
      <section><h2>${text(copy.retentionTitle)}</h2>${unorderedList(copy.retentionItems)}<p>${text(copy.retentionText)}</p></section>
      <section><h2>${text(copy.rightsTitle)}</h2><p>${text(copy.rightsText)} ${email}. ${text(copy.rightsAuthority)}</p></section>
      <section><h2>${text(copy.cookiesTitle)}</h2><p>${text(copy.cookiesText)}</p></section>
    </main>
    ${publicFooter(locale)}
  </div>`;
}

function legalContent(locale: Locale) {
  const copy = legalMessages[locale].legalNotice;
  const layout = legalMessages[locale].layout;
  const email = anchor(`mailto:${publicContactEmail}`, publicContactEmail);
  return `<div class="seo-prerender seo-prerender-legal" data-server-rendered="legal">
    ${publicHeader(locale)}
    <main class="seo-prerender-main">
      <p class="section-kicker">${text(layout.updatedAt)}</p>
      <h1>${text(copy.title)}</h1>
      <p class="seo-prerender-lead">${text(copy.lead)}</p>
      <section>
        <h2>${text(copy.publishingTitle)}</h2>
        <dl>
          <div><dt>${text(copy.publisherLabel)}</dt><dd>${text(copy.publisherName)}</dd></div>
          <div><dt>${text(copy.establishmentLabel)}</dt><dd>${text(copy.establishmentValue)}</dd></div>
          <div><dt>${text(copy.contactLabel)}</dt><dd>${email}</dd></div>
        </dl>
        <p>${text(copy.postalAddress)}</p>
      </section>
      <section><h2>${text(copy.hostingTitle)}</h2><p>${text(copy.hostingBeforeLink)} ${anchor("https://www.cloudflare.com/", "cloudflare.com")}</p></section>
      <section><h2>${text(copy.betaTitle)}</h2><p>${text(copy.betaText)}</p></section>
      <section><h2>${text(copy.contentTitle)}</h2><p>${text(copy.contentText)}</p><p>${text(copy.reportLabel)} ${email}.</p></section>
    </main>
    ${publicFooter(locale)}
  </div>`;
}

function notFoundContent(locale: Locale) {
  const copy = landingMessages[locale].notFound;
  return `<main class="seo-prerender seo-prerender-not-found" data-server-rendered="notFound">
    <p class="section-kicker">${text(copy.kicker)}</p>
    <h1>${text(copy.title)}</h1>
    <p class="seo-prerender-lead">${text(copy.body)}</p>
    <p>${anchor(localizedPath(locale, "home"), copy.backHome)}</p>
  </main>`;
}

export function localizedVisibleContent(locale: Locale, route: RouteId): string | null {
  if (route === "home") return homeContent(locale);
  if (route === "privacy") return privacyContent(locale);
  if (route === "legal") return legalContent(locale);
  if (route === "notFound") return notFoundContent(locale);
  return null;
}
