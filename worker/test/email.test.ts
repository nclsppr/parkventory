import { describe, expect, it } from "vitest";
import { magicLinkEmail } from "../src/email";

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
