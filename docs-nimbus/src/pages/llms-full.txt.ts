// Full-corpus markdown for AI agents — every published page in one
// document. This local collation keeps Nimbus' indexed corpus while making
// every framework-derived URL aware of the GitHub Pages base path.
import {
  getIndexedEntries,
  getVersions,
  renderEntryAsMarkdown,
} from "@cloudflare/nimbus-docs";
import { config } from "virtual:nimbus/config";
import { absoluteSiteUrl } from "../lib/routing.mjs";

export const prerender = true;

export async function GET() {
  const versions = await getVersions();
  const nonCurrentVersionCollections = new Set(
    (versions?.others ?? []).map((version) => `docs-${version}`),
  );
  const indexed = (await getIndexedEntries()).filter(
    (item) =>
      item.collection === "docs" ||
      !nonCurrentVersionCollections.has(item.collection),
  );
  const lines = [`# ${config.title}`, ""];
  if (config.description) lines.push(`> ${config.description}`, "");
  lines.push(
    `Index : ${absoluteSiteUrl(
      "/llms.txt",
      config.site,
      import.meta.env.BASE_URL,
    )}`,
    "",
  );

  for (const item of [...indexed].sort((left, right) =>
    left.url.localeCompare(right.url)
  )) {
    lines.push(`# ${item.title}`, "");
    if (item.description) lines.push(`> ${item.description}`, "");
    lines.push(
      `Page : ${absoluteSiteUrl(item.url, config.site, import.meta.env.BASE_URL)} ` +
        `· Markdown : ${absoluteSiteUrl(
          item.markdownUrl,
          config.site,
          import.meta.env.BASE_URL,
        )}`,
      "",
      renderEntryAsMarkdown(item.entry),
      "",
    );
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
