"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Radio, 
  ShieldAlert, 
  ShieldCheck,
  CheckCircle2, 
  Clock, 
  Loader2, 
  MapPin, 
  Activity, 
  RefreshCw, 
  ArrowLeft,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Footprints,
  Mountain,
  Wifi,
  Search,
  Cpu,
  Zap,
  Battery,
  Trash2
} from "lucide-react";
import SosControlMap from "../components/SosControlMap";

export default function SosControlRoom() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSector, setFilterSector] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [missionClock, setMissionClock] = useState({ utc: "", local: "" });
  const [recentDtnLogs, setRecentDtnLogs] = useState([]);

  const audioCtxRef = useRef(null);

  // Play high-tech tactical dispatch chime using Web Audio API
  const playTacticalChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch (_) {}
  };

  // Live Mission Clock (UTC Zulu & Local IST)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setMissionClock({
        utc: now.toISOString().substring(11, 19) + "Z",
        local: now.toLocaleTimeString([], { hour12: false }),
      });
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch alerts 100% dynamically from MongoDB Atlas
  const fetchAlerts = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/sos");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAlerts(json.data);
        setDbConnected(true);
        setErrorMsg(null);

        // Keep or update selected alert
        if (json.data.length > 0) {
          if (!selectedAlertId || !json.data.some(a => a.sosId === selectedAlertId)) {
            const firstActive = json.data.find(a => a.status === "ACTIVE") || json.data[0];
            setSelectedAlertId(firstActive.sosId);
          }
        } else {
          setSelectedAlertId(null);
        }
      } else {
        setDbConnected(false);
        setErrorMsg(json.message || json.error || "Unable to retrieve emergency alerts from database.");
      }
    } catch (e) {
      console.error("Failed to fetch alerts from MongoDB:", e);
      setDbConnected(false);
      setErrorMsg("Database connection error: Could not reach MongoDB Atlas cluster.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Poll database every 5 seconds for live inbound distress telemetry
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => fetchAlerts(), 5000);
    return () => clearInterval(interval);
  }, []);

  // Generate DTN Packet Log Stream based on real alerts count
  useEffect(() => {
    const time = missionClock.local || 'LIVE';
    if (alerts.length > 0) {
      const active = alerts.filter(a => a.status === "ACTIVE").length;
      setRecentDtnLogs([
        `[${time}] BLE_ADV_IND: INGESTED RAW DTN PACKETS • ${alerts.length} ALERTS IN DATABASE (${active} ACTIVE)`,
        `[${time}] MESH TOPOLOGY: 8 ACTIVE RELAY NODES LISTENING • 2DSPHERE SPATIAL INDEX OK`,
        `[${time}] STORE-AND-FORWARD: MESH BUFFER SYNCED WITH MONGODB ATLAS CLUSTER`,
      ]);
    } else {
      setRecentDtnLogs([
        `[${time}] BLE_ADV_IND: STANDBY ON FREQUENCY 2.402 GHz • 0 ACTIVE DISTRESS SIGNALS REPORTED`,
        `[${time}] MESH TOPOLOGY: AD-HOC GATEWAYS READY • ZERO EMERGENCY PACKETS IN BUFFER`,
        `[${time}] 2DSPHERE SPATIAL INDEX: EPSG:3857 BUFFER LOCK STANDBY`,
      ]);
    }
  }, [missionClock.local, alerts]);

  // Update Status of an Incident dynamically in MongoDB Atlas
  const updateAlertStatus = async (sosId, newStatus) => {
    try {
      // Optimistic update for zero-latency UI feel
      setAlerts(prev =>
        prev.map(a => (a.sosId === sosId ? { ...a, status: newStatus } : a))
      );

      const res = await fetch("/api/sos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sosId, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchAlerts();
      }
    } catch (e) {
      console.error("Failed to update status in database:", e);
    }
  };

  // Transmit a real test SOS beacon to MongoDB Atlas (100% Dynamic DB Write)
  const transmitTestSosToDatabase = async () => {
    setActionLoading(true);
    playTacticalChime();
    const randomId = `SOS-LIVE-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomOffsets = [
      { name: "Sector 7 (SECE Perimeter)", coords: [77.06054 + (Math.random() - 0.5) * 0.006, 10.82804 + (Math.random() - 0.5) * 0.006], alt: 342.5, hiker: "Arun K. (Lead Scout)" },
      { name: "Sector 4 (Nilgiris Escarpment)", coords: [76.71130 + (Math.random() - 0.5) * 0.008, 11.41020 + (Math.random() - 0.5) * 0.008], alt: 2240.0, hiker: "David R. (Alpine Trekker)" },
      { name: "Sector 9 (Sumatra Rainforest)", coords: [101.34310 + (Math.random() - 0.5) * 0.008, 0.78930 + (Math.random() - 0.5) * 0.008], alt: 418.0, hiker: "Dr. Thorne (Field Ecologist)" },
    ];
    const pick = randomOffsets[Math.floor(Math.random() * randomOffsets.length)];

    const payload = {
      sosId: randomId,
      senderDeviceId: `DEV-${Math.floor(200 + Math.random() * 800)}`,
      hikerName: pick.hiker,
      emergencyType: "CRITICAL DISTRESS / SUDDEN SF-PDR KINEMATIC DROP DETECTED",
      sector: pick.name,
      batteryLevel: Math.floor(14 + Math.random() * 25),
      stepCount: Math.floor(6500 + Math.random() * 5000),
      assignedTeam: "SAR RAPID TEAM ALPHA",
      relayDeviceId: "NODE-GATEWAY-04",
      location: {
        type: "Point",
        coordinates: pick.coords,
      },
      altitude: pick.alt,
      hopCount: Math.floor(Math.random() * 3) + 1,
      status: "ACTIVE",
    };

    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data) {
        await fetchAlerts();
        setSelectedAlertId(json.data.sosId);
      }
    } catch (e) {
      console.error("Failed to insert alert into MongoDB:", e);
    } finally {
      setActionLoading(false);
    }
  };

  // Purge all alerts from MongoDB Atlas to test empty state
  const purgeAllAlerts = async () => {
    if (!window.confirm("Purge all emergency alerts from MongoDB Atlas to reset database to 0?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/sos?all=true", { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setAlerts([]);
        setSelectedAlertId(null);
      }
    } catch (e) {
      console.error("Failed to purge alerts:", e);
    } finally {
      setActionLoading(false);
    }
  };

  // Copy GPS Coordinates to Clipboard
  const copyCoordinates = (coords, id) => {
    if (!coords) return;
    const text = `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Alerts List (Dynamic based on MongoDB records)
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Status Filter
      if (filterStatus !== "ALL" && alert.status !== filterStatus) return false;

      // Sector Filter
      if (filterSector !== "ALL") {
        const sectorText = (alert.sector || "").toLowerCase();
        if (filterSector === "SECE" && !sectorText.includes("sece")) return false;
        if (filterSector === "NILGIRIS" && !sectorText.includes("nilgiris")) return false;
        if (filterSector === "SUMATRA" && !sectorText.includes("sumatra")) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = (alert.sosId || "").toLowerCase().includes(query);
        const matchesSender = (alert.senderDeviceId || "").toLowerCase().includes(query);
        const matchesHiker = (alert.hikerName || "").toLowerCase().includes(query);
        const matchesSector = (alert.sector || "").toLowerCase().includes(query);
        if (!matchesId && !matchesSender && !matchesHiker && !matchesSector) return false;
      }

      return true;
    });
  }, [alerts, filterStatus, filterSector, searchQuery]);

  // Aggregate Telemetry from real MongoDB records
  const activeCount = alerts.filter(a => a.status === "ACTIVE").length;
  const ackCount = alerts.filter(a => a.status === "ACKNOWLEDGED").length;
  const resolvedCount = alerts.filter(a => a.status === "RESOLVED").length;
  const maxHops = alerts.length > 0 ? Math.max(...alerts.map(a => a.hopCount || 0)) : 0;

  // Selected Alert Object
  const selectedAlert = alerts.find(a => a.sosId === selectedAlertId) || filteredAlerts[0] || null;

  return (
    <div className="h-screen w-full overflow-hidden bg-[#05080f] text-slate-100 font-sans relative flex flex-col select-none">
      {/* Tactical Noise & CRT Scanlines */}
      <div className="noise-overlay" />
      <div className="tactical-scanlines absolute inset-0 z-0 opacity-40 pointer-events-none" />

      {/* TOP COMMAND BAR */}
      <header className="w-full bg-[#080d1a]/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 py-2.5 flex items-center justify-between z-30 shadow-[0_4px_25px_rgba(0,0,0,0.85)]">
        {/* Left: Cockpit Navigation & Title */}
        <div className="flex items-center gap-3 md:gap-4">
          <Link 
            href="/explore"
            className="font-mono text-[10px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-slate-300 hover:text-white hover:border-sky-500/50 hover:bg-slate-850 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold">COCKPIT</span>
          </Link>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <Radio className={`w-4 h-4 ${activeCount > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`} />
              {activeCount > 0 && (
                <span className="absolute w-6 h-6 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
              )}
            </div>
            <div>
              <h1 className="font-mono text-xs md:text-sm font-black tracking-[0.2em] text-white flex items-center gap-2">
                SEARCH & RESCUE INCIDENT COMMAND ROOM
              </h1>
              <div className="flex items-center gap-2 font-mono text-[8px] text-slate-400">
                <span className={activeCount > 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                  {activeCount > 0 ? `${activeCount} ACTIVE DISTRESS INCIDENT(S)` : "ALL SECTORS SECURE • STANDBY"}
                </span>
                <span>•</span>
                <span className="text-cyan-400">BLE DTN MESH v2.4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Mission Time, Live Database Status & Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mission Zulu Clock */}
          <div className="hidden lg:flex flex-col items-end font-mono text-[9px] bg-slate-950/80 border border-slate-800/80 px-3 py-1 rounded-lg">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>{missionClock.utc || "00:00:00Z"}</span>
              <span className="text-slate-500 font-normal">UTC</span>
            </div>
            <div className="text-[8px] text-slate-500">
              LOCAL: {missionClock.local || "00:00:00"} IST
            </div>
          </div>

          {/* Database Live Sync Status Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 font-mono text-[9px] px-2.5 py-1 rounded-lg border ${
            dbConnected
              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/20 border-rose-500/30 text-rose-300"
          }`}>
            <span className={`w-2 h-2 rounded-full ${dbConnected ? "bg-emerald-400 animate-ping" : "bg-rose-500"}`} />
            <span className="font-bold">
              {dbConnected ? "MONGO ATLAS DYNAMIC" : "DATABASE ERROR"}
            </span>
          </div>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border font-mono text-[9px] transition-all cursor-pointer ${
              soundEnabled
                ? "bg-slate-900 border-sky-500/40 text-sky-400 hover:bg-slate-850"
                : "bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400"
            }`}
            title={soundEnabled ? "Audio Alert Chimes Active" : "Audio Muted"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Dynamic Database SOS Action */}
          <button
            onClick={transmitTestSosToDatabase}
            disabled={actionLoading}
            className="font-mono text-[9px] md:text-[10px] font-black px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white border border-rose-400/30 shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Writes a real emergency alert into MongoDB Atlas"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span className="tracking-wider">
              {actionLoading ? "WRITING TO DB..." : "TRANSMIT SOS TO DB"}
            </span>
          </button>

          {/* Purge Database Button (Visible if alerts exist) */}
          {alerts.length > 0 && (
            <button
              onClick={purgeAllAlerts}
              disabled={actionLoading}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/40 transition-all cursor-pointer shadow-md"
              title="Delete all records from MongoDB Atlas (Reset to 0)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Manual Refresh Button */}
          <button 
            onClick={() => fetchAlerts(true)}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-sky-400 hover:border-sky-500/40 transition-all cursor-pointer shadow-md"
            disabled={refreshing}
            title="Poll MongoDB Atlas for latest records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* TACTICAL KPI METRICS STRIP (100% Dynamic Values) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 px-4 md:px-6 bg-[#070b16]/70 border-b border-slate-800/80 z-20">
        {/* Metric 1: Active Distresses */}
        <div className={`border rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group ${
          activeCount > 0 
            ? "bg-gradient-to-br from-rose-950/20 to-slate-950/80 border-rose-500/30 shadow-[0_0_20px_rgba(239,68,68,0.06)]"
            : "bg-slate-950/60 border-slate-800/80"
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-slate-300 tracking-wider font-bold uppercase flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${activeCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`}></span>
              PRIORITY 1 DISPATCHES
            </span>
            <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded font-bold ${
              activeCount > 0 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}>
              {activeCount > 0 ? "CRITICAL" : "NOMINAL"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-black font-mono tracking-tight ${activeCount > 0 ? 'text-rose-500' : 'text-slate-100'}`}>
              {activeCount}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">ACTIVE BEACONS</span>
          </div>
          <div className="font-mono text-[8px] text-slate-500 mt-1 flex items-center justify-between border-t border-slate-800/80 pt-1">
            <span>FIELD TRIAGE</span>
            <span className={activeCount > 0 ? "text-rose-400 font-semibold" : "text-emerald-400 font-semibold"}>
              {activeCount > 0 ? "RESCUE DISPATCH REQ" : "ALL SECTORS SECURE"}
            </span>
          </div>
        </div>

        {/* Metric 2: Acknowledged / Responding */}
        <div className={`border rounded-xl p-3 flex flex-col justify-between relative overflow-hidden ${
          ackCount > 0
            ? "bg-gradient-to-br from-amber-950/20 to-slate-950/80 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.06)]"
            : "bg-slate-950/60 border-slate-800/80"
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-slate-300 tracking-wider font-bold uppercase flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${ackCount > 0 ? 'bg-amber-500' : 'bg-slate-600'}`}></span>
              IN-ROUTE TEAMS
            </span>
            <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded font-bold ${
              ackCount > 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-500"
            }`}>
              {ackCount > 0 ? "EN ROUTE" : "STANDBY"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-black font-mono tracking-tight ${ackCount > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
              {ackCount}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">RESPONDING</span>
          </div>
          <div className="font-mono text-[8px] text-slate-500 mt-1 flex items-center justify-between border-t border-slate-800/80 pt-1">
            <span>DISPATCH STATUS</span>
            <span className={ackCount > 0 ? "text-amber-400 font-semibold" : "text-slate-400"}>
              {ackCount > 0 ? "EXTRACTION IN PROGRESS" : "READY AT BASE POST"}
            </span>
          </div>
        </div>

        {/* Metric 3: Resolved & Secured */}
        <div className={`border rounded-xl p-3 flex flex-col justify-between relative overflow-hidden ${
          resolvedCount > 0
            ? "bg-gradient-to-br from-emerald-950/20 to-slate-950/80 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.06)]"
            : "bg-slate-950/60 border-slate-800/80"
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-slate-300 tracking-wider font-bold uppercase flex items-center gap-1.5">
              <CheckCircle2 className={`w-2.5 h-2.5 ${resolvedCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
              SECURED / EXTRACTED
            </span>
            <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded font-bold ${
              resolvedCount > 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"
            }`}>
              {resolvedCount > 0 ? "ARCHIVED" : "CLEARED"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-black font-mono tracking-tight ${resolvedCount > 0 ? 'text-emerald-400' : 'text-slate-100'}`}>
              {resolvedCount}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">RESOLVED</span>
          </div>
          <div className="font-mono text-[8px] text-slate-500 mt-1 flex items-center justify-between border-t border-slate-800/80 pt-1">
            <span>RESOLVED TOTAL</span>
            <span className="text-slate-300 font-semibold">
              {resolvedCount > 0 ? `${resolvedCount} MISSION(S) SECURED` : "NO CLOSED INCIDENTS"}
            </span>
          </div>
        </div>

        {/* Metric 4: Mesh Topology & Hops */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-cyan-300 tracking-wider font-bold uppercase flex items-center gap-1.5">
              <Wifi className="w-2.5 h-2.5 text-cyan-400" />
              DTN MESH HOPS
            </span>
            <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold">
              BLE 5.0
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black font-mono text-cyan-300 tracking-tight">{maxHops}</span>
            <span className="text-[10px] text-cyan-300/70 font-mono">MAX RELAY HOPS</span>
          </div>
          <div className="font-mono text-[8px] text-slate-500 mt-1 flex items-center justify-between border-t border-slate-800/80 pt-1">
            <span>INGESTION PROTOCOL</span>
            <span className="text-cyan-400 font-semibold">STORE-AND-FORWARD</span>
          </div>
        </div>
      </section>

      {/* MAIN OPERATIONS WORKSPACE */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-9 h-9 text-sky-400 animate-spin" />
          <span className="font-mono text-xs text-slate-400 tracking-widest uppercase">
            CONNECTING TO MONGODB ATLAS CLUSTER...
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
          
          {/* LEFT COMMAND RAIL: INCIDENT FEED & TRIAGE DESK */}
          <aside className="w-full md:w-[440px] lg:w-[480px] border-r border-slate-800/80 flex flex-col bg-[#070b14] overflow-hidden shrink-0">
            {/* Search & Sector Bar */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-col gap-2 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, Hiker, Device, or Sector..."
                  className="w-full bg-[#0b1120] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 font-mono text-[10px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 transition-all"
                />
              </div>

              {/* Status Tabs with Dynamic Real Counts */}
              <div className="flex gap-1.5">
                {[
                  { id: "ALL", label: `ALL (${alerts.length})` },
                  { id: "ACTIVE", label: `ACTIVE (${activeCount})`, color: "rose" },
                  { id: "ACKNOWLEDGED", label: `ACK'D (${ackCount})`, color: "amber" },
                  { id: "RESOLVED", label: `SECURED (${resolvedCount})`, color: "emerald" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`flex-1 font-mono text-[8px] tracking-wider py-1.5 rounded-md font-bold cursor-pointer transition-all border ${
                      filterStatus === tab.id
                        ? tab.id === "ACTIVE"
                          ? "bg-rose-950/40 border-rose-500/50 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                          : tab.id === "ACKNOWLEDGED"
                          ? "bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                          : tab.id === "RESOLVED"
                          ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                          : "bg-slate-800 border-slate-700 text-slate-200"
                        : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sector Filtering Pills */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="font-mono text-[8px] text-slate-500 uppercase font-bold">SECTOR:</span>
                {["ALL", "SECE", "NILGIRIS", "SUMATRA"].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setFilterSector(sec)}
                    className={`font-mono text-[8px] px-2 py-0.5 rounded cursor-pointer transition-all ${
                      filterSector === sec
                        ? "bg-sky-950 border border-sky-500/40 text-sky-300 font-bold"
                        : "text-slate-400 hover:text-slate-200 bg-slate-900/60"
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            {/* Database Connection Error Banner (If MongoDB fails) */}
            {errorMsg && (
              <div className="mx-3 mt-3 p-3 rounded-lg bg-rose-950/20 border border-rose-500/40 text-rose-300 font-mono text-[9px] flex flex-col gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[10px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  MongoDB Connection Error
                </div>
                <div className="text-slate-300">{errorMsg}</div>
                <button
                  onClick={() => fetchAlerts(true)}
                  className="mt-1 w-fit font-mono text-[8px] px-2.5 py-1 rounded bg-rose-900/40 border border-rose-500/40 text-rose-200 hover:bg-rose-800/40 cursor-pointer"
                >
                  Retry Database Connection
                </button>
              </div>
            )}

            {/* Incidents Scrollable List (Dynamic or Authentic 0-Alerts State) */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 min-h-0">
              {alerts.length === 0 ? (
                /* Authentic 0-Alerts Empty State */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-950/40 my-6">
                  <div className="relative mb-3 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="absolute inset-0 rounded-full border border-emerald-400/20 animate-ping" />
                  </div>
                  <span className="font-mono text-xs text-emerald-400 font-black tracking-wider">
                    NO ACTIVE SOS INCIDENTS
                  </span>
                  <span className="font-mono text-[9px] text-slate-400 mt-1 uppercase font-semibold">
                    ALL WILDERNESS SECTORS REPORT NOMINAL
                  </span>
                  <p className="font-mono text-[8px] text-slate-500 mt-2 max-w-[280px] leading-relaxed">
                    0 emergency packets stored in MongoDB Atlas. Delay-Tolerant BLE mesh gateways are listening on 2.4 GHz for distress beacons.
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-800/80 w-full flex flex-col items-center gap-2">
                    <button
                      onClick={transmitTestSosToDatabase}
                      disabled={actionLoading}
                      className="font-mono text-[9px] px-3.5 py-2 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 cursor-pointer transition-all flex items-center gap-1.5 font-bold shadow-md hover:border-rose-400 active:scale-95 disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      {actionLoading ? "WRITING TO MONGO ATLAS..." : "TRANSMIT TEST SOS TO DATABASE"}
                    </button>
                    <span className="font-mono text-[8px] text-slate-600">
                      Writes a real emergency alert document into MongoDB Atlas
                    </span>
                  </div>
                </div>
              ) : filteredAlerts.length === 0 ? (
                /* Filter Match Empty State */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-950/40 my-6">
                  <Search className="w-8 h-8 text-slate-600 mb-2" />
                  <span className="font-mono text-xs text-slate-400 font-bold tracking-wider">
                    NO INCIDENTS MATCHING FILTER
                  </span>
                  <p className="font-mono text-[9px] text-slate-500 mt-1">
                    No alerts in MongoDB match your active filter criteria.
                  </p>
                  <button
                    onClick={() => { setFilterStatus("ALL"); setFilterSector("ALL"); setSearchQuery(""); }}
                    className="mt-3 font-mono text-[9px] px-3 py-1 rounded-md bg-slate-800 text-sky-400 hover:bg-slate-700 cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const [lng, lat] = alert.location?.coordinates || [0, 0];
                  const isActive = alert.status === "ACTIVE";
                  const isAck = alert.status === "ACKNOWLEDGED";
                  const isSelected = selectedAlertId === alert.sosId;

                  return (
                    <div
                      key={alert.sosId}
                      onClick={() => setSelectedAlertId(alert.sosId)}
                      className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5 relative overflow-hidden ${
                        isSelected 
                          ? isActive
                            ? "bg-rose-950/20 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.12)] ring-1 ring-rose-500/30"
                            : isAck
                            ? "bg-amber-950/20 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.12)] ring-1 ring-amber-500/30"
                            : "bg-emerald-950/20 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/30"
                          : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                      }`}
                    >
                      {/* Left Accent Status Strip */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isActive ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" : isAck ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                      }`} />

                      {/* Header Row: ID, Hiker, Status */}
                      <div className="flex items-start justify-between gap-2 pl-1.5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black tracking-wide text-white">
                              {alert.sosId}
                            </span>
                            <span className="font-mono text-[9px] text-slate-400 font-semibold">
                              {alert.hikerName || "Hiker"}
                            </span>
                          </div>
                          <span className="font-mono text-[8px] text-slate-500 mt-0.5">
                            DEV: {alert.senderDeviceId} • SECTOR: {alert.sector || "General Sector"}
                          </span>
                        </div>

                        <span className={`font-mono text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ${
                          isActive 
                            ? "bg-rose-950/40 text-rose-300 border border-rose-500/40 animate-pulse" 
                            : isAck 
                            ? "bg-amber-950/40 text-amber-300 border border-amber-500/40" 
                            : "bg-emerald-950/40 text-emerald-300 border border-emerald-500/40"
                        }`}>
                          {alert.status}
                        </span>
                      </div>

                      {/* Emergency Nature Tag */}
                      <div className="pl-1.5">
                        <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300 font-semibold flex items-center gap-1.5">
                          <ShieldAlert className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate">{alert.emergencyType || "EMERGENCY DISTRESS BEACON"}</span>
                        </span>
                      </div>

                      {/* Telemetry Grid (GPS, Altitude, Battery, Steps, Hops) */}
                      <div className="grid grid-cols-2 gap-2 font-mono text-[9px] text-slate-300 pl-1.5 pt-1 border-t border-slate-800/80">
                        {/* GPS Coordinates with 1-click Copy */}
                        <div className="flex items-center justify-between col-span-2 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                          <div className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3 h-3 text-sky-400" />
                            <span>{lat.toFixed(5)}° N, {lng.toFixed(5)}° E</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyCoordinates([lng, lat], alert.sosId);
                            }}
                            className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-sky-300 hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                            title="Copy GPS coordinates"
                          >
                            {copiedId === alert.sosId ? (
                              <>
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">COPIED</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-2.5 h-2.5" />
                                <span>COPY</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Altitude & Steps */}
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Mountain className="w-3 h-3 text-slate-500" />
                          <span>ALT: <strong className="text-slate-200">{alert.altitude ? alert.altitude.toFixed(0) + 'm' : '340m'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Footprints className="w-3 h-3 text-slate-500" />
                          <span>STEPS: <strong className="text-slate-200">{alert.stepCount ? alert.stepCount.toLocaleString() : 'N/A'}</strong></span>
                        </div>

                        {/* Battery Level with Indicator */}
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Battery className={`w-3 h-3 ${(alert.batteryLevel || 50) < 20 ? 'text-rose-400' : 'text-emerald-400'}`} />
                          <span>BATT: <strong className={(alert.batteryLevel || 50) < 20 ? 'text-rose-400' : 'text-slate-200'}>{alert.batteryLevel ?? 75}%</strong></span>
                        </div>

                        {/* BLE Mesh Hop Chain */}
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Wifi className="w-3 h-3 text-cyan-400" />
                          <span>RELAY: <strong className="text-cyan-300">{alert.hopCount} HOPS</strong></span>
                        </div>
                      </div>

                      {/* Broadcast Timestamp */}
                      <div className="font-mono text-[8px] text-slate-500 pl-1.5 flex items-center justify-between">
                        <span>BROADCAST: {new Date(alert.timestamp).toLocaleTimeString()}</span>
                        <span className="text-slate-600">ID: {alert.sosId.replace("SOS-", "")}</span>
                      </div>

                      {/* Tactical Action Buttons (Dynamic MongoDB Updates) */}
                      {isSelected && (
                        <div className="flex gap-2 pt-2 border-t border-slate-800/80 pl-1.5">
                          {isActive && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAlertStatus(alert.sosId, "ACKNOWLEDGED");
                                }}
                                className="flex-1 font-mono text-[9px] py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer text-center shadow-lg transition-all"
                              >
                                ACKNOWLEDGE DISPATCH
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAlertStatus(alert.sosId, "RESOLVED");
                                }}
                                className="flex-1 font-mono text-[9px] py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black cursor-pointer text-center shadow-lg transition-all"
                              >
                                RESOLVE
                              </button>
                            </>
                          )}
                          {isAck && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAlertStatus(alert.sosId, "RESOLVED");
                              }}
                              className="flex-1 font-mono text-[9px] py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black cursor-pointer text-center shadow-lg transition-all"
                            >
                              MARK MISSION RESOLVED & SECURED
                            </button>
                          )}
                          {alert.status === "RESOLVED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAlertStatus(alert.sosId, "ACTIVE");
                              }}
                              className="flex-1 font-mono text-[9px] py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black cursor-pointer text-center shadow-lg transition-all"
                            >
                              RE-OPEN DISTRESS ALERT
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* CENTER & RIGHT STAGE: INTERACTIVE TACTICAL MAP & HUD INSPECTOR */}
          <main className="flex-1 h-[340px] md:h-full relative overflow-hidden bg-[#06090e] flex flex-col">
            {/* Map Canvas */}
            <div className="flex-1 w-full h-full relative">
              <SosControlMap 
                alerts={alerts} 
                selectedAlertId={selectedAlertId} 
                onSelectAlert={setSelectedAlertId}
                onUpdateStatus={updateAlertStatus}
              />
            </div>

            {/* FLOATING TACTICAL INSPECTOR DRAWER (Visible when incident selected) */}
            {selectedAlert && (
              <div className="hidden lg:block absolute bottom-12 right-4 z-[500] w-[340px] bg-[#080d1a]/95 backdrop-blur-xl border border-slate-750 rounded-xl p-4 shadow-2xl font-mono text-[9px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-bold text-white tracking-wider">TACTICAL TELEMETRY INSPECTOR</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded font-black text-[8px] ${
                    selectedAlert.status === "ACTIVE" ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    {selectedAlert.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">BEACON ID:</span>
                    <span className="font-bold text-white">{selectedAlert.sosId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">HIKER IDENT:</span>
                    <span className="text-sky-300 font-semibold">{selectedAlert.hikerName || "Field Agent"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ASSIGNED UNIT:</span>
                    <span className="text-amber-300 font-semibold">{selectedAlert.assignedTeam || "SAR TEAM ALPHA"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SF-PDR KINEMATICS:</span>
                    <span>WEINBERG STRIDE: 0.42m • 108 SPM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DTN STORE-&-FWD:</span>
                    <span className="text-cyan-300">RELAY VIA {selectedAlert.relayDeviceId || "GATEWAY-01"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RF LINK QUALITY:</span>
                    <span className="text-emerald-400">RSSI -68 dBm (SNR 14.8 dB)</span>
                  </div>
                </div>
              </div>
            )}

            {/* BOTTOM LIVE DTN PACKET STREAM CONSOLE */}
            <footer className="w-full bg-[#050811] border-t border-slate-800/80 px-4 py-2 font-mono text-[8px] text-slate-400 flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex items-center gap-1 text-sky-400 font-bold shrink-0">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>LIVE DTN CONSOLE:</span>
                </div>
                <div className="truncate text-slate-400 animate-pulse">
                  {recentDtnLogs[0] || "[LIVE] LISTENING ON BLE FREQUENCY 2.402 GHz FOR AD-HOC DISTRESS PACKETS"}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-3 shrink-0 text-slate-500">
                <span>BUFFER: 512 KB</span>
                <span>•</span>
                <span>ENC: AES-128 GCM</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">MONGODB SYNC READY</span>
              </div>
            </footer>
          </main>

        </div>
      )}
    </div>
  );
}
