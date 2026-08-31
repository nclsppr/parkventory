import { describe, expect, it } from "vitest";
import { magicLinkEmail } from "../src/email";
import type { OrganizationBranding } from "../src/types";

const victorBuckColors: OrganizationBranding["colors"] = {
  actionFill: "#003595",
  onAction: "#FFFFFF",
  availableFill: "#01E1FF",
  onAvailable: "#00222A",
  highlight: "#E31C79",
  dark: { actionInk: "#7FAAFF", availableInk: "#01E1FF" },
  light: { actionInk: "#003595", availableInk: "#00616E" },
};

describe("e-mail de connexion Parkventory", () => {
  it.each([
    ["fr", "Votre accès sécurisé à Parkventory", "Votre place vous attend."],
    ["en", "Your secure access to Parkventory", "Your parking space is waiting."],
    ["de", "Ihr sicherer Zugang zu Parkventory", "Ihr Parkplatz wartet auf Sie."],
    ["lb", "Äre sécheren Zougang zu Parkventory", "Är Parkplaz waart op Iech."],
  ] as const)("localise le sujet, le texte et le HTML en %s", (locale, subject, heading) => {
    const link = `https://parkventory.com/${locale}/auth/callback?token=test-token`;
    const email = magicLinkEmail(link, undefined, locale);

    expect(email.subject).toBe(subject);
    expect(email.text).toContain(link);
    expect(email.text).toContain("15");
    expect(email.html).toContain(`<html lang="${locale}">`);
    expect(email.html).toContain(heading);
    expect(email.html).toContain(`href="${link}"`);
  });

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

    expect(email.html).toContain('bgcolor="#003595"');
    expect(email.html).toContain("background-color:#003595");
    expect(email.html).toContain("color:#FFFFFF");
    expect(email.html).toContain('bgcolor="#01E1FF"');
    expect(email.html).toContain("border-left:4px solid #01E1FF");
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
