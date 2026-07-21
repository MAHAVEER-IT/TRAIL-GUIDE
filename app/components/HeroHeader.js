"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export default function HeroHeader({ bgImage, name, subtitle }) {
  const headerRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const lastMousePosRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tick = () => {
      const list = particlesRef.current;
      if (list.length === 0) {
        // Clear canvas if it was active but is now empty to avoid leaving residual pixels
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        animationFrameIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Sync resolution if size changed
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Render particle trails
      ctx.globalCompositeOperation = "source-over";
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.size += 0.8;
        p.alpha -= 0.015;

        if (p.alpha <= 0) {
          list.splice(i, 1);
          continue;
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Composite color image onto the canvas trails
      const header = headerRef.current;
      if (header) {
        const img = header.querySelector("img");
        if (img && img.complete) {
          ctx.globalCompositeOperation = "source-in";
          ctx.drawImage(img, 0, 0, width, height);
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    animationFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e) => {
    const header = headerRef.current;
    if (!header) return;

    const rect = header.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lastPos = lastMousePosRef.current || { x, y };
    const dx = x - lastPos.x;
    const dy = y - lastPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      const count = Math.min(Math.floor(dist / 3) + 1, 6);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (dist * 0.15) + 1;
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: dx * 0.05 + Math.cos(angle) * speed * 0.6,
          vy: dy * 0.05 + Math.sin(angle) * speed * 0.6,
          size: Math.random() * 30 + 35,
          alpha: 1.0
        });
      }
    }

    lastMousePosRef.current = { x, y };
  };

  const handleMouseLeave = () => {
    lastMousePosRef.current = null;
  };

  return (
    <header 
      ref={headerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-[60vh] w-full overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        {/* Layer 1: Grayscale Background Image */}
        <Image 
          src={bgImage} 
          alt={name}
          fill
          priority
          sizes="100vw"
          className="object-cover grayscale contrast-[1.15] saturate-[0.60] brightness-[0.40]"
        />
        
        {/* Layer 2: Splash Canvas Reveal Layer */}
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 z-10 pointer-events-none select-none w-full h-full brightness-[0.55] saturate-[1.30]"
        />

        {/* Parallax Overlay blends */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-vignette opacity-70 z-20 pointer-events-none" />
      </div>

      {/* Hero title */}
      <div className="absolute bottom-12 left-6 md:left-24 z-30 max-w-4xl pointer-events-none">
        <span className="font-mono text-xs md:text-sm tracking-[0.25em] text-emerald-400 font-semibold uppercase">
          {subtitle}
        </span>
        <h1 className="font-serif text-4xl md:text-7xl font-black tracking-tight leading-[0.95] text-zinc-100 mt-2 whitespace-pre-line">
          {name.replace(" ", "\n")}
        </h1>
      </div>
    </header>
  );
}
