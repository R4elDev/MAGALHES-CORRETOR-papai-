"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type Props = {
  color: "blue" | "orange";
  variant?: "house" | "face" | "face-house";
  className?: string;
};

/** The stationary slot maps scroll position to the decoration's progress. */
export function CharacterBand({ color, variant = "house", className = "" }: Props) {
  const slot = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = slot.current;
    const art = artwork.current;
    if (!element || !art) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      const progress = motion.matches
        ? 1
        : Math.min(1, Math.max(0, (viewportHeight * 0.9 - element.getBoundingClientRect().top) / (viewportHeight * 0.5)));

      // Direct styles avoid rendering React or recalculating inherited variables on every scroll pixel.
      art.style.opacity = String(progress);
      art.style.transform = `translateY(${(1 - progress) * 18}px) scale(${0.97 + progress * 0.03})`;
      element.dataset.progress = progress.toFixed(3);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, []);

  return (
    <div ref={slot} aria-hidden="true" data-progress="1" className={`character-slot character-slot--${variant} character-slot--${color} ${className}`}>
      <div ref={artwork} className={`character-band character-band--${color}`}>
        {variant !== "face" && <span className="character-band__pill" />}
        <Image
          src={variant === "house" ? "/magalhaes/corpo/pose-casa-transparente-v1.png" : variant === "face-house" ? "/magalhaes/rosto/03_casa_nos_olhos-transparente-v1.png" : "/magalhaes/rosto/10_joia_aprovacao.png"}
          alt=""
          fill
          quality={90}
          sizes={variant === "house" ? "(min-width: 768px) 320px, 288px" : variant === "face-house" ? "(min-width: 768px) 144px, 112px" : "112px"}
          className="character-band__art"
        />
      </div>
    </div>
  );
}
