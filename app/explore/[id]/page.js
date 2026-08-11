import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Compass, Network, Eye, Smartphone } from "lucide-react";
import InteractiveMap from "../../components/InteractiveMap";
import HeroHeader from "../../components/HeroHeader";
import QRCode from "react-qr-code";

// Sector detail database matrix for pre-rendered pages
const DESTINATIONS = [
  {
    id: "sri-eswar-college",
    name: "Sri Eshwar College of Engineering",
    title: "SRI ESHWAR\nCOLLEGE OF ENGINEERING",
    subtitle: "SECTOR 05 • COIMBATORE, INDIA",
    bgImage: "/assets/sece/main_banner.png",
    gallery: [
      "/assets/sece/main_banner.png",
      "/assets/sece/ex2.jpg",
      "/assets/sece/ex3.jpg",
      "/assets/sece/ex4.jpg"
    ],
    coords: "10°49'40.9\"N, 77°03'37.9\"E",
    lat: 10.82804,
    lng: 77.06054,
    alt: "250m",
    fileSize: "14.2 KB",
    difficulty: "Campus Navigation",
    duration: "1 - 2 Hours",
    transceivers: "10 landmarks mapped",
    frequency: "Offline Vector Map",
    synopsis: "Sri Eshwar College of Engineering represents a custom mapped campus network topology containing 10 high-precision landmarks (Entrance, Pillaiyar Temple, Open Air Theatre, Girls/Boys Hostels, Food Court, Drone Tech Lab, and Medical Center). This offline vector map packet allows seamless indoor and outdoor navigation with zero cellular network or Wi-Fi coverage required."
  },
  {
    id: "sumatra-jungle",
    name: "Sumatra Jungle Canopy",
    title: "SUMATRA\nDEEP FOREST CANOPY",
    subtitle: "SECTOR 01 • INDONESIA",
    bgImage: "/assets/bg/bg_1.webp",
    gallery: [
      "/assets/bg/bg_1.webp",
      "/assets/bg/bg_2.webp",
      "/assets/bg/bg_4.webp",
      "/assets/bg/bg_5.webp"
    ],
    coords: "04°32'15\"N, 101°24'02\"E",
    lat: 4.5375,
    lng: 101.4006,
    alt: "210m",
    fileSize: "1.84 MB",
    difficulty: "Extreme Adventure",
    duration: "4 - 6 Days",
    transceivers: "14 Nodes Active",
    frequency: "868 MHz ISM",
    synopsis: "The Sumatra Jungle Canopy represents one of the most dense, infrastructure-less sectors currently mapped. Spanning over 400 square kilometers of equatorial rainforest, navigation here is heavily restricted by dense cloud cover and multi-layered canopy foliage. The area has been mapped using high-pulse aerial lidar to generate accurate digital elevation contours underneath the jungle canopy. Adventurers must maintain ad-hoc mesh connectivity with localized transceivers deployed along major river contours to verify coordinates in real-time."
  }
];

// Statically pre-render all 4 dynamic destination detail routes
export async function generateStaticParams() {
  return DESTINATIONS.map((dest) => ({
    id: dest.id,
  }));
}

export default async function DestinationDetail({ params }) {
  const { id } = await params;
  const dest = DESTINATIONS.find((d) => d.id === id) || DESTINATIONS[0];

  return (
    <div className="min-h-screen w-full bg-[#050505] text-zinc-100 font-sans pb-24 relative">
      {/* Noise overlay texture */}
      <div className="noise-overlay" />

      {/* Floating Sticky Breadcrumb Links */}
      <nav className="fixed top-6 left-6 z-40">
        <Link 
          href="/explore"
          className="font-mono text-[10px] px-4 py-2 rounded-full bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center gap-1.5 backdrop-blur-md cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sector Catalog
        </Link>
      </nav>

      {/* Hero Splice Header (60vh) */}
      <HeroHeader bgImage={dest.bgImage} name={dest.name} subtitle={dest.subtitle} />

      {/* Split-Grid Configuration Dashboard */}
      <main className="max-w-7xl mx-auto px-6 md:px-24 mt-16 grid grid-cols-1 lg:grid-cols-10 gap-12">
        
        {/* Left Column: Contextual Navigation & Narrative (60% Width) */}
        <section className="lg:col-span-6 flex flex-col gap-12">
          
          {/* Journey Synopsis */}
          <div className="flex flex-col gap-4">
            <h3 className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              SECTOR BRIEFING
            </h3>
            <p className="font-sans text-sm md:text-base text-zinc-300 leading-relaxed font-light">
              {dest.synopsis}
            </p>
          </div>

          {/* Sector Imagery Log (Hierarchical Grid) */}
          <div className="flex flex-col gap-4">
            <h3 className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              MULTI-ANGLE IMAGERY LOGS
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[400px] w-full">
              {/* Hero Image Block */}
              <div className="md:col-span-2 relative overflow-hidden rounded border border-zinc-800/80 bg-zinc-950 group h-full">
                <Image 
                  src={dest.gallery[0]}
                  alt={`${dest.name} Hero Perspective`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover brightness-[0.70] group-hover:scale-105 group-hover:brightness-[0.95] transition-all duration-500"
                />
              </div>

              {/* Stack for Right Column (1 wide, 2 small) */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4 h-full">
                {/* Top Wide Image */}
                <div className="col-span-2 relative overflow-hidden rounded border border-zinc-800/80 bg-zinc-950 group h-[192px]">
                  <Image 
                    src={dest.gallery[1]}
                    alt={`${dest.name} Angle 2`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover brightness-[0.70] group-hover:scale-105 group-hover:brightness-[0.95] transition-all duration-500"
                  />
                </div>

                {/* Bottom Left Small Image */}
                <div className="relative overflow-hidden rounded border border-zinc-800/80 bg-zinc-950 group h-[192px]">
                  <Image 
                    src={dest.gallery[2]}
                    alt={`${dest.name} Angle 3`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover brightness-[0.70] group-hover:scale-105 group-hover:brightness-[0.95] transition-all duration-500"
                  />
                </div>

                {/* Bottom Right Small Image */}
                <div className="relative overflow-hidden rounded border border-zinc-800/80 bg-zinc-950 group h-[192px]">
                  <Image 
                    src={dest.gallery[3]}
                    alt={`${dest.name} Angle 4`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover brightness-[0.70] group-hover:scale-105 group-hover:brightness-[0.95] transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Map Canvas */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-emerald-400" />
                REAL-TIME ROUTING & TELEMETRY
              </h3>
              <span className="font-mono text-[9px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/20 border border-emerald-500/20 uppercase">
                GPS ROUTE ACTIVE
              </span>
            </div>

            {/* Custom Interactive Leaflet Map */}
            <div className="w-full aspect-video rounded-xl border border-zinc-800/80 bg-[#080808] relative overflow-hidden">
              <InteractiveMap lat={dest.lat} lng={dest.lng} name={dest.name} />
            </div>
          </div>

        </section>

        {/* Right Column: The Offline Synchronizer Panel (40% Width) */}
        <aside className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Frosted Glassmorphic Tactical Card */}
          <div className="sticky top-24 rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-8 flex flex-col items-center justify-center gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
            
            {/* Card Background Place Image Overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-[0.20] pointer-events-none select-none mix-blend-overlay" 
              style={{ backgroundImage: `url('${dest.bgImage}')` }}
            />

            {/* Dynamic Vector QR Code */}
            <div className="w-36 h-36 bg-white p-2.5 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.08)] z-10 relative">
              <QRCode 
                value={`trailguide://map/download?id=${dest.id === "sri-eswar-college" ? "sec_campus_v1" : dest.id}&url=https://trail-guide-pearl.vercel.app/data/${dest.id === "sri-eswar-college" ? "sec-campus" : dest.id}.geojson`} 
                size={120} 
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>

            <div className="flex flex-col gap-2 max-w-[260px] z-10 relative">
              <span className="font-mono text-[9px] tracking-wider text-emerald-400 font-semibold uppercase flex items-center justify-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                GET MOBILE COMPANION APP
              </span>
              <p className="font-sans text-[11px] text-zinc-400 leading-relaxed">
                Scan this QR code to download our mobile travel app and sync the off-grid vector map cache for this sector directly to your device.
              </p>
            </div>

          </div>
        </aside>

      </main>
    </div>
  );
}
