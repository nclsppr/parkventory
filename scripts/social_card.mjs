import opentype from "opentype.js";
import sharp from "sharp";

const LOGO_PLACEHOLDER = "__PARKVENTORY_LOGO_BASE64__";
const FONT_PLACEHOLDER = "__PARKVENTORY_FONT_BASE64__";
const TEXT_NODE_IDS = ["brand-wordmark", "tagline-line-one", "tagline-line-two"];

function dataUrl(mediaType, bytes) {
  return `data:${mediaType};base64,${bytes.toString("base64")}`;
}

function parseFont(fontBytes) {
  const arrayBuffer = fontBytes.buffer.slice(
    fontBytes.byteOffset,
    fontBytes.byteOffset + fontBytes.byteLength,
  );
  return opentype.parse(arrayBuffer);
}

function attributeValue(attributes, name) {
  const match = attributes.match(new RegExp(`\\b${name}="([^"]+)"`));
  if (!match) throw new Error(`Attribut ${name} absent d'un texte de la carte sociale.`);
  return match[1];
}

function numericAttribute(attributes, name) {
  const value = Number(attributeValue(attributes, name));
  if (!Number.isFinite(value)) {
    throw new Error(`Attribut ${name} invalide dans la carte sociale.`);
  }
  return value;
}

function textPath(font, text, x, y, fontSize, letterSpacing) {
  const path = new opentype.Path();
  const glyphs = Array.from(text, (character) => font.charToGlyph(character));
  const scale = fontSize / font.unitsPerEm;
  let cursor = x;

  for (const [index, glyph] of glyphs.entries()) {
    if (index > 0) {
      cursor += font.getKerningValue(glyphs[index - 1], glyph) * scale;
    }
    path.extend(glyph.getPath(cursor, y, fontSize));
    cursor += (glyph.advanceWidth ?? font.unitsPerEm) * scale;
    if (index < glyphs.length - 1) cursor += letterSpacing;
  }

  return path.toPathData(2);
}

function outlineTextNode(svg, font, id) {
  const pattern = new RegExp(`<text\\s+([^>]*\\bid="${id}"[^>]*)>([\\s\\S]*?)<\\/text>`);
  const match = svg.match(pattern);
  if (!match) throw new Error(`Nœud texte ${id} absent de la carte sociale.`);

  const attributes = match[1];
  const text = match[2].replace(/\s+/gu, " ").trim();
  const x = numericAttribute(attributes, "x");
  const y = numericAttribute(attributes, "y");
  const fontSize = numericAttribute(attributes, "font-size");
  const letterSpacing = numericAttribute(attributes, "letter-spacing");
  const fill = attributeValue(attributes, "fill");
  const pathData = textPath(font, text, x, y, fontSize, letterSpacing);

  return svg.replace(
    pattern,
    `<path id="${id}-outline" fill="${fill}" d="${pathData}"/>`,
  );
}

export function buildRasterSvg({ sourceText, logoBytes, fontBytes }) {
  if (!sourceText.includes(LOGO_PLACEHOLDER) || !sourceText.includes(FONT_PLACEHOLDER)) {
    throw new Error("La source de la carte sociale ne contient plus ses deux placeholders.");
  }

  const font = parseFont(fontBytes);
  let rasterSvg = sourceText
    .replace(LOGO_PLACEHOLDER, dataUrl("image/svg+xml", logoBytes))
    .replace(FONT_PLACEHOLDER, dataUrl("font/ttf", fontBytes));

  for (const id of TEXT_NODE_IDS) rasterSvg = outlineTextNode(rasterSvg, font, id);

  if (/<text(?:\s|>)/u.test(rasterSvg)) {
    throw new Error("Le SVG transmis au rasteriseur contient encore un nœud <text>.");
  }
  return rasterSvg;
}

export async function renderSocialCard(inputs) {
  const rasterSvg = buildRasterSvg(inputs);
  return sharp(Buffer.from(rasterSvg), { density: 72 })
    .resize(1200, 630, { fit: "fill" })
    .png({
      adaptiveFiltering: true,
      compressionLevel: 9,
      palette: false,
    })
    .toBuffer();
}
