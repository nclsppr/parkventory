// @ts-check

/** @typedef {import("@cloudflare/nimbus-docs/types").Breadcrumb} Breadcrumb */
/** @typedef {import("@cloudflare/nimbus-docs/types").PrevNext} PrevNext */
/** @typedef {import("@cloudflare/nimbus-docs/types").SidebarItem} SidebarItem */
/** @typedef {import("@cloudflare/nimbus-docs/types").SidebarSection} SidebarSection */

const absoluteScheme = /^[a-z][a-z0-9+.-]*:/iu;

/**
 * @param {string} basePath
 * @returns {string}
 */
function normalizeBasePath(basePath) {
  const normalized = (basePath || "/").trim();
  if (!normalized.startsWith("/")) {
    throw new Error("Nimbus base path must start with '/'.");
  }
  return normalized === "/" ? "" : normalized.replace(/\/+$/u, "");
}

/**
 * Prefix a site-relative URL with the Astro base path exactly once.
 *
 * @param {string} href
 * @param {string} basePath
 * @returns {string}
 */
export function withBasePath(href, basePath = "/") {
  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    absoluteScheme.test(href)
  ) {
    return href;
  }

  const base = normalizeBasePath(basePath);
  if (!base || href === base || href.startsWith(`${base}/`)) return href;
  return href === "/" ? `${base}/` : `${base}${href}`;
}

/**
 * Remove the Astro base path before passing a pathname to Nimbus helpers.
 *
 * @param {string} pathname
 * @param {string} basePath
 * @returns {string}
 */
export function withoutBasePath(pathname, basePath = "/") {
  const base = normalizeBasePath(basePath);
  if (!base) return pathname || "/";
  if (pathname === base || pathname === `${base}/`) return "/";
  if (pathname.startsWith(`${base}/`)) {
    return pathname.slice(base.length) || "/";
  }
  return pathname || "/";
}

/**
 * @param {string} href
 * @param {string | URL} site
 * @param {string} basePath
 * @returns {string}
 */
export function absoluteSiteUrl(href, site, basePath = "/") {
  return new URL(withBasePath(href, basePath), site).href;
}

/**
 * @param {SidebarItem[]} items
 * @param {string} basePath
 * @returns {SidebarItem[]}
 */
export function withBaseSidebar(items, basePath = "/") {
  return items.map((item) => {
    if (item.type === "group") {
      return {
        ...item,
        indexHref: item.indexHref
          ? withBasePath(item.indexHref, basePath)
          : undefined,
        children: withBaseSidebar(item.children, basePath),
      };
    }
    return { ...item, href: withBasePath(item.href, basePath) };
  });
}

/**
 * @param {Breadcrumb[]} breadcrumbs
 * @param {string} basePath
 * @returns {Breadcrumb[]}
 */
export function withBaseBreadcrumbs(breadcrumbs, basePath = "/") {
  return breadcrumbs.map((breadcrumb) => ({
    ...breadcrumb,
    label: breadcrumb.label === "Home" ? "Accueil" : breadcrumb.label,
    href: breadcrumb.href
      ? withBasePath(breadcrumb.href, basePath)
      : undefined,
  }));
}

/**
 * @param {PrevNext} prevNext
 * @param {string} basePath
 * @returns {PrevNext}
 */
export function withBasePrevNext(prevNext, basePath = "/") {
  return {
    prev: prevNext.prev
      ? { ...prevNext.prev, href: withBasePath(prevNext.prev.href, basePath) }
      : undefined,
    next: prevNext.next
      ? { ...prevNext.next, href: withBasePath(prevNext.next.href, basePath) }
      : undefined,
  };
}

/**
 * @param {SidebarSection[]} sections
 * @param {string} basePath
 * @returns {SidebarSection[]}
 */
export function withBaseSections(sections, basePath = "/") {
  return sections.map((section) => ({
    ...section,
    href: withBasePath(section.href, basePath),
  }));
}
