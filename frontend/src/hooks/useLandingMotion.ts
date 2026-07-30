import { useEffect, type RefObject } from "react";

export function useLandingMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const canObserve = "IntersectionObserver" in window;
    let observer: IntersectionObserver | undefined;
    let animationCleanup: (() => void) | undefined;
    let cancelled = false;

    if (!reducedMotion && canObserve) {
      root.classList.add("motion-ready");
      const revealElements = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-revealed");
            observer?.unobserve(entry.target);
          });
        },
        { threshold: 0.16, rootMargin: "0px 0px -10% 0px" },
      );
      revealElements.forEach((element) => observer?.observe(element));
    }

    if (!reducedMotion && typeof window.matchMedia === "function") {
      void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
        .then(([gsapModule, scrollTriggerModule]) => {
          if (cancelled) return;
          const { gsap } = gsapModule;
          const { ScrollTrigger } = scrollTriggerModule;
          gsap.registerPlugin(ScrollTrigger);

          const media = gsap.matchMedia();
          const context = gsap.context(() => {
            gsap.to(".landing-progress-bar", {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                start: 0,
                end: "max",
                scrub: 0.2,
              },
            });

            gsap.to(".hero-parking-texture", {
              yPercent: 11,
              opacity: 0.38,
              ease: "none",
              scrollTrigger: {
                trigger: ".hero-section",
                start: "top top",
                end: "bottom top",
                scrub: 0.8,
              },
            });

            gsap.to(".hero-product", {
              yPercent: -4,
              ease: "none",
              scrollTrigger: {
                trigger: ".hero-section",
                start: "top top",
                end: "bottom top",
                scrub: 0.8,
              },
            });

            media.add(
              "(min-width: 1051px) and (prefers-reduced-motion: no-preference)",
              () => {
                ScrollTrigger.create({
                  trigger: ".process-heading .section-index",
                  start: "top 144px",
                  endTrigger: ".process-steps",
                  end: "bottom 34%",
                  pin: ".process-heading .section-index",
                  pinSpacing: false,
                  anticipatePin: 1,
                });

                const steps = gsap.utils.toArray<HTMLElement>(".process-steps > li");
                gsap.fromTo(
                  steps,
                  {
                    y: (index) => 34 + index * 12,
                    scale: (index) => 0.955 + index * 0.012,
                    opacity: 0.58,
                  },
                  {
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    stagger: 0.12,
                    ease: "none",
                    scrollTrigger: {
                      trigger: ".process-steps",
                      start: "top 88%",
                      end: "bottom 58%",
                      scrub: 0.65,
                    },
                  },
                );
              },
            );
          }, root);

          ScrollTrigger.refresh();
          animationCleanup = () => {
            media.revert();
            context.revert();
          };
        })
        .catch(() => {
          if (!cancelled) root.dataset.motionRuntime = "fallback";
        });
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      animationCleanup?.();
      root.classList.remove("motion-ready");
      root.removeAttribute("data-motion-runtime");
    };
  }, [rootRef]);
}
