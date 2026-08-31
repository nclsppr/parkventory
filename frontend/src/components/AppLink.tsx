import type { AnchorHTMLAttributes, MouseEvent } from "react";

interface AppLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  onNavigate?: () => void;
}

function focusNavigationTarget(target: HTMLElement | null) {
  if (!target) return;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

function hashIdentifier(hash: string) {
  const value = hash.slice(1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function AppLink({ href, onClick, onNavigate, ...props }: AppLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || props.target === "_blank"
    ) return;

    const target = new URL(href, window.location.href);
    if (target.origin !== window.location.origin) return;

    event.preventDefault();
    window.history.pushState({}, "", target);
    window.dispatchEvent(new PopStateEvent("popstate"));
    onNavigate?.();

    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const hashTarget = target.hash
        ? document.getElementById(hashIdentifier(target.hash))
        : null;
      if (hashTarget) {
        if (typeof hashTarget.scrollIntoView === "function") {
          hashTarget.scrollIntoView({ block: "start" });
        }
        focusNavigationTarget(hashTarget);
        return;
      }

      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      focusNavigationTarget(
        document.querySelector<HTMLElement>("main h1")
        ?? document.querySelector<HTMLElement>("main"),
      );
    }));
  };

  return <a {...props} href={href} onClick={handleClick} />;
}
