import type { AnchorHTMLAttributes, MouseEvent } from "react";

interface AppLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  onNavigate?: () => void;
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

    window.requestAnimationFrame(() => {
      if (target.hash) {
        const targetElement = document.getElementById(target.hash.slice(1));
        if (typeof targetElement?.scrollIntoView === "function") {
          targetElement.scrollIntoView({ block: "start" });
        }
      } else {
        if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      }
    });
  };

  return <a {...props} href={href} onClick={handleClick} />;
}
