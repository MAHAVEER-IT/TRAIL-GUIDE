"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Wifi, 
  Terminal, 
  BookOpen, 
  ChevronDown,
  Volume2,
  VolumeX,
  Compass
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const SHOWCASE_DESTINATIONS = [
  {
    id: "sumatra-jungle",
    name: "Sumatra Jungle",
    tag: "01 • CANOPY",
    bg: "/assets/bg/bg_1.webp",
    desc: "DEEP CANOPY MAP"
  },
  {
    id: "patagonian-peak",
    name: "Patagonian Peak",
    tag: "02 • RIDGE",
    bg: "/assets/bg/bg_2.webp",
    desc: "HIGH ALTITUDE VECTOR"
  },
  {
    id: "okinawa-grotto",
    name: "Okinawa Caves",
    tag: "03 • GROTTO",
    bg: "/assets/bg/bg_4.webp",
    desc: "SUBTERRANEAN GRID"
  },
  {
    id: "malagasy-canopy",
    name: "Malagasy Contours",
    tag: "04 • SUNSET",
    bg: "/assets/bg/bg_5.webp",
    desc: "SUNSET CANOPY DATA"
  }
];

// Duplicate bases to prevent gaps on massive monitors
const row1Cards = [...SHOWCASE_DESTINATIONS, ...SHOWCASE_DESTINATIONS];
const row2Cards = [
  SHOWCASE_DESTINATIONS[2],
  SHOWCASE_DESTINATIONS[3],
  SHOWCASE_DESTINATIONS[0],
  SHOWCASE_DESTINATIONS[1],
  SHOWCASE_DESTINATIONS[2],
  SHOWCASE_DESTINATIONS[3],
  SHOWCASE_DESTINATIONS[0],
  SHOWCASE_DESTINATIONS[1]
];

export default function Home() {
  const containerRef = useRef(null);
  const stickyRef = useRef(null);
  
  // Real-time telemetry decimal coordinates for smooth scrolling tween
  const telemetryRef = useRef({ alt: 210, lat: 4.5375, lon: 101.4005 });

  // Web Audio API Synthesizer references
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const birdTimeoutRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  // Clean up Web Audio Context and timeouts on component unmount
  useEffect(() => {
    return () => {
      if (birdTimeoutRef.current) {
        clearTimeout(birdTimeoutRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Update clock in the tactical HUD
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
      const clockEl = document.getElementById("hud-clock-text");
      if (clockEl) clockEl.innerText = timeStr;
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Procedural Bird Chirp Synthesizer Node
  const playBirdChirp = (ctx, destination) => {
    const now = ctx.currentTime;
    // Generate a group of 1 to 3 chirps
    const chirpCount = Math.floor(Math.random() * 3) + 1;
    let timeOffset = 0;

    for (let c = 0; c < chirpCount; c++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.connect(gain);
      gain.connect(destination);

      // Randomize bird frequencies slightly for different species (2200Hz to 3800Hz)
      const baseFreq = 2200 + Math.random() * 1600;
      const sweepRange = 800 + Math.random() * 1000;
      const chirpDuration = 0.07 + Math.random() * 0.08; // 70ms to 150ms

      const start = now + timeOffset;
      const end = start + chirpDuration;

      osc.frequency.setValueAtTime(baseFreq, start);
      // Fast exponential pitch sweeps up and down (simulates bird chirping)
      osc.frequency.exponentialRampToValueAtTime(baseFreq + sweepRange, start + chirpDuration * 0.35);
      osc.frequency.exponentialRampToValueAtTime(baseFreq - 400, end);

      // Volume envelope (fade in quickly, exponential fade out)
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.015, start + chirpDuration * 0.15); // soft background bird level
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.start(start);
      osc.stop(end + 0.1);

      // Add delay between chirps in the same group
      timeOffset += chirpDuration + 0.08 + Math.random() * 0.12;
    }
  };

  // Loop trigger for bird chirps
  const triggerBirds = (ctx, targetGain) => {
    playBirdChirp(ctx, targetGain);
    // Schedule next chirp randomly between 4 and 10 seconds
    const delay = 4000 + Math.random() * 6000;
    birdTimeoutRef.current = setTimeout(() => triggerBirds(ctx, targetGain), delay);
  };

  // Initialize Web Audio API local synthesizer nodes
  const initAudio = () => {
    if (audioCtxRef.current) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // Master Gain for smooth volume control
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0, ctx.currentTime); // start muted
    gainNodeRef.current = masterGain;

    // --- 1. Shared White Noise Generator for wind and leaves ---
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // --- 2. Wind Breeze Ambiance (Lowpass 200Hz, modulated by slow LFO) ---
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.setValueAtTime(200, ctx.currentTime);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.025, ctx.currentTime);

    const lfo1 = ctx.createOscillator();
    lfo1.type = "sine";
    lfo1.frequency.setValueAtTime(0.12, ctx.currentTime); // 0.12 Hz slow wind cycle

    const lfo1Gain = ctx.createGain();
    lfo1Gain.gain.setValueAtTime(0.018, ctx.currentTime);

    lfo1.connect(lfo1Gain);
    lfo1Gain.connect(windGain.gain);

    whiteNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);

    // --- 3. Forest Canopy Leaf Rustle (Bandpass 1400Hz, modulated by LFO 2) ---
    const leafFilter = ctx.createBiquadFilter();
    leafFilter.type = "bandpass";
    leafFilter.frequency.setValueAtTime(1400, ctx.currentTime);
    leafFilter.Q.setValueAtTime(1.8, ctx.currentTime); // slightly sharp band for rustle harmonics

    const leafGain = ctx.createGain();
    leafGain.gain.setValueAtTime(0.007, ctx.currentTime);

    const lfo2 = ctx.createOscillator();
    lfo2.type = "sine";
    lfo2.frequency.setValueAtTime(0.28, ctx.currentTime); // 0.28 Hz leaf flutter cycle

    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.setValueAtTime(0.004, ctx.currentTime);

    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(leafGain.gain);

    whiteNoise.connect(leafFilter);
    leafFilter.connect(leafGain);
    leafGain.connect(masterGain);

    // Start audio sources
    whiteNoise.start();
    lfo1.start();
    lfo2.start();
  };

  // Toggle ambient audio playback
  const toggleAudio = () => {
    try {
      if (!audioCtxRef.current) {
        initAudio();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (isMuted) {
        // Anchor the ramp start value to prevent browser silence overrides
        gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, ctx.currentTime);
        // Fade in Master Gain over 1.5s
        gainNodeRef.current.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.5);
        setIsMuted(false);

        // Start scheduling procedural bird chirps in the background
        if (!birdTimeoutRef.current) {
          birdTimeoutRef.current = setTimeout(() => triggerBirds(ctx, gainNodeRef.current), 3000);
        }
      } else {
        // Anchor the ramp start value
        gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, ctx.currentTime);
        // Fade out Master Gain over 1.0s
        gainNodeRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
        setIsMuted(true);

        // Cancel scheduled bird chirps immediately
        if (birdTimeoutRef.current) {
          clearTimeout(birdTimeoutRef.current);
          birdTimeoutRef.current = null;
        }
      }
    } catch (e) {
      console.error("Web Audio initialization failed", e);
    }
  };

  const leavesCanvasRef = useRef(null);

  // Cinematic flying leaves simulation loop (optimized with offscreen GPU texture caching)
  useEffect(() => {
    const canvas = leavesCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let active = true;

    // Resize handler to match viewport bounds
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // Muted earth forest palette matching the slide backgrounds
    const colors = [
      "rgba(52, 211, 153, 0.45)", // Emerald green
      "rgba(16, 185, 129, 0.40)", // Medium forest green
      "rgba(132, 204, 22, 0.35)", // Olive green
      "rgba(245, 158, 11, 0.35)", // Amber orange
      "rgba(202, 138, 4, 0.35)"   // Golden yellow
    ];

    // Pre-draws a leaf onto an offscreen canvas to avoid calling ctx.filter in real-time frame renders
    const createLeafTexture = (size, color, blurLevel) => {
      const offscreen = document.createElement("canvas");
      const padding = blurLevel * 3 + 4;
      offscreen.width = Math.ceil(size + padding * 2);
      offscreen.height = Math.ceil(size + padding * 2);

      const oCtx = offscreen.getContext("2d");
      if (!oCtx) return offscreen;

      if (blurLevel > 0) {
        oCtx.filter = `blur(${blurLevel}px)`;
      }

      const cx = offscreen.width / 2;
      const cy = offscreen.height / 2;

      oCtx.save();
      oCtx.translate(cx, cy);

      // Draw curved organic leaf shape
      oCtx.fillStyle = color;
      oCtx.beginPath();
      oCtx.moveTo(0, -size / 2);
      oCtx.quadraticCurveTo(-size / 2.6, 0, 0, size / 2);
      oCtx.quadraticCurveTo(size / 2.6, 0, 0, -size / 2);
      oCtx.fill();

      // Draw midrib vein
      oCtx.strokeStyle = "rgba(0, 0, 0, 0.12)";
      oCtx.lineWidth = 0.8;
      oCtx.beginPath();
      oCtx.moveTo(0, -size / 2);
      oCtx.lineTo(0, size / 2 + size / 6);
      oCtx.stroke();

      // Minor veins
      oCtx.beginPath();
      oCtx.moveTo(0, -size / 4);
      oCtx.lineTo(-size / 6, -size / 8);
      oCtx.moveTo(0, 0);
      oCtx.lineTo(size / 6, size / 8);
      oCtx.moveTo(0, size / 4);
      oCtx.lineTo(-size / 6, size / 3);
      oCtx.stroke();

      oCtx.restore();
      return offscreen;
    };

    const createLeaf = (xOverride = null) => {
      const w = canvas.width;
      const h = canvas.height;
      const z = 0.5 + Math.random() * 2.0;

      const baseSize = 12 + Math.random() * 14;
      const size = baseSize * (z * 0.7);
      const color = colors[Math.floor(Math.random() * colors.length)];

      let blurLevel = 0;
      if (z < 0.8) {
        blurLevel = 1.2;
      } else if (z > 1.8) {
        blurLevel = 3.5;
      }

      const texture = createLeafTexture(size, color, blurLevel);

      return {
        x: xOverride !== null ? xOverride : w + 50,
        y: Math.random() * h - 50,
        z: z,
        size: size,
        vx: -((0.55 + Math.random() * 0.65) * z), // Slower drift speed
        vy: 0,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.007, // Slower tumble speed
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        rotSpeedX: (Math.random() - 0.5) * 0.012, // Slower 3D roll
        rotSpeedY: (Math.random() - 0.5) * 0.012, // Slower 3D pitch
        waveOffset: Math.random() * 100,
        waveSpeed: 0.01 + Math.random() * 0.01, // Slower flutter waves
        waveAmp: 0.1 + Math.random() * 0.2, // Softer flutter height
        texture: texture
      };
    };

    const leaves = [];
    const maxLeaves = 35;

    // Prefill leaves across width initially to avoid blank canvas on mount
    for (let i = 0; i < maxLeaves; i++) {
      leaves.push(createLeaf(Math.random() * canvas.width));
    }

    const tick = () => {
      if (!active) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Sort by depth before rendering to draw background behind foreground
      const sortedLeaves = [...leaves].sort((a, b) => a.z - b.z);

      sortedLeaves.forEach((leaf) => {
        // Drift right to left
        leaf.x += leaf.vx;

        // Flutter wave equations
        leaf.waveOffset += leaf.waveSpeed;
        leaf.y += Math.sin(leaf.waveOffset) * leaf.waveAmp + 0.15 * leaf.z;

        // 3D rotation steps
        leaf.angle += leaf.angularVelocity;
        leaf.rotX += leaf.rotSpeedX;
        leaf.rotY += leaf.rotSpeedY;

        // Reset once fully off canvas bounds
        if (leaf.x < -50 || leaf.y > h + 50) {
          const idx = leaves.indexOf(leaf);
          if (idx !== -1) {
            leaves[idx] = createLeaf();
          }
          return;
        }

        // Draw cached leaf texture using super fast hardware-accelerated GPU stamp
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.angle);
        ctx.scale(Math.cos(leaf.rotX), Math.sin(leaf.rotY));
        
        if (leaf.texture) {
          ctx.drawImage(
            leaf.texture,
            -leaf.texture.width / 2,
            -leaf.texture.height / 2
          );
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      active = false;
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const dx = x - xc;
    const dy = y - yc;
    // Rotate max 10 degrees, scale up slightly
    const tiltX = (dy / yc) * -10;
    const tiltY = (dx / xc) * 10;
    
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.03, 1.03, 1.03)`;
    
    const bg = card.querySelector(".card-bg");
    if (bg) {
      bg.style.transform = `scale(1.15) translate(${dx * 0.06}px, ${dy * 0.06}px)`;
    }
  };

  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    const bg = card.querySelector(".card-bg");
    if (bg) {
      bg.style.transform = `scale(1) translate(0px, 0px)`;
    }
  };

  // Initialize GSAP ScrollTrigger scrollytelling timeline
  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    let ctx = gsap.context(() => {
      // Main scroll timeline calibrated to exactly 16.0 units to allow slower horizontal showcase gallery scrolling
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6, // Increased scrub damping to 0.6 for premium inertia-driven smooth speed control
        }
      });

      // Configure starting values at time 0 to prevent immediateRender conflicts and pointer overlaps
      tl.set(".slide-1", { pointerEvents: "auto" }, 0)
        .set(".bg-image-2", { opacity: 0 }, 0)
        .set(".bg-image-3", { opacity: 0 }, 0)
        .set(".bg-image-4", { opacity: 0 }, 0)
        .set(".bg-image-5", { opacity: 0 }, 0)
        .set(".bg-image-6", { opacity: 0 }, 0)
        .set(".slide-2", { opacity: 0, y: 50, pointerEvents: "none" }, 0)
        .set(".slide-3", { opacity: 0, y: 50, pointerEvents: "none" }, 0)
        .set(".showcase-card", { opacity: 0, y: 40, rotationY: 15 }, 0) // 3D offset initial state
        .set(".slide-4", { opacity: 0, y: 50, pointerEvents: "none" }, 0)
        .set(".phone-slide-up-1", { y: 220, opacity: 0 }, 0) // iPhone 1 hidden below
        .set(".slide-5", { opacity: 0, y: 50, pointerEvents: "none" }, 0)
        .set(".phone-slide-up-2", { y: 220, opacity: 0 }, 0) // iPhone 2 hidden below
        .set(".slide-6", { opacity: 0, scale: 1.05, pointerEvents: "none" }, 0);

      // Continuous Telemetry Number Roller across the entire 18.0 units scroll path
      tl.to(telemetryRef.current, {
        alt: 480,
        lat: 4.5856,
        lon: 101.4278,
        ease: "none", // Linear relationship with absolute scroll offset
        duration: 18.0,
        onUpdate: () => {
          const altEl = document.getElementById("hud-alt-text");
          if (altEl) {
            altEl.innerText = `${Math.round(telemetryRef.current.alt)}m`;
          }

          const coordsEl = document.getElementById("hud-coords-text");
          if (coordsEl) {
            const lat = telemetryRef.current.lat;
            const lon = telemetryRef.current.lon;

            // Latitude Decimal to Degrees-Minutes-Seconds (DMS) format
            const latDeg = Math.floor(lat);
            const latMin = Math.floor((lat - latDeg) * 60);
            const latSec = Math.round((((lat - latDeg) * 60) - latMin) * 60);
            const latStr = `${latDeg.toString().padStart(2, "0")}°${latMin.toString().padStart(2, "0")}'${latSec.toString().padStart(2, "0")}"N`;

            // Longitude Decimal to Degrees-Minutes-Seconds (DMS) format
            const lonDeg = Math.floor(lon);
            const lonMin = Math.floor((lon - lonDeg) * 60);
            const lonSec = Math.round((((lon - lonDeg) * 60) - lonMin) * 60);
            const lonStr = `${lonDeg.toString().padStart(3, "0")}°${lonMin.toString().padStart(2, "0")}'${lonSec.toString().padStart(2, "0")}"E`;

            coordsEl.innerText = `${latStr}, ${lonStr}`;
          }
        }
      }, 0);

      // Phase 1 -> 2 (Units: 1.0 -> 2.2)
      // Slide 1 exits (clicks disabled), bg_2 enters, Slide 2 enters, settles and enables clicks
      tl.to(".slide-1", { opacity: 0, y: -40, scale: 0.96, pointerEvents: "none", ease: "power2.inOut", duration: 1.2 }, 1.0)
        .to(".bg-image-2", { opacity: 1, ease: "power2.inOut", duration: 1.2 }, 1.0)
        .to(".slide-2", { opacity: 1, y: 0, pointerEvents: "auto", ease: "power2.out", duration: 1.2 }, 1.8);

      // Phase 2 -> 3 (Units: 3.0 -> 4.2)
      // Slide 2 exits (clicks disabled), bg_3 enters, Slide 3 enters, settles and enables clicks
      tl.to(".slide-2", { opacity: 0, y: -40, pointerEvents: "none", ease: "power2.in", duration: 1.2 }, 3.0)
        .to(".bg-image-3", { opacity: 1, ease: "power2.inOut", duration: 1.2 }, 3.0)
        .to(".slide-3", { opacity: 1, y: 0, pointerEvents: "auto", ease: "power2.out", duration: 1.2 }, 3.8)
        .to(".showcase-card", { opacity: 1, y: 0, rotationY: 0, stagger: 0.12, ease: "power2.out", duration: 1.0 }, 4.0);

      // Phase 3 -> 4 (Units: 8.2 -> 9.4)
      // Slide 3 exits, bg_4 enters, Slide 4 text enters (phone remains hidden at y: 220)
      tl.to(".slide-3", { opacity: 0, y: -40, pointerEvents: "none", ease: "power2.in", duration: 1.2 }, 8.2)
        .to(".bg-image-4", { opacity: 1, ease: "power2.inOut", duration: 1.2 }, 8.2)
        .to(".slide-4", { opacity: 1, y: 0, pointerEvents: "auto", ease: "power2.out", duration: 1.2 }, 9.0);

      // Phase 4: Slide 4 phone slides up (Starts at 10.4, finishes at 11.6)
      tl.to(".phone-slide-up-1", { y: 0, opacity: 1, ease: "power1.out", duration: 1.2, force3D: true }, 10.4);

      // Phase 4 -> 5 (Units: 12.0 -> 13.2)
      // Slide 4 exits, bg_5 enters, sunset overlay enters, Slide 5 text enters (phone remains hidden at y: 220)
      tl.to(".slide-4", { opacity: 0, y: -40, pointerEvents: "none", ease: "power2.in", duration: 1.2 }, 12.0)
        .to(".bg-image-5", { opacity: 1, ease: "power2.inOut", duration: 1.2 }, 12.0)
        .to(".sunset-overlay", { opacity: 0.55, ease: "power2.inOut", duration: 1.2 }, 12.0)
        .to(".slide-5", { opacity: 1, y: 0, pointerEvents: "auto", ease: "power2.out", duration: 1.2 }, 12.8);

      // Phase 5: Slide 5 phone slides up (Starts at 14.2, finishes at 15.4)
      tl.to(".phone-slide-up-2", { y: 0, opacity: 1, ease: "power1.out", duration: 1.2, force3D: true }, 14.2);

      // Phase 5 -> 6 (Units: 15.8 -> 17.0)
      // Slide 5 exits, bg_6 enters, sunset overlay exits, Slide 6 scales in
      tl.to(".slide-5", { opacity: 0, y: -40, pointerEvents: "none", ease: "power2.in", duration: 1.2 }, 15.8)
        .to(".bg-image-6", { opacity: 1, ease: "power2.inOut", duration: 1.2 }, 15.8)
        .to(".sunset-overlay", { opacity: 0, ease: "power2.inOut", duration: 1.2 }, 15.8)
        .to(".slide-6", { opacity: 1, scale: 1, pointerEvents: "auto", ease: "power2.out", duration: 1.2 }, 16.6);

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-screen h-[600vh] bg-[#050505] text-zinc-100 font-sans" ref={containerRef}>
      {/* Noise overlay texture */}
      <div className="noise-overlay" />

      {/* Cinematic Flying Leaves Canvas */}
      <canvas 
        ref={leavesCanvasRef} 
        id="cinematic-leaves-canvas" 
        className="fixed inset-0 pointer-events-none z-35 w-full h-full will-change-transform transform-gpu" 
      />

      {/* Persistent Tactical HUD Header & Layout Frame */}
      <div className="fixed inset-0 pointer-events-none z-40 flex flex-col justify-between">
        {/* Top Header HUD bar */}
        <div className="w-full flex justify-end items-center p-4 bg-gradient-to-b from-[#050505] via-[#050505]/70 to-transparent pointer-events-auto">
          {/* Ambient Audio Controller Toggle */}
          <button 
            onClick={toggleAudio}
            className="font-mono text-[10px] px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center gap-1.5 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                AUDIO: MUTED
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                AUDIO: PLAYING
              </>
            )}
          </button>
        </div>


        {/* Bottom footer HUD bar */}
        <div className="w-full flex justify-end items-center p-4 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent pointer-events-auto">
          <div className="font-mono text-[10px] text-zinc-500">
            © TERRASAFE SYSTEMS INC.
          </div>
        </div>
      </div>

      {/* Locked Pinned Viewport Container */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden" ref={stickyRef}>
        
        {/* Background stack of WebP layers */}
        <div className="absolute inset-0 bg-[#020202]">
          {/* Image layers cross-fading with hardware acceleration enabled */}
          <div className="bg-image-1 absolute inset-0 bg-cover bg-center will-change-opacity transform-gpu" style={{ backgroundImage: "url('/assets/bg/bg_1.webp')" }} />
          <div className="bg-image-2 absolute inset-0 bg-cover bg-center opacity-0 will-change-opacity transform-gpu" style={{ backgroundImage: "url('/assets/bg/bg_2.webp')" }} />
          <div className="bg-image-3 absolute inset-0 bg-cover bg-center opacity-0 will-change-opacity transform-gpu" style={{ backgroundImage: "url('/assets/bg/bg_3.webp')" }} />
          <div className="bg-image-4 absolute inset-0 bg-cover bg-center opacity-0 will-change-opacity transform-gpu" style={{ backgroundImage: "url('/assets/bg/bg_4.webp')" }} />
          <div className="bg-image-5 absolute inset-0 bg-cover bg-center opacity-0 will-change-opacity transform-gpu" style={{ backgroundImage: "url('/assets/bg/bg_5.webp')" }} />
          <div className="bg-image-6 absolute inset-0 bg-cover bg-center opacity-0 will-change-opacity transform-gpu" style={{ backgroundImage: "url('/assets/bg/bg_6.webp')" }} />
          
          {/* Sunset overlay for color temperature shifts */}
          <div className="sunset-overlay absolute inset-0 bg-gradient-to-t from-orange-950/40 via-amber-900/25 to-transparent mix-blend-color-burn opacity-0 transition-opacity duration-300 will-change-opacity" />
          
          {/* Gradient shadow overlay for high cinematic depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/75" />
          <div className="absolute inset-0 bg-radial-vignette opacity-80 pointer-events-none" />
        </div>

        {/* Content Slides Panel */}
        <div className="relative w-full h-full flex items-center justify-center px-6 md:px-24">
          
          {/* Phase 1: The Call to Adventure */}
          <div className="slide-1 absolute w-full max-w-4xl text-center flex flex-col items-center gap-6 will-change-[opacity,transform] transform-gpu">
            <span className="font-mono text-xs md:text-sm tracking-[0.3em] text-emerald-400 uppercase font-semibold">
              THE CALL TO ADVENTURE
            </span>
            <h1 className="font-serif text-5xl md:text-8xl font-black tracking-tight leading-[1.05] text-zinc-50">
              LEAVE THE <br />
              <span className="italic font-light text-zinc-300 font-serif">Beaten Path</span>
            </h1>
            <div className="w-24 h-[1px] bg-zinc-800 my-2" />
            <p className="font-mono text-xs md:text-sm text-zinc-400 max-w-xl leading-relaxed tracking-wide">
              There is a silent covenant between the wanderer and the wild. A promise that if you step off the paved road, you will discover the world as it was meant to be: raw, silent, and breathing.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 animate-bounce">
              <span className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase">
                SCROLL TO LEAVE THE GRID
              </span>
              <ChevronDown className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          {/* Phase 2: Hidden Paradises (Full screen text layout) */}
          <div className="slide-2 absolute w-full max-w-4xl text-center flex flex-col items-center gap-6 opacity-0 pointer-events-none will-change-[opacity,transform] transform-gpu">
            <span className="font-mono text-xs md:text-sm tracking-[0.3em] text-emerald-400 uppercase font-semibold">
              MAPPED SECTORS • HIDDEN PARADISES
            </span>
            <h2 className="font-serif text-5xl md:text-8xl font-black tracking-tight leading-[1.05] text-zinc-50">
              EXPLORE THE <br />
              <span className="italic font-light text-emerald-300 font-serif">Untouched World</span>
            </h2>
            <div className="w-24 h-[1px] bg-zinc-800 my-2" />
            <p className="font-mono text-xs md:text-sm text-zinc-400 max-w-xl leading-relaxed tracking-wide">
              Beyond the reach of cellular grids lie the planet's best-kept secrets. From the deep mist-laden volcanic canopies to high-altitude crags. We compile decentralized geospatial vector contours, so you can wander with absolute confidence.
            </p>
            <div className="font-mono text-[10px] text-zinc-500 flex gap-6 mt-4 uppercase">
              <div>SUMATRA: <span className="text-emerald-400">CHARTED</span></div>
              <div>OKINAWA: <span className="text-emerald-400">CHARTED</span></div>
              <div>PATAGONIA: <span className="text-amber-400">SCANNING</span></div>
            </div>
          </div>

          {/* Phase 3: The Showcase Showcase (Horizontal Destination Gallery) */}
          <div className="slide-3 absolute w-full opacity-0 pointer-events-none flex flex-col gap-8 items-center will-change-[opacity,transform] transform-gpu">
            <div className="text-center max-w-xl">
              <span className="font-mono text-xs tracking-[0.2em] text-cyan-400 uppercase font-semibold">
                DESTINATION SHOWCASE
              </span>
              <h2 className="font-serif text-3xl md:text-5xl font-bold text-zinc-100 mt-2">
                The Showcase <span className="italic font-light font-serif text-cyan-300">Gallery</span>
              </h2>
              <p className="font-sans text-xs md:text-sm text-zinc-400 mt-2">
                Scroll to slide the remote paradise cells horizontally across your tactical view-grid.
              </p>
            </div>

            {/* Single-Row Infinite Marquee Gallery */}
            <div className="w-full overflow-hidden py-4 relative flex items-center h-[220px] md:h-[275px] select-none">
              <div className="flex gap-4 will-change-transform animate-marquee-ltr pause-on-hover">
                {row1Cards.map((dest, idx) => (
                  <div 
                    key={`row1-1-${dest.id}-${idx}`}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    className="showcase-card w-[290px] md:w-[360px] h-[200px] md:h-[250px] shrink-0 rounded-2xl bg-zinc-950 border border-zinc-800/80 p-5 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ease-out hover:border-cyan-500/40 cursor-pointer"
                    style={{ transformStyle: "preserve-3d", willChange: "transform" }}
                  >
                    <Link href={`/explore/${dest.id}`} className="absolute inset-0 z-20" />
                    <div 
                      className="card-bg absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-105" 
                      style={{ backgroundImage: `url('${dest.bg}')`, willChange: "transform" }} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                    <div className="z-10 mt-auto transition-transform duration-500 ease-out group-hover:translate-y-[-2px]">
                      <h4 className="font-serif text-sm md:text-base font-bold text-white leading-tight">{dest.name}</h4>
                      <p className="font-mono text-[8px] md:text-[9px] text-zinc-500 group-hover:text-cyan-400 transition-colors duration-300">{dest.desc}</p>
                    </div>
                  </div>
                ))}
                {row1Cards.map((dest, idx) => (
                  <div 
                    key={`row1-2-${dest.id}-${idx}`}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    className="showcase-card w-[290px] md:w-[360px] h-[200px] md:h-[250px] shrink-0 rounded-2xl bg-zinc-950 border border-zinc-800/80 p-5 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ease-out hover:border-cyan-500/40 cursor-pointer"
                    style={{ transformStyle: "preserve-3d", willChange: "transform" }}
                  >
                    <Link href={`/explore/${dest.id}`} className="absolute inset-0 z-20" />
                    <div 
                      className="card-bg absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-105" 
                      style={{ backgroundImage: `url('${dest.bg}')`, willChange: "transform" }} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                    <div className="z-10 mt-auto transition-transform duration-500 ease-out group-hover:translate-y-[-2px]">
                      <h4 className="font-serif text-sm md:text-base font-bold text-white leading-tight">{dest.name}</h4>
                      <p className="font-mono text-[8px] md:text-[9px] text-zinc-500 group-hover:text-cyan-400 transition-colors duration-300">{dest.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action button */}
            <Link 
              href="/explore"
              className="py-3 px-8 border border-cyan-500/50 bg-cyan-950/20 hover:bg-cyan-500 hover:text-black rounded-full font-mono text-xs tracking-widest uppercase font-semibold transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
            >
              Explore Mapped Sectors →
            </Link>
          </div>

          {/* Phase 4: Absolute Independence (Full screen text layout) */}
          <div className="slide-4 offline-slide absolute w-full max-w-4xl text-center flex flex-col items-center gap-6 opacity-0 pointer-events-none will-change-[opacity,transform] transform-gpu">
            <div className="offline-phone" aria-hidden="true">
              <div className="phone-slide-up-1">
                <Image
                  src="/assets/Iphone_bg1.png"
                  alt=""
                  width={853}
                  height={1844}
                  priority
                  sizes="(max-width: 767px) 40vw, (max-width: 1279px) 24vw, 340px"
                  className="h-auto w-full"
                />
              </div>
            </div>
            <span className="font-mono text-xs md:text-sm tracking-[0.3em] text-cyan-400 uppercase font-semibold">
              OFFLINE CAPABILITIES • ABSOLUTE INDEPENDENCE
            </span>
            <h2 className="font-serif text-5xl md:text-8xl font-black tracking-tight leading-[1.05] text-zinc-50">
              LOSE THE SIGNAL, <br />
              <span className="italic font-light text-cyan-300 font-serif">Keep the Map</span>
            </h2>
            <div className="w-24 h-[1px] bg-zinc-800 my-2" />
            <p className="font-mono text-xs md:text-sm text-zinc-400 max-w-xl leading-relaxed tracking-wide">
              No networks. No cloud handshakes. TerraSafe runs entirely on-device, storing complex vector tiles locally and computing real-time step kinematic coordinates on local hardware. Absolute offline autonomy.
            </p>
            <div className="font-mono text-[10px] text-zinc-500 flex gap-4 mt-4 uppercase">
              <div>MAP STORAGE: <span className="text-cyan-400">SUMATRA_CANOPY.TSM (1.84MB)</span></div>
              <div>PDR TRACKING: <span className="text-cyan-400">ACTIVE</span></div>
            </div>
          </div>

          {/* Phase 5: The Invisible Lifeline (Full screen text layout) */}
          <div className="slide-5 offline-slide absolute w-full max-w-4xl text-center flex flex-col items-center gap-6 opacity-0 pointer-events-none will-change-[opacity,transform] transform-gpu">
            {/* Added iPhone mockup */}
            <div className="mesh-phone" aria-hidden="true">
              <div className="phone-slide-up-2">
                <Image
                  src="/assets/Iphone_bg2.png"
                  alt=""
                  width={853}
                  height={1844}
                  priority
                  sizes="(max-width: 767px) 40vw, (max-width: 1279px) 24vw, 340px"
                  className="h-auto w-full"
                />
              </div>
            </div>
            <span className="font-mono text-xs md:text-sm tracking-[0.3em] text-amber-400 uppercase font-semibold">
              AD-HOC MESH • THE INVISIBLE LIFELINE
            </span>
            <h2 className="font-serif text-5xl md:text-8xl font-black tracking-tight leading-[1.05] text-zinc-50">
              THE INVISIBLE <br />
              <span className="italic font-light text-amber-300 font-serif">Emergency SOS Relay</span>
            </h2>
            <div className="w-24 h-[1px] bg-zinc-800 my-2" />
            <p className="font-mono text-xs md:text-sm text-zinc-400 max-w-xl leading-relaxed tracking-wide">
              Reassurance in the wild. If you lose footing or experience an emergency, your phone automatically links to nearby transceivers using peer-to-peer flooding mesh, relaying distress alerts without cellular network access.
            </p>
            <div className="font-mono text-[10px] text-zinc-500 flex gap-6 mt-4 uppercase">
              <div>PEERS: <span className="text-amber-400">9 ACTIVE</span></div>
              <div>INTERVAL: <span className="text-amber-400">120ms</span></div>
              <div>MAX HOPS: <span className="text-amber-400">7</span></div>
            </div>
          </div>

          {/* Phase 6: The Summit Call (Valediction / Download) */}
          <div className="slide-6 absolute w-full max-w-2xl text-center opacity-0 pointer-events-none flex flex-col items-center gap-6 will-change-[opacity,transform] transform-gpu">
            <span className="font-mono text-xs tracking-[0.2em] text-cyan-400 font-semibold uppercase">
              THE SUMMIT CALL
            </span>
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-zinc-100">
              The Wilderness <br />
              <span className="italic font-light text-zinc-300 font-serif">Is Calling</span>
            </h2>
            <div className="w-16 h-[1px] bg-zinc-800 my-2" />
            <p className="font-sans text-xs md:text-sm text-zinc-400 max-w-xl leading-relaxed">
              The summit is not the end; it is a viewpoint of the next horizon. We believe that technology should never bind you to the grid, but rather set you free to leave it. Thank you for exploring with us.
            </p>

            <div className="text-emerald-400 font-serif italic text-lg md:text-xl font-light my-2">
              "Thank You"
            </div>

            {/* Tactical Console Controls - Explore Gateway Link */}
            <div className="mt-4 flex justify-center w-full">
              <Link 
                href="/explore"
                className="group flex items-center justify-center gap-2 border border-emerald-500/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all duration-300 px-8 py-3.5 rounded-full font-mono text-xs tracking-wider uppercase font-semibold cursor-pointer shadow-[0_0_15px_rgba(52,211,153,0.15)] hover:shadow-[0_0_25px_rgba(52,211,153,0.4)]"
              >
                <Compass className="w-4 h-4 text-inherit group-hover:text-black" />
                Begin the Journey →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
