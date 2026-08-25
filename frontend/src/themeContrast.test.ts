import styles from "./styles.css?raw";
import indexHtml from "../index.html?raw";
import { describe, expect, it } from "vitest";

type Rgb = readonly [number, number, number];

function lightTokens() {
  const block = styles.match(/:root\[data-theme="light"\]\s*\{(?<tokens>[^}]+)\}/)?.groups?.tokens;
  if (!block) throw new Error("Bloc de tokens du thème clair introuvable.");

  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map((match) => [match[1], match[2]]),
  );
}

function rgb(hex: string): Rgb {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)) as unknown as Rgb;
}

function luminance(hex: string) {
  const channels = rgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("contrastes du thème clair", () => {
  const tokens = lightTokens();
  const pairs: ReadonlyArray<readonly [string, string, number]> = [
    ["text", "bg", 7],
    ["text", "surface", 7],
    ["muted", "bg", 4.5],
    ["muted-2", "surface-2", 4.5],
    ["green", "surface", 4.5],
    ["cyan", "surface", 4.5],
    ["danger", "danger-deep", 4.5],
    ["on-action", "action-fill", 4.5],
    ["on-action", "action-fill-hover", 4.5],
    ["on-available", "available-fill", 4.5],
    ["border-strong", "surface-2", 3],
  ];

  it.each(pairs)("maintient %s sur %s à au moins %s:1", (foreground, background, minimum) => {
    expect(contrast(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(minimum);
  });

  it("donne au symbole original une plaque claire suffisamment contrastée", () => {
    expect(contrast("#c8f814", tokens.text)).toBeGreaterThanOrEqual(3);
    expect(contrast("#14c9d3", tokens.text)).toBeGreaterThanOrEqual(3);
    expect(styles).toMatch(/:root\[data-theme="light"\] \.brand-mark,[\s\S]*?background: var\(--text\);/);
  });

  it("garde les placeholders et frontières fonctionnelles explicitement lisibles", () => {
    expect(styles).toMatch(/\.field-group input::placeholder[\s\S]*?color: var\(--muted-2\);\s*opacity: 1;/);
    expect(styles).toMatch(/:root\[data-theme="light"\] \.button-primary \{\s*border-color: var\(--green\);/);
    expect(styles).toMatch(/:root\[data-theme="light"\] \.choose-spot-button,[\s\S]*?border-color: var\(--cyan\);/);
  });
});

describe("zone système Safari du header public", () => {
  it("expose un vrai header sticky plein écran à Safari 26", () => {
    const header = styles.match(/\.landing-header\s*\{(?<rules>[^}]+)\}/)?.groups?.rules;

    expect(indexHtml).toContain("viewport-fit=cover");
    expect(styles).toMatch(/html\s*\{[\s\S]*?background: var\(--bg\);/);
    expect(styles).toMatch(/body\s*\{[\s\S]*?background: var\(--bg\);/);
    expect(header).toContain("position: sticky;");
    expect(header).toContain("width: 100%;");
    expect(header).toContain("background-color: var(--bg);");
  });
});
