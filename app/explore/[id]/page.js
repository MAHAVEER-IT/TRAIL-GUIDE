import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Compass, Network, Eye, Smartphone } from "lucide-react";
import InteractiveMap from "../../components/InteractiveMap";
import HeroHeader from "../../components/HeroHeader";

// Sector detail database matrix for pre-rendered pages
const DESTINATIONS = [
  {
    id: "sumatra-jungle",
    name: "Sumatra Jungle Canopy",
    title: "SUMATRA\nJUNGLE CANOPY",
    subtitle: "SECTOR 01 • INDONESIA",
    bgImage: "/assets/bg/bg_1.webp",
    gallery: [
      "/assets/bg/bg_1.webp",
      "/assets/bg/bg_2.webp",
      "/assets/bg/bg_3.webp",
      "/assets/bg/bg_4.webp"
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
  },
  {
    id: "patagonian-peak",
    name: "Patagonia High Alpine Ridge",
    title: "PATAGONIA\nHIGH ALPINE RIDGE",
    subtitle: "SECTOR 02 • CHILE",
    bgImage: "/assets/bg/bg_2.webp",
    gallery: [
      "/assets/bg/bg_2.webp",
      "/assets/bg/bg_3.webp",
      "/assets/bg/bg_5.webp",
      "/assets/bg/bg_6.webp"
    ],
    coords: "46°32'42\"S, 72°24'11\"W",
    lat: -46.545,
    lng: -72.403,
    alt: "1235m",
    fileSize: "2.12 MB",
    difficulty: "Severe Alpine",
    duration: "3 - 5 Days",
    transceivers: "8 Nodes Active",
    frequency: "915 MHz ISM",
    synopsis: "The Patagonian High Alpine Ridge features vertical granite spires, active crevasse fields, and extreme wind chill parameters. Cellular signals are blocked by high vertical terrain walls. TerraSafe off-grid tracking utilizes inertial dead-reckoning filters adjusted for low-temperature sensor biases. It is critical to download localized vector contour indexes before crossing above the snow line."
  },
  {
    id: "okinawa-grotto",
    name: "Okinawa Subterranean Caves",
    title: "OKINAWA\nSUBTERRANEAN CAVES",
    subtitle: "SECTOR 03 • JAPAN",
    bgImage: "/assets/bg/bg_4.webp",
    gallery: [
      "/assets/bg/bg_4.webp",
      "/assets/bg/bg_1.webp",
      "/assets/bg/bg_3.webp",
      "/assets/bg/bg_5.webp"
    ],
    coords: "26°33'10\"N, 127°24'35\"E",
    lat: 26.5527,
    lng: 127.4097,
    alt: "-42m",
    fileSize: "1.25 MB",
    difficulty: "Challenging Caves",
    duration: "1 - 2 Days",
    transceivers: "11 Nodes Active",
    frequency: "433 MHz ISM",
    synopsis: "The Okinawa Subterranean Caves present extreme underground navigation hazards. Because GNSS/satellite navigation cannot penetrate rock layers, mapping data relies on dead-reckoning inertial sensors calibrated for cave walking speeds. Localized peer-to-peer ad-hoc transceivers are placed inside major chambers to flood node packets and verify location indexes."
  },
  {
    id: "malagasy-canopy",
    name: "Madagascar Spiny Forest",
    title: "MADAGASCAR\nSPINY FOREST",
    subtitle: "SECTOR 04 • EAST AFRICA",
    bgImage: "/assets/bg/bg_5.webp",
    gallery: [
      "/assets/bg/bg_5.webp",
      "/assets/bg/bg_6.webp",
      "/assets/bg/bg_2.webp",
      "/assets/bg/bg_1.webp"
    ],
    coords: "18°34'32\"S, 46°25'12\"E",
    lat: -18.5755,
    lng: 46.42,
    alt: "412m",
    fileSize: "0.95 MB",
    difficulty: "Moderate Trek",
    duration: "2 - 4 Days",
    transceivers: "6 Nodes Active",
    frequency: "868 MHz ISM",
    synopsis: "The Madagascar Spiny Forest consists of semi-arid thorny woodlands and limestone needle labyrinths (Tsingy). GPS visibility is functional, but ground traversal is extremely difficult. Mesh node coverage is sparse. Adventurers must deploy direction high-gain antennas to connect to localized beacons along mapped paths."
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

          {/* Static Map Canvas Placeholder */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-emerald-400" />
                TOPOLOGICAL EXPEDITION MAP
              </h3>
              <span className="font-mono text-[9px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/20 border border-emerald-500/20 uppercase">
                Offline Cache Loaded
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

            {/* Geometric Procedural Vector QR Code SVG */}
            <div className="w-36 h-36 bg-white p-3 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.08)] z-10 relative">
              <svg className="w-full h-full text-black" viewBox="0 0 29 29" fill="currentColor" shapeRendering="crispEdges">
                {/* Finder Pattern (Top-Left) */}
                <path d="M0,0 h7 v7 h-7 z M1,1 h5 v5 h-5 z M2,2 h3 v3 h-3 z" />
                {/* Finder Pattern (Top-Right) */}
                <path d="M22,0 h7 v7 h-7 z M23,1 h5 v5 h-5 z M24,2 h3 v3 h-3 z" />
                {/* Finder Pattern (Bottom-Left) */}
                <path d="M0,22 h7 v7 h-7 z M1,23 h5 v5 h-5 z M2,24 h3 v3 h-3 z" />
                {/* Timing Patterns */}
                <path d="M8,6 h13 v1 h-13 z M6,8 v13 h1 v-13 z" />
                {/* Alignment Pattern (Bottom-Right) */}
                <path d="M18,18 h5 v5 h-5 z M19,19 h3 v3 h-3 z" />
                {/* Mock Data Blocks */}
                <path d="M 8 9 h 2 v 2 h -2 z M 12 8 h 1 v 3 h -1 z M 15 9 h 3 v 1 h -3 z M 11 11 h 3 v 1 h -3 z M 18 10 h 2 v 2 h -2 z" />
                <path d="M 9 13 h 4 v 1 h -4 z M 15 13 h 2 v 2 h -2 z M 8 16 h 1 v 3 h -1 z M 11 17 h 3 v 1 h -3 z M 18 15 h 3 v 1 h -3 z" />
                <path d="M 13 20 h 2 v 2 h -2 z M 16 21 h 4 v 1 h -4 z M 10 24 h 3 v 1 h -3 z M 14 25 h 2 v 2 h -2 z M 25 15 h 2 v 2 h -2 z" />
                <path d="M 15 28 h 4 v 1 h -4 z M 20 27 h 3 v 1 h -3 z M 24 25 h 3 v 2 h -3 z" />
              </svg>
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
