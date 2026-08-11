import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  convertSourceDocument,
  destinationFor,
  publicationSelectionFromEnvironment,
  selectPublicCollections,
  syntheticIndexDestination,
} from "./sync-content.mjs";

test("converts a plain Markdown source into Nimbus content", () => {
  const sourcePaths = new Set(["README.md", "docs/decision.md"]);
  const result = convertSourceDocument(
    "# Projet\n\nLire [la décision](docs/decision.md).\n",
    "README.md",
    "public",
    sourcePaths,
    "",
  );

  assert.match(result.content, /^---\ntitle: Projet\n/);
  assert.match(result.content, /sourcePath: README.md/);
  assert.match(result.content, /visibility: public/);
  assert.match(result.content, /\[la décision\]\(\/docs\/decision\)/);
  assert.doesNotMatch(result.content, /^# Projet$/m);
});

test("preserves useful source frontmatter and disables archive search", () => {
  const result = convertSourceDocument(
    "---\nlabel: Ancienne décision\norder: 4\n---\n\n# Décision\n\nHistorique.\n",
    "archive/decision.md",
    "archive",
    new Set(["archive/decision.md"]),
    "/docs",
  );

  assert.match(result.content, /sidebar:\n  order: 4\n  label: Ancienne décision/);
  assert.match(result.content, /searchable: false/);
});

test("maps README files to directory indexes", () => {
  assert.equal(path.basename(destinationFor("README.md")), "overview.mdx");
  assert.match(
    destinationFor("guides/README.md"),
    /src\/content\/docs\/guides\/index\.mdx$/u,
  );
});

test("maps the synthetic root index away from the custom home route", () => {
  assert.equal(path.basename(syntheticIndexDestination("")), "overview.mdx");
  assert.match(
    syntheticIndexDestination("docs/product"),
    /src\/content\/docs\/docs\/product\/index\.mdx$/u,
  );
});

test("links the root README to Nimbus' overview route", () => {
  const result = convertSourceDocument(
    "# Catalogue\n\nLire [l'accueil](README.md).\n",
    "DOCUMENTATION-CATALOG.md",
    "reference",
    new Set(["DOCUMENTATION-CATALOG.md", "README.md"]),
    "",
  );

  assert.match(result.content, /\[l'accueil\]\(\/overview\)/u);
});

test("selects only explicitly allowlisted public collections", () => {
  const inventory = {
    collections: [
      {
        id: "product",
        visibility: "public",
        files: ["docs/product/vision.md", "docs/product/rules.md"],
      },
      {
        id: "project",
        visibility: "internal",
        files: ["PROJECT.md"],
      },
    ],
  };

  const selected = selectPublicCollections(inventory, " product,product ");

  assert.deepEqual(selected.collectionIds, ["product"]);
  assert.deepEqual(
    selected.entries.map(({ collectionId, sourcePath, visibility }) => ({
      collectionId,
      sourcePath,
      visibility,
    })),
    [
      {
        collectionId: "product",
        sourcePath: "docs/product/vision.md",
        visibility: "public",
      },
      {
        collectionId: "product",
        sourcePath: "docs/product/rules.md",
        visibility: "public",
      },
    ],
  );
});

test("refuses unknown and non-public publication collections", () => {
  const inventory = {
    collections: [
      { id: "product", visibility: "public", files: ["docs/product/vision.md"] },
      { id: "project", visibility: "internal", files: ["PROJECT.md"] },
    ],
  };

  assert.throws(
    () => selectPublicCollections(inventory, "missing"),
    /Unknown public Nimbus collection: missing/u,
  );
  assert.throws(
    () => selectPublicCollections(inventory, "project"),
    /visibility is internal, expected public/u,
  );
  assert.throws(
    () => selectPublicCollections(inventory, "  "),
    /must name at least one collection/u,
  );
});

test("uses the complete local corpus only when the publication variable is absent", () => {
  const inventory = {
    collections: [
      { id: "product", visibility: "public", files: ["docs/product/vision.md"] },
    ],
  };

  assert.equal(publicationSelectionFromEnvironment(inventory, {}), null);
  assert.throws(
    () =>
      publicationSelectionFromEnvironment(inventory, {
        NIMBUS_PUBLIC_COLLECTIONS: "   ",
      }),
    /must name at least one collection/u,
  );
});

test("refuses a public document link to an excluded classified source", () => {
  assert.throws(
    () =>
      convertSourceDocument(
        "# Vision\n\nLire [la roadmap](../../ROADMAP.md).\n",
        "docs/product/vision.md",
        "public",
        new Set(["docs/product/vision.md"]),
        "/parkventory/docs",
        new Set(["docs/product/vision.md", "ROADMAP.md"]),
      ),
    /links to excluded source ROADMAP\.md/u,
  );
});
