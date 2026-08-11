import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider, ThemeToggle } from "./Theme";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = "";
  document.querySelector('meta[name="theme-color"]')?.remove();
});

function renderToggle() {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  it("conserve le thème sombre comme choix initial", () => {
    renderToggle();

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("button", { name: "Thème sombre" })).toHaveAttribute("aria-pressed", "true");
  });

  it("applique et mémorise le thème clair choisi", async () => {
    const themeColor = document.createElement("meta");
    themeColor.name = "theme-color";
    themeColor.content = "#030504";
    document.head.append(themeColor);
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole("button", { name: "Thème clair" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(window.localStorage.getItem("parkventory:ui-theme:v1")).toBe("light");
    expect(themeColor).toHaveAttribute("content", "#f4f6f1");
  });

  it("restaure la préférence enregistrée", () => {
    window.localStorage.setItem("parkventory:ui-theme:v1", "light");
    renderToggle();

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Thème clair" })).toHaveAttribute("aria-pressed", "true");
  });

  it("ignore une préférence enregistrée non reconnue", () => {
    window.localStorage.setItem("parkventory:ui-theme:v1", "system");
    renderToggle();

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("parkventory:ui-theme:v1")).toBe("dark");
  });
});
