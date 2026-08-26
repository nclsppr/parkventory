import { escapeHtml } from "./security";
import type { OrganizationBranding } from "./types";

export interface MagicLinkEmail {
  subject: string;
  text: string;
  html: string;
}

const MAGIC_LINK_LIFETIME_MINUTES = 15;
const DEFAULT_EMAIL_COLORS = {
  actionFill: "#c8f913",
  onAction: "#080a08",
  availableFill: "#15c9d5",
} as const;
const hexColorPattern = /^#[0-9a-f]{6}$/i;

type MagicLinkEmailColors = Pick<
  OrganizationBranding["colors"],
  "actionFill" | "onAction" | "availableFill"
>;

function relativeLuminance(color: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(color.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)]
    .sort((first, second) => second - first);
  return (lighter + 0.05) / (darker + 0.05);
}

function safeEmailColors(colors?: MagicLinkEmailColors | null): MagicLinkEmailColors {
  if (
    !colors
    || !hexColorPattern.test(colors.actionFill)
    || !hexColorPattern.test(colors.onAction)
    || !hexColorPattern.test(colors.availableFill)
    || contrastRatio(colors.onAction, colors.actionFill) < 4.5
  ) return DEFAULT_EMAIL_COLORS;
  return colors;
}

export function magicLinkEmail(
  link: string,
  brandColors?: MagicLinkEmailColors | null,
): MagicLinkEmail {
  const safeLink = escapeHtml(link);
  const colors = safeEmailColors(brandColors);
  const subject = "Votre accès sécurisé à Parkventory";
  const text = [
    "PARKVENTORY",
    "",
    "Votre accès sécurisé",
    "",
    "Vous avez demandé à ouvrir votre espace Parkventory.",
    `Utilisez ce lien personnel dans les ${MAGIC_LINK_LIFETIME_MINUTES} minutes :`,
    link,
    "",
    "Ce lien est à usage unique. Parkventory ne vous demandera jamais de le transférer.",
    "Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail.",
    "",
    "Parkventory — Le parking partagé entre collègues.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light only">
    <title>${subject}</title>
  </head>
  <body style="margin:0; padding:0; background:#030504; color:#080a08; font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; mso-hide:all;">
      Votre lien personnel Parkventory expire dans ${MAGIC_LINK_LIFETIME_MINUTES} minutes.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background:#030504; border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px; border-collapse:separate;">
            <tr>
              <td style="padding:0 4px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td width="8" bgcolor="${colors.availableFill}" style="width:8px; height:30px; background-color:${colors.availableFill}; font-size:0; line-height:0;">&nbsp;</td>
                    <td style="padding-left:12px; color:#f5f7f2; font-size:20px; font-weight:700; letter-spacing:0.02em;">Parkventory</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#f4f6f1; border:1px solid #252b26; border-radius:18px; overflow:hidden;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; border-collapse:collapse;">
                  <tr>
                    <td bgcolor="${colors.actionFill}" style="height:8px; background-color:${colors.actionFill}; font-size:0; line-height:0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding:40px 40px 18px;">
                      <p style="margin:0 0 18px; color:#425a00; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">Accès sécurisé&nbsp;&nbsp;·&nbsp;&nbsp;${MAGIC_LINK_LIFETIME_MINUTES} minutes</p>
                      <h1 style="margin:0 0 18px; color:#080a08; font-size:32px; line-height:1.16; letter-spacing:-0.02em;">Votre place vous attend.</h1>
                      <p style="margin:0; color:#4a554c; font-size:17px; line-height:1.6;">Vous avez demandé à ouvrir votre espace Parkventory. Utilisez le bouton ci-dessous pour vous connecter — aucun mot de passe n’est nécessaire.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 40px 28px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                        <tr>
                          <td bgcolor="${colors.actionFill}" style="background-color:${colors.actionFill}; border-radius:8px;">
                            <a href="${safeLink}" style="display:inline-block; padding:15px 24px; background-color:${colors.actionFill}; color:${colors.onAction}; font-size:16px; font-weight:700; line-height:1.2; text-decoration:none; border:1px solid ${colors.onAction}; border-radius:8px;">Ouvrir Parkventory&nbsp;→</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 40px 32px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background:#e9eee7; border-collapse:separate; border-left:4px solid ${colors.availableFill}; border-radius:8px;">
                        <tr>
                          <td style="padding:18px 20px;">
                            <p style="margin:0 0 8px; color:#080a08; font-size:14px; font-weight:700; line-height:1.45;">Un lien personnel et à usage unique</p>
                            <p style="margin:0; color:#4a554c; font-size:14px; line-height:1.55;">Il expire après ${MAGIC_LINK_LIFETIME_MINUTES} minutes. Parkventory ne vous demandera jamais de le transférer.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 40px 36px; border-top:1px solid #d4dcd2;">
                      <p style="margin:0 0 10px; color:#4a554c; font-size:13px; line-height:1.55;">Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :</p>
                      <p style="margin:0; color:#075a70; font-size:12px; line-height:1.55; word-break:break-all;">${safeLink}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 4px 0; color:#9da49d; font-size:12px; line-height:1.6;">
                Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail.<br>
                <span style="color:#f5f7f2;">Parkventory</span> · Le parking partagé entre collègues.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
