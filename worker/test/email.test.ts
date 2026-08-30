import { describe, expect, it } from "vitest";
import { magicLinkEmail } from "../src/email";
import type { OrganizationBranding } from "../src/types";

const victorBuckColors: OrganizationBranding["colors"] = {
  actionFill: "#0D92D2",
  onAction: "#030504",
  availableFill: "#E31C79",
  onAvailable: "#030504",
  highlight: "#E31C79",
  dark: { actionInk: "#0D92D2", availableInk: "#E31C79" },
  light: { actionInk: "#00537F", availableInk: "#C31465" },
};

describe("e-mail de connexion Parkventory", () => {
  it("fournit un message HTML de marque et une alternative texte complète", () => {
    const link = "https://parkventory.com/auth/callback?token=test-token";
    const email = magicLinkEmail(link);

    expect(email.subject).toBe("Votre accès sécurisé à Parkventory");
    expect(email.text).toContain(link);
    expect(email.text).toContain("15 minutes");
    expect(email.text).toContain("usage unique");
    expect(email.html).toContain("Votre place vous attend.");
    expect(email.html).toContain("Ouvrir Parkventory");
    expect(email.html).toContain(`href="${link}"`);
    expect(email.html).toContain("Si vous n’êtes pas à l’origine");
    expect(email.html).toContain('bgcolor="#c8f913"');
    expect(email.html).toContain('bgcolor="#15c9d5"');
  });

  it("applique les couleurs du domaine au bouton et aux accents", () => {
    const email = magicLinkEmail(
      "https://parkventory.com/auth/callback?token=test-token",
      victorBuckColors,
    );

    expect(email.html).toContain('bgcolor="#0D92D2"');
    expect(email.html).toContain("background-color:#0D92D2");
    expect(email.html).toContain("color:#030504");
    expect(email.html).toContain('bgcolor="#E31C79"');
    expect(email.html).toContain("border-left:4px solid #E31C79");
  });

  it("revient à Parkventory lorsque la palette contient du CSS", () => {
    const email = magicLinkEmail(
      "https://parkventory.com/auth/callback?token=test-token",
      {
        ...victorBuckColors,
        actionFill: '#fff";background:url(https://example.test)',
      },
    );

    expect(email.html).not.toContain("example.test");
    expect(email.html).not.toContain("url(");
    expect(email.html).toContain('bgcolor="#c8f913"');
    expect(email.html).toContain('bgcolor="#15c9d5"');
  });

  it("revient à Parkventory lorsque le bouton manque de contraste", () => {
    const email = magicLinkEmail(
      "https://parkventory.com/auth/callback?token=test-token",
      { ...victorBuckColors, actionFill: "#FFFFFF", onAction: "#FFFFFF" },
    );

    expect(email.html).toContain('bgcolor="#c8f913"');
    expect(email.html).toContain("color:#080a08");
    expect(email.html).toContain('bgcolor="#15c9d5"');
  });

  it("échappe le lien dans le HTML sans altérer la version texte", () => {
    const link = "https://parkventory.test/auth/callback?token=a&next=\"app\"";
    const email = magicLinkEmail(link);

    expect(email.html).toContain("token=a&amp;next=&quot;app&quot;");
    expect(email.html).not.toContain(`href="${link}"`);
    expect(email.text).toContain(link);
  });

  it("ne dépend d’aucune image, police ou ressource de suivi externe", () => {
    const email = magicLinkEmail("https://parkventory.com/auth/callback?token=test-token");

    expect(email.html).not.toMatch(/<img\b/i);
    expect(email.html).not.toMatch(/<script\b/i);
    expect(email.html).not.toMatch(/@import|background-image|url\(/i);
    expect(email.html.match(/https:\/\//g)).toHaveLength(2);
  });
});
