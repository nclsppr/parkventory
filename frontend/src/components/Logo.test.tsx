import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo, LogoMark } from "./Logo";

describe("Logo", () => {
  it("utilise le master SVG pour chaque variante", () => {
    const { container } = render(
      <>
        <Logo />
        <Logo compact />
        <LogoMark className="preview-logo" />
      </>,
    );

    const marks = Array.from(container.querySelectorAll("img"));
    expect(marks).toHaveLength(3);

    for (const mark of marks) {
      expect(mark.getAttribute("src")).toBe("/parkventory-logo-transparent.svg");
      expect(mark).toHaveAttribute("alt", "");
      expect(mark).toHaveAttribute("width", "554");
      expect(mark).toHaveAttribute("height", "560");
      expect(mark).toHaveAttribute("draggable", "false");
    }

    expect(screen.getAllByText("Parkventory")).toHaveLength(2);
    expect(screen.getByText("Parkventory", { selector: ".sr-only" })).toBeInTheDocument();
  });
});
