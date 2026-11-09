"use client";

import { useEffect, useRef } from "react";

/**
 * Revela o bloco uma única vez ao entrar na viewport (opacity + transform, ~280ms).
 * Sem JS ou com prefers-reduced-motion: o conteúdo permanece visível (o SSR já entrega visível;
 * só escondemos depois da hidratação, e apenas o que está abaixo da dobra).
 */
export function Reveal({
  children,
  className,
  from = "up",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  from?: "up" | "left" | "right";
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // já visível: não pisca

    el.dataset.reveal = "pending";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = "in";
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-from={from} className={className} style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}>
      {children}
    </div>
  );
}
