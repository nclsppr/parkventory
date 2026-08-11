import { mount } from "@cloudflare/nimbus-docs/client";

const copyIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
    <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/>
  </svg>`;
const checkIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
    <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z"/>
  </svg>`;

function codeText(element: HTMLElement): string {
  return element.querySelector("code")?.textContent ?? element.textContent ?? "";
}

export function codeCopy(): void {
  mount("pre.astro-code", (element) => {
    if (element.closest("[data-cg-panels-raw], [data-cg-row]")) return () => {};

    const wrapper = element.closest<HTMLElement>(".nb-code-figure") ?? element;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nb-code-copy";
    button.setAttribute("aria-label", "Copier le code dans le presse-papiers");
    button.innerHTML = copyIcon;
    let resetTimer: number | undefined;

    async function copy(): Promise<void> {
      const content = codeText(element);
      if (!content) return;
      try {
        await navigator.clipboard.writeText(content);
      } catch {
        return;
      }
      button.innerHTML = checkIcon;
      button.dataset.state = "copied";
      button.setAttribute("aria-label", "Code copié");
      if (resetTimer) window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        button.innerHTML = copyIcon;
        delete button.dataset.state;
        button.setAttribute("aria-label", "Copier le code dans le presse-papiers");
      }, 1500);
    }

    button.addEventListener("click", copy);
    wrapper.style.position = "relative";
    wrapper.appendChild(button);

    return () => {
      if (resetTimer) window.clearTimeout(resetTimer);
      button.removeEventListener("click", copy);
      button.remove();
    };
  });
}

let liveRegion: HTMLDivElement | null = null;

function announce(message: string): void {
  if (!liveRegion?.isConnected) {
    liveRegion = document.createElement("div");
    liveRegion.setAttribute("aria-live", "polite");
    Object.assign(liveRegion.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap",
      border: "0",
    });
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = "";
  liveRegion.textContent = message;
}

function mountHeadingAnchors(): void {
  document
    .querySelectorAll<HTMLElement>(".docs-content :is(h2, h3, h4)[id]")
    .forEach((heading) => {
      if (heading.hasAttribute("data-heading-anchor-ready")) return;
      heading.setAttribute("data-heading-anchor-ready", "true");
      const anchor = document.createElement("a");
      anchor.href = `#${heading.id}`;
      anchor.className = "heading-anchor";
      const label = heading.textContent?.trim() || "section";
      anchor.setAttribute("aria-label", `Copier le lien vers la section ${label}`);
      anchor.textContent = "#";
      anchor.addEventListener("click", () => {
        const url = new URL(anchor.getAttribute("href") ?? `#${heading.id}`, location.href).href;
        navigator.clipboard
          ?.writeText(url)
          .then(() => announce("Lien copié dans le presse-papiers"), () => {});
      });
      heading.appendChild(anchor);
    });
}

export function headingAnchors(): void {
  mountHeadingAnchors();
  document.addEventListener("astro:page-load", mountHeadingAnchors);
}
