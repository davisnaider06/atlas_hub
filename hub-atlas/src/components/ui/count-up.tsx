"use client";

import { useEffect, useRef, useState } from "react";

/** Desaceleração no fim: rápido no começo, suave ao chegar no valor. */
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Número que conta de 0 até `value` na entrada.
 *
 * Respeita `prefers-reduced-motion`: quem pediu menos movimento no sistema vê o
 * valor final direto, sem animação.
 */
export function CountUp({
  value,
  duration = 1100,
  decimals = 0,
  suffix = "",
  delay = 0,
  className,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  delay?: number;
  className?: string;
}) {
  // Inicializa já no destino quando não há o que animar. O valor é calculado no
  // primeiro render (e não dentro do efeito) pra não provocar um render extra.
  const [atual, setAtual] = useState(() => {
    if (typeof window === "undefined") return value; // SSR: entrega o número final
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return semMovimento || value === 0 ? value : 0;
  });
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const semMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (semMovimento || value === 0) return;

    let inicio: number | null = null;
    const comecarEm = performance.now() + delay;

    function passo(agora: number) {
      if (agora < comecarEm) {
        frameRef.current = requestAnimationFrame(passo);
        return;
      }
      if (inicio === null) inicio = agora;

      const progresso = Math.min((agora - inicio) / duration, 1);
      setAtual(value * easeOutCubic(progresso));

      if (progresso < 1) frameRef.current = requestAnimationFrame(passo);
    }

    frameRef.current = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration, delay]);

  return (
    <span className={className}>
      {atual.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
