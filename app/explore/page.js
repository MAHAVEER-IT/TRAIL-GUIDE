"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Compass, Activity, MapPin, ShieldAlert, Search, X } from "lucide-react";

// Hardcoded Array of 4 Primary Wilderness Sectors
const DESTINATIONS = [
  {
    id: "sumatra-jungle",
    title: "SUMATRA\nJUNGLE CANOPY",
    subtitle: "SECTOR 01 • INDONESIA",
    description: "Deep equatorial rain canopy mapped with dense lidar. Features heavy fog overlays, ad-hoc mesh routes, and high transceiver node density.",
    bgImage: "/assets/bg/bg_1.webp",
    coords: "04°32'15\"N, 101°24'02\"E",
    alt: "210m"
  },
  {
    id: "patagonian-peak",
    title: "PATAGONIA\nHIGH ALPINE RIDGE",
    subtitle: "SECTOR 02 • CHILE",
    description: "Glacial ice fields and vertical granite towers. Severe weather profiles. Dynamic PDR sensory tracks calibrated for sub-zero operation.",
    bgImage: "/assets/bg/bg_2.webp",
    coords: "46°32'42\"S, 72°24'11\"W",
    alt: "1235m"
  },
  {
    id: "okinawa-grotto",
    title: "OKINAWA\nSUBTERRANEAN CAVES",
    subtitle: "SECTOR 03 • JAPAN",
    description: "Subterranean coral grottos. Dead-reckoning inertial navigation locks. Zero satellite penetration, relying on local transceiver relays.",
    bgImage: "/assets/bg/bg_4.webp",
    coords: "26°33'10\"N, 127°24'35\"E",
    alt: "-42m"
  },
  {
    id: "malagasy-canopy",
    title: "MADAGASCAR\nSPINY FOREST",
    subtitle: "SECTOR 04 • EAST AFRICA",
    description: "Semi-arid thorny woodlands and limestone needle labyrinths. Low-light telemetry active, mesh coverage: sparse.",
    bgImage: "/assets/bg/bg_5.webp",
    coords: "18°34'32\"S, 46°25'12\"E",
    alt: "412m"
  },
  {
    id: "sri-eswar-college",
    title: "SRI ESHWAR\nCOLLEGE OF ENGINEERING",
    subtitle: "SECTOR 05 • COIMBATORE, INDIA",
    description: "Offline vector campus mapped landmarks and walking paths. Zero connectivity routing index.",
    bgImage: "/assets/bg/bg_3.webp",
    coords: "10°49'40.9\"N, 77°03'37.9\"E",
    alt: "250m"
  }
];

export default function ExploreGateway() {
  const [activeId, setActiveId] = useState(DESTINATIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const particlesRef = useRef({});
  const lastMousePosRef = useRef({});
  const animationFrameIdRef = useRef(null);

  // Animation frame loop for fluid splash cursor reveal
  useEffect(() => {
    const tick = () => {
      const activeSectionIds = Object.keys(particlesRef.current);

      activeSectionIds.forEach((sectionId) => {
        const list = particlesRef.current[sectionId] || [];
        if (list.length === 0) return;

        const canvas = document.getElementById(`canvas-${sectionId}`);
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Resize buffer if client bounds changed
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
        }

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Update and render splash particles
        ctx.globalCompositeOperation = "source-over";
        for (let i = list.length - 1; i >= 0; i--) {
          const p = list[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.size += 0.8; // Expand like spreading liquid ripples
          p.alpha -= 0.015; // Slow dissolve

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

        // Composite-in the original color image bytes
        const section = document.getElementById(sectionId);
        if (section) {
          const img = section.querySelector("img");
          if (img && img.complete) {
            ctx.globalCompositeOperation = "source-in";
            ctx.drawImage(img, 0, 0, width, height);
          }
        }
      });

      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    animationFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  // Filter destinations based on search query (checks title, subtitle, and description)
  const filteredDestinations = DESTINATIONS.filter((dest) => {
    const query = searchQuery.toLowerCase();
    return (
      dest.title.toLowerCase().includes(query) ||
      dest.subtitle.toLowerCase().includes(query) ||
      dest.description.toLowerCase().includes(query)
    );
  });

  // Set up intersection observer to detect the active snap viewport
  // Re-runs on searchQuery changes to bind to the updated list of DOM elements
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { threshold: 0.6 } // Trigger when 60% of the section is visible
    );

    const sections = document.querySelectorAll(".destination-section");
    sections.forEach((sec) => observer.observe(sec));

    return () => {
      sections.forEach((sec) => observer.unobserve(sec));
    };
  }, [searchQuery]);

  // Handle cursor spotlight movement (GPU accelerated double-translation style updates)
  const handleMouseMove = (e, sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!particlesRef.current[sectionId]) {
      particlesRef.current[sectionId] = [];
    }

    const lastPos = lastMousePosRef.current[sectionId] || { x, y };
    const dx = x - lastPos.x;
    const dy = y - lastPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      // Spawn fluid splash particles based on sweep speed
      const count = Math.min(Math.floor(dist / 3) + 1, 6);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (dist * 0.15) + 1;
        particlesRef.current[sectionId].push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: dx * 0.05 + Math.cos(angle) * speed * 0.6,
          vy: dy * 0.05 + Math.sin(angle) * speed * 0.6,
          size: Math.random() * 30 + 35,
          alpha: 1.0
        });
      }
    }

    lastMousePosRef.current[sectionId] = { x, y };
  };

  const handleMouseLeave = (sectionId) => {
    delete lastMousePosRef.current[sectionId];
  };

  const activeDest = filteredDestinations.find((d) => d.id === activeId) || filteredDestinations[0] || DESTINATIONS[0];

  return (
    <div className="h-screen w-full overflow-hidden bg-[#050505] text-zinc-100 font-sans relative">
      {/* Noise overlay texture */}
      <div className="noise-overlay" />

      {/* Persistent HUD Header */}
      <header className="fixed top-0 inset-x-0 p-6 z-40 pointer-events-none flex items-center justify-between bg-gradient-to-b from-[#050505] via-[#050505]/50 to-transparent">
        {/* Back to Cockpit Link (Aligned Left) */}
        <Link 
          href="/"
          className="font-mono text-[10px] px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all pointer-events-auto flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Cockpit
        </Link>

        {/* Centered Tactical Search Bar */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto flex items-center">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH SECTOR..."
            className="font-mono text-[9px] md:text-[10px] pl-8 pr-8 py-1.5 rounded-full bg-zinc-950/70 border border-zinc-800 text-zinc-300 focus:border-emerald-500/40 outline-none w-36 md:w-56 tracking-wider transition-all placeholder-zinc-600 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          />
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-600" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer focus:outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Spacer to keep flex balance */}
        <div className="w-[100px] md:w-[150px] invisible" />
      </header>

      {/* Empty State Screen (If search returns 0 sectors) */}
      {filteredDestinations.length === 0 && (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-[#050505] z-30 relative px-6 text-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 animate-pulse" />
          <div className="font-mono text-xs tracking-widest text-rose-400">
            NO SECTOR MATCH: "{searchQuery}"
          </div>
          <p className="font-sans text-xs text-zinc-500 max-w-xs leading-normal">
            The search query did not match any active localized vector caches in the TerraSafe offline registry.
          </p>
          <button 
            onClick={() => setSearchQuery("")}
            className="mt-2 font-mono text-[9px] px-4 py-2 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          >
            Clear Search Registry →
          </button>
        </div>
      )}

      {/* Vertical Snap Scroll Container */}
      <main className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar">
        {filteredDestinations.map((dest, index) => (
          <section 
            id={dest.id} 
            key={dest.id} 
            onMouseMove={(e) => handleMouseMove(e, dest.id)}
            onMouseLeave={() => handleMouseLeave(dest.id)}
            className="relative h-screen w-full snap-start flex items-center px-8 md:px-24 destination-section overflow-hidden group"
          >
            {/* Background Image Container with Grayscale Slate Filters */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none">
              
              {/* Layer 1: Base Grayscale Image */}
              <Image 
                src={dest.bgImage} 
                alt={dest.title}
                fill
                priority={index === 0} // Preload the first screen to eliminate layout shifts or flicker
                sizes="100vw"
                className="object-cover grayscale contrast-[1.15] saturate-[0.70] brightness-[0.45] transition-transform duration-1000 group-hover:scale-[1.02]"
              />

              {/* Layer 2: Splash Canvas Reveal Layer (Client-side interactive watercolor splashes) */}
              <canvas 
                id={`canvas-${dest.id}`}
                className="absolute inset-0 z-10 pointer-events-none select-none w-full h-full brightness-[0.75] saturate-[1.20]"
              />
              
              {/* Layer 3: Vignette overlays for readability */}
              <div className="absolute inset-0 z-20 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
              <div className="absolute inset-0 z-20 bg-gradient-to-r from-neutral-950/80 via-neutral-950/20 to-transparent" />
              <div className="absolute inset-0 z-20 bg-radial-vignette opacity-70" />
            </div>

            {/* Content Layout (Layered at z-30 to stay above colored spotlight image and vignette layers) */}
            <div className="z-30 max-w-2xl flex flex-col items-start gap-4 transform-gpu">
              <span className="font-mono text-xs md:text-sm tracking-[0.25em] text-emerald-400 font-semibold uppercase">
                {dest.subtitle}
              </span>
              
              <h2 className="font-serif text-5xl md:text-8xl font-black tracking-tight leading-[0.95] text-zinc-150 whitespace-pre-line">
                {dest.title}
              </h2>
              
              <div className="w-20 h-[1px] bg-zinc-800 my-1" />
              
              <p className="font-mono text-xs md:text-sm text-zinc-400 max-w-md leading-relaxed">
                {dest.description}
              </p>
              
              {/* Access Detailed Coordinates routing button */}
              <Link 
                href={`/explore/${dest.id}`} 
                className="group flex items-center justify-center gap-2 border border-emerald-500/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all duration-300 px-6 py-3.5 rounded-full font-mono text-xs tracking-wider uppercase font-semibold cursor-pointer shadow-[0_0_15px_rgba(52,211,153,0.15)] hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] mt-4"
              >
                Enter Sector Briefing →
              </Link>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
