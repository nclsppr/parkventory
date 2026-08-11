// Root /llms.txt — sectioned index for AI agents.
import { getIndexedTopLevel } from "@cloudflare/nimbus-docs";
import { config } from "virtual:nimbus/config";
import { absoluteSiteUrl } from "../lib/routing.mjs";

export const prerender = true;

export async function GET() {
  const { leaves, groups } = await getIndexedTopLevel();

  const lines = [
    `# ${config.title}`,
    "",
    config.description ?? "Index de documentation pour les agents d'IA.",
    "",
    `Corpus complet (toutes les pages dans un document) : ${absoluteSiteUrl(
      "/llms-full.txt",
      config.site,
      import.meta.env.BASE_URL,
    )}`,
    "",
    "## Pages",
    "",
  ];

  // Sort leaves + groups alphabetically into a single stable list.
  type Row = { key: string; line: string };
  const rows: Row[] = [];

  for (const leaf of leaves) {
    const description = leaf.description ? ` — ${leaf.description}` : "";
    rows.push({
      key: leaf.url,
      line: `- [${leaf.title}](${absoluteSiteUrl(
        leaf.markdownUrl,
        config.site,
        import.meta.env.BASE_URL,
      )})${description}`,
    });
  }

  for (const group of groups) {
    // Older doc versions have their own /<v>/llms.txt; don't list them here.
    if (group.kind === "version") continue;
    rows.push({
      key: `/${group.slug}`,
      line: `- [${group.label === "docs" ? "Documentation produit" : group.label}](${absoluteSiteUrl(
        `/${group.slug}/llms.txt`,
        config.site,
        import.meta.env.BASE_URL,
      )})`,
    });
  }

  rows.sort((a, b) => a.key.localeCompare(b.key));
  for (const row of rows) lines.push(row.line);

  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
