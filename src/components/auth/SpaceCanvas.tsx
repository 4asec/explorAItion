"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  vx: number;
  vy: number;
  color: string;
}

/**
 * Komponen Kanvas Animasi Luar Angkasa (Fullscreen Space Canvas Background)
 * Menyediakan animasi reveal partikel dan standby ambient stars dengan garis rasi kosmik.
 */
export default function SpaceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const starCount = 110;
    const stars: Star[] = [];
    const colors = [
      "rgba(52, 211, 153, ",  // emerald-400
      "rgba(110, 231, 183, ", // emerald-300
      "rgba(148, 163, 184, ", // slate-400
      "rgba(241, 245, 249, ", // slate-100
      "rgba(45, 212, 191, ",  // teal-400
    ];

    for (let i = 0; i < starCount; i++) {
      const baseAlpha = Math.random() * 0.7 + 0.3;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.6,
        baseAlpha,
        alpha: 0,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let revealProgress = 0;
    let startTime: number | null = null;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const render = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = (time - startTime) / 1000;
      if (revealProgress < 1) {
        revealProgress = Math.min(1, elapsed / 1.5);
      }

      ctx.clearRect(0, 0, width, height);

      // Standby proximity constellation lines
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 95) {
            const lineAlpha = (1 - dist / 95) * 0.14 * revealProgress;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(52, 211, 153, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }

      // Standby movement and twinkle
      for (const star of stars) {
        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        const twinkle = Math.sin(time * star.twinkleSpeed) * 0.35;
        const currentAlpha = Math.max(0.1, Math.min(1, (star.baseAlpha + twinkle) * revealProgress));

        const glowRadius = star.size * 2.8;
        const gradient = ctx.createRadialGradient(
          star.x,
          star.y,
          0,
          star.x,
          star.y,
          glowRadius
        );
        gradient.addColorStop(0, `${star.color}${currentAlpha})`);
        gradient.addColorStop(1, `${star.color}0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `${star.color}${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
