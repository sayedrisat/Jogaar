import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import wordmarkSvg from "../../assets/Jogaar_Wordmark.svg?raw";
import "./FloatingBrand.css";

gsap.registerPlugin(ScrollTrigger);

function FloatingBrand({ to = "/" }) {
  const brandRef = useRef(null);

  useLayoutEffect(() => {
    const brand = brandRef.current;
    const svg = brand.querySelector("svg");
    const letters = [...svg.querySelectorAll("[data-glyph]")].reverse();
    const j = svg.querySelector(".jogaar-j");
    const icon = svg.querySelector(".jogaar-final-icon");
    const jCenter = 207;
    const media = gsap.matchMedia();

    const iconScale = () => window.innerWidth < 640 ? 0.86 : 0.76;
    const leftEdge = () => Math.max(16, Math.min(window.innerWidth * 0.03, 32));
    // The SVG viewBox starts at 108; the visible J starts near x=120.
    const collapsedLeft = () => leftEdge() - ((120 - 108) / 944) * brand.offsetWidth * iconScale();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: document.documentElement,
          start: 0,
          end: "+=180",
          scrub: 0.55,
          invalidateOnRefresh: true,
        },
      });

      // Travel from centered wordmark to a small icon at the left edge.
      timeline.to(brand, {
        left: collapsedLeft,
        xPercent: 0,
        scale: iconScale,
        opacity: 0.68,
        ease: "none",
        duration: 1,
      }, 0);

      // Each letter moves into the J before the original J resolves to the SVG icon.
      letters.forEach((letter, index) => {
        const box = letter.getBBox();
        timeline.to(letter, {
          x: jCenter - box.x - box.width / 2,
          scale: 0.12,
          autoAlpha: 0,
          transformOrigin: "50% 50%",
          ease: "power2.in",
          duration: 0.52,
        }, index * 0.095);
      });

      timeline.to(j, { autoAlpha: 0, duration: 0.24, ease: "none" }, 0.67);
      timeline.to(icon, { autoAlpha: 1, duration: 0.3, ease: "none" }, 0.67);
      timeline.to(brand, { clipPath: "inset(0 72% 0 0)", duration: 0.18, ease: "none" }, 0.82);
    });

    media.add("(prefers-reduced-motion: reduce)", () => {
      // Keep the two useful states without making letters travel across the screen.
      const update = () => {
        const collapsed = window.scrollY > 40;
        gsap.set(brand, {
          left: collapsed ? collapsedLeft() : "50%",
          xPercent: collapsed ? 0 : -50,
          scale: collapsed ? iconScale() : 1,
          opacity: collapsed ? 0.68 : 1,
          clipPath: collapsed ? "inset(0 72% 0 0)" : "inset(0 0% 0 0)",
        });
        gsap.set(letters, { autoAlpha: collapsed ? 0 : 1 });
        gsap.set(j, { autoAlpha: collapsed ? 0 : 1 });
        gsap.set(icon, { autoAlpha: collapsed ? 1 : 0 });
      };
      update();
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      return () => {
        window.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
      };
    });

    return () => media.revert();
  }, []);

  return (
    <Link aria-label={to === "/" ? "Jogaar home" : "Jogaar dashboard"} className="floating-brand" ref={brandRef} to={to}>
      {/* The local SVG has separate vector paths for each traced letter. */}
      <span aria-hidden="true" className="floating-brand-art" dangerouslySetInnerHTML={{ __html: wordmarkSvg }} />
    </Link>
  );
}

export default FloatingBrand;
