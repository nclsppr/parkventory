import { config } from "virtual:nimbus/config";
import { absoluteSiteUrl, withBasePath } from "../lib/routing.mjs";

export const prerender = true;

export function GET() {
  const body = [
    "User-agent: *",
    `Allow: ${withBasePath("/", import.meta.env.BASE_URL)}`,
    "",
    `Sitemap: ${absoluteSiteUrl(
      "/sitemap-index.xml",
      config.site,
      import.meta.env.BASE_URL,
    )}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
