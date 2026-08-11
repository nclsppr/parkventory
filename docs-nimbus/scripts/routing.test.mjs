import assert from "node:assert/strict";
import test from "node:test";
import {
  absoluteSiteUrl,
  withBaseBreadcrumbs,
  withBasePath,
  withBasePrevNext,
  withBaseSections,
  withBaseSidebar,
  withoutBasePath,
} from "../src/lib/routing.mjs";

const basePath = "/parkventory/docs/";

test("prefixes internal routes with the Pages base exactly once", () => {
  assert.equal(withBasePath("/", basePath), "/parkventory/docs/");
  assert.equal(
    withBasePath("/docs/product/vision/", basePath),
    "/parkventory/docs/docs/product/vision/",
  );
  assert.equal(
    withBasePath("/parkventory/docs/llms.txt", basePath),
    "/parkventory/docs/llms.txt",
  );
  assert.equal(withBasePath("https://example.com/", basePath), "https://example.com/");
  assert.equal(withBasePath("#section", basePath), "#section");
});

test("removes the Pages base before calling Nimbus navigation helpers", () => {
  assert.equal(withoutBasePath("/parkventory/docs/", basePath), "/");
  assert.equal(
    withoutBasePath("/parkventory/docs/docs/product/vision/", basePath),
    "/docs/product/vision/",
  );
  assert.equal(withoutBasePath("/docs/product/vision/", basePath), "/docs/product/vision/");
});

test("builds absolute agent and metadata URLs under the Pages base", () => {
  assert.equal(
    absoluteSiteUrl("/llms.txt", "https://nclsppr.github.io", basePath),
    "https://nclsppr.github.io/parkventory/docs/llms.txt",
  );
  assert.equal(
    absoluteSiteUrl(
      "https://nclsppr.github.io/parkventory/",
      "https://nclsppr.github.io",
      basePath,
    ),
    "https://nclsppr.github.io/parkventory/",
  );
});

test("prefixes navigation structures without changing external links", () => {
  const sidebar = withBaseSidebar(
    [
      {
        type: "group",
        label: "Produit",
        order: 0,
        sectionSlug: "docs/product",
        indexHref: "/docs/product/",
        children: [
          {
            type: "link",
            label: "Vision",
            href: "/docs/product/vision/",
            order: 0,
          },
          {
            type: "external",
            label: "GitHub",
            href: "https://github.com/nclsppr/parkventory",
            order: 1,
          },
        ],
      },
    ],
    basePath,
  );

  assert.equal(sidebar[0].type, "group");
  if (sidebar[0].type !== "group") throw new Error("Expected a sidebar group.");
  assert.equal(sidebar[0].indexHref, "/parkventory/docs/docs/product/");
  assert.equal(sidebar[0].children[0].type, "link");
  if (sidebar[0].children[0].type === "group") throw new Error("Expected a sidebar link.");
  assert.equal(
    sidebar[0].children[0].href,
    "/parkventory/docs/docs/product/vision/",
  );
  assert.equal(sidebar[0].children[1].type, "external");
  if (sidebar[0].children[1].type === "group") throw new Error("Expected an external link.");
  assert.equal(
    sidebar[0].children[1].href,
    "https://github.com/nclsppr/parkventory",
  );

  assert.deepEqual(
    withBaseBreadcrumbs(
      [
        { label: "Home", href: "/" },
        { label: "Vision", href: "/vision/" },
      ],
      basePath,
    ),
    [
      { label: "Accueil", href: "/parkventory/docs/" },
      { label: "Vision", href: "/parkventory/docs/vision/" },
    ],
  );
  assert.deepEqual(
    withBasePrevNext({ next: { label: "Règles", href: "/rules/" } }, basePath),
    {
      prev: undefined,
      next: { label: "Règles", href: "/parkventory/docs/rules/" },
    },
  );
  assert.deepEqual(
    withBaseSections([{ label: "Produit", href: "/product/", isActive: true }], basePath),
    [{ label: "Produit", href: "/parkventory/docs/product/", isActive: true }],
  );
});
