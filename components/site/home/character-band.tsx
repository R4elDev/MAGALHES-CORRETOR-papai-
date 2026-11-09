"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  color: "blue" | "orange";
  variant?: "house" | "face";
  className?: string;
};

/** Decorative only: the stable slot observes visibility, never the moving artwork. */
export function CharacterBand({ color, variant = "house", className = "" }: Props) {
  const slot = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = slot.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;

    const observe = () => {
      observer?.disconnect();
      setVisible(true);
      if (motion.matches) return;
      const threshold = 0.15;
      observer = new IntersectionObserver(([entry]) => {
        setVisible(entry.isIntersecting && entry.intersectionRatio >= threshold);
      }, { threshold: [0, threshold] });
      observer.observe(element);
    };

    observe();
    motion.addEventListener("change", observe);
    return () => {
      observer?.disconnect();
      motion.removeEventListener("change", observe);
    };
  }, []);

  return (
    <div ref={slot} aria-hidden="true" className={`character-slot character-slot--${variant} character-slot--${color} ${className}`}>
      <div className={`character-band character-band--${color}`} data-visible={visible}>
        {variant === "house" && <span className="character-band__pill" />}
        <Image
          src={variant === "house" ? "/magalhaes/corpo/pose-casa-transparente-v1.png" : "/magalhaes/rosto/10_joia_aprovacao.png"}
          alt=""
          fill
          quality={90}
          sizes={variant === "house" ? "(min-width: 768px) 320px, 288px" : "112px"}
          className="character-band__art"
        />
      </div>
    </div>
  );
}
