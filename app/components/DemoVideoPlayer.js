"use client";

import { useState, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize, 
  Volume2, 
  VolumeX, 
  WifiOff, 
  Cpu, 
  Layers, 
  ShieldCheck,
  Video
} from "lucide-react";

export default function DemoVideoPlayer({ 
  src = "/videos/offline_tracking_demo.mp4",
  title = "SECE Campus Offline PDR Field Trial",
  sectorName = "Sri Eshwar College of Engineering"
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      setHasStarted(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (videoRef.current.webkitRequestFullscreen) {
      videoRef.current.webkitRequestFullscreen();
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 rounded-2xl bg-gradient-to-b from-zinc-950/80 to-[#070b14]/90 border border-zinc-800/80 p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
            <Video className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="font-mono text-xs md:text-sm font-bold text-white tracking-wider flex items-center gap-2">
              LIVE FIELD TRIAL WALKTHROUGH
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </h4>
            <p className="font-mono text-[9px] text-zinc-400 mt-0.5">
              AIRPLANE MODE ACTIVE • ZERO CELLULAR OR GPS ASSIST REQUIRED
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-emerald-400 font-bold flex items-center gap-1.5">
            <WifiOff className="w-3 h-3 text-emerald-400" />
            100% OFFLINE
          </span>
          <span className="font-mono text-[9px] px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold">
            1080P HD
          </span>
        </div>
      </div>

      {/* Video Content Grid: Phone Chassis + Companion Telemetry Points */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column (Chassis Frame) */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative w-full max-w-[280px] sm:max-w-[300px] rounded-[38px] p-2.5 bg-zinc-900/90 border-[4px] border-zinc-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(16,185,129,0.12)]">
            
            {/* Phone Top Dynamic Island Pill */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-end px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900/80 border border-zinc-700"></div>
            </div>

            {/* Video Container */}
            <div className="relative aspect-[9/19.5] w-full rounded-[30px] overflow-hidden bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-cover rounded-[30px] cursor-pointer"
                playsInline
                preload="metadata"
                controls={hasStarted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
              />

              {/* Play Overlay if video has not started or is paused */}
              {!isPlaying && (
                <div 
                  onClick={togglePlay}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 cursor-pointer group transition-all z-20"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500/90 text-zinc-950 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)] group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-white tracking-wider bg-black/60 px-3 py-1 rounded-full border border-white/20">
                    CLICK TO PLAY DEMO
                  </span>
                </div>
              )}
            </div>

            {/* Quick Action Button Bar Beneath Phone */}
            <div className="flex items-center justify-between mt-3 px-2 font-mono text-[9px] text-zinc-400">
              <button
                onClick={togglePlay}
                className="hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "PAUSE" : "PLAY"}</span>
              </button>

              <button
                onClick={handleRestart}
                className="hover:text-sky-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="Restart playback"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY</span>
              </button>

              <button
                onClick={toggleMute}
                className="hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleFullscreen}
                className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                title="Fullscreen"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Technical Telemetry & Field Proof Points */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              EXPERIMENTAL VERIFICATION • {sectorName}
            </span>
          </div>

          <h3 className="font-sans text-lg md:text-xl font-bold text-white leading-snug">
            Autonomous Kinematic Navigation Under Severe Signal Blackout
          </h3>

          <p className="font-sans text-xs md:text-sm text-zinc-300 leading-relaxed font-light">
            This live screen recording demonstrates TrailGuide running inside the Sri Eshwar College of Engineering campus with cellular data, Wi-Fi, and external network connectivity completely severed.
          </p>

          {/* Proof Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            
            {/* Proof 1: SF-PDR */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] font-bold">
                <Cpu className="w-3.5 h-3.5" />
                <span>SF-PDR SENSOR FUSION</span>
              </div>
              <p className="font-sans text-[11px] text-zinc-400 leading-normal">
                Continuous strapdown accelerometer and gyroscope integration using the adaptive Weinberg stride model without GPS drift.
              </p>
            </div>

            {/* Proof 2: Offline Vector Cache */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-sky-400 font-mono text-[10px] font-bold">
                <Layers className="w-3.5 h-3.5" />
                <span>OFFLINE VECTOR TILES</span>
              </div>
              <p className="font-sans text-[11px] text-zinc-400 leading-normal">
                Zero network requests. High-precision vector layers render directly from local SQLite database storage at 60 FPS.
              </p>
            </div>

            {/* Proof 3: Landmark Waypoints */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>WAYPOINT SNAP ENGINE</span>
              </div>
              <p className="font-sans text-[11px] text-zinc-400 leading-normal">
                Automatic alignment to 10 mapped campus landmarks (Entrance Gate, OAT, Lab Complex, Hostels) with heading stabilization.
              </p>
            </div>

            {/* Proof 4: Air-Gapped Battery */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-rose-400 font-mono text-[10px] font-bold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>AIR-GAPPED BATTERY SAVING</span>
              </div>
              <p className="font-sans text-[11px] text-zinc-400 leading-normal">
                Low energy profile (&lt;4.2% battery drain per hour) by eliminating high-drain 4G/5G cellular and GPS continuous polling.
              </p>
            </div>

          </div>

          {/* Footer note */}
          <div className="font-mono text-[9px] text-zinc-500 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span>VERIFIED ON HARDWARE: GOOGLE PIXEL & IPHONE 15</span>
            <span className="text-emerald-400 font-bold">GROUND TRUTH PROVEN</span>
          </div>
        </div>

      </div>
    </div>
  );
}
