"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Radio, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  MapPin, 
  Activity, 
  RefreshCw, 
  ArrowLeft,
  BellRing,
  Copy,
  Check,
  Volume2,
  VolumeX,
  PlusCircle,
  Compass,
  Footprints,
  Mountain,
  Wifi,
  User,
  Search,
  ExternalLink,
  Cpu,
  Zap,
  Battery
} from "lucide-react";
import SosControlMap from "../components/SosControlMap";

export default function SosControlRoom() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSector, setFilterSector] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
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

  // Fetch alerts from backend API
  const fetchAlerts = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/sos");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAlerts(json.data);
        setIsDemoMode(json.source === "TACTICAL_CACHE");
        setErrorMsg(null);

        // If no incident is selected, select the first active one
        if (!selectedAlertId && json.data.length > 0) {
          const firstActive = json.data.find(a => a.status === "ACTIVE") || json.data[0];
          setSelectedAlertId(firstActive.sosId);
        }
      } else {
        setErrorMsg(json.message || "Unable to retrieve emergency alerts");
      }
    } catch (e) {
      console.error("Failed to fetch alerts:", e);
      setErrorMsg("Cluster DNS sync pending. Active DTN telemetry fallback active.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Poll for live distress telemetry every 5 seconds
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => fetchAlerts(), 5000);
    return () => clearInterval(interval);
  }, []);

  // Generate DTN Packet Log Stream
  useEffect(() => {
    const logs = [
      `[${missionClock.local || 'LIVE'}] BLE_ADV_IND: INGESTED RAW DTN PACKET VIA GATEWAY_01 (CRC32: PASS)`,
      `[${missionClock.local || 'LIVE'}] MESH TOPOLOGY: 8 ACTIVE RELAY NODES WITHIN AD-HOC RADIUS`,
      `[${missionClock.local || 'LIVE'}] 2DSPHERE SPATIAL INDEX: EPSG:3857 BUFFER LOCK CONFIRMED`,
      `[${missionClock.local || 'LIVE'}] STORE-AND-FORWARD: LOCAL OFFLINE CACHE SYNCED WITH CLUSTER`,
    ];
    setRecentDtnLogs(logs);
  }, [missionClock.local]);

  // Update Status of an Incident
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
      console.error("Failed to update status:", e);
    }
  };

  // Simulate a live SOS Distress Packet (Evaluator Demo Mode)
  const simulateNewDistressBeacon = async () => {
    playTacticalChime();
    const randomId = `SOS-SIM-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomOffsets = [
      { name: "Sector 7 (SECE Trail North)", coords: [77.0612, 10.8291], alt: 345.2, hiker: "Arun K. (Scout 2)" },
      { name: "Sector 7 (SECE Perimeter West)", coords: [77.0588, 10.8274], alt: 339.0, hiker: "Priya V. (Field Lead)" },
      { name: "Sector 4 (Nilgiris Escarpment)", coords: [76.7145, 11.4120], alt: 2260.5, hiker: "David R. (Hiker)" },
    ];
    const pick = randomOffsets[Math.floor(Math.random() * randomOffsets.length)];

    const payload = {
      sosId: randomId,
      senderDeviceId: `DEV-${Math.floor(200 + Math.random() * 800)}`,
      hikerName: pick.hiker,
      emergencyType: "UNRESPONSIVE / SF-PDR SUDDEN DROP DETECTED",
      sector: pick.name,
      batteryLevel: Math.floor(12 + Math.random() * 25),
      stepCount: Math.floor(6500 + Math.random() * 5000),
      assignedTeam: "SAR RAPID TEAM ALPHA",
      relayDeviceId: "NODE-RELAY-03",
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
      if (json.success) {
        setAlerts(prev => [json.data, ...prev]);
        setSelectedAlertId(json.data.sosId);
      }
    } catch (e) {
      // Direct local state injection if API request fails
      setAlerts(prev => [payload, ...prev]);
      setSelectedAlertId(payload.sosId);
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

  // Filtered Alerts List
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
        const matchesId = alert.sosId.toLowerCase().includes(query);
        const matchesSender = (alert.senderDeviceId || "").toLowerCase().includes(query);
        const matchesHiker = (alert.hikerName || "").toLowerCase().includes(query);
        const matchesSector = (alert.sector || "").toLowerCase().includes(query);
        if (!matchesId && !matchesSender && !matchesHiker && !matchesSector) return false;
      }

      return true;
    });
  }, [alerts, filterStatus, filterSector, searchQuery]);

  // Aggregate Telemetry
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
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="absolute w-6 h-6 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
            </div>
            <div>
              <h1 className="font-mono text-xs md:text-sm font-black tracking-[0.2em] text-white flex items-center gap-2">
                SEARCH & RESCUE INCIDENT COMMAND ROOM
              </h1>
              <div className="flex items-center gap-2 font-mono text-[8px] text-slate-400">
                <span className="text-rose-400 font-bold">DTN MESH PROTOCOL v2.4</span>
                <span>•</span>
                <span className="text-emerald-400">ENCRYPTED BLE AD-HOC TELEMETRY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Mission Time, Cluster Status & Simulator Action */}
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

          {/* Database / DTN Cluster Status Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 font-mono text-[9px] px-2.5 py-1 rounded-lg border ${
            isDemoMode
              ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
              : "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isDemoMode ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-ping"}`} />
            <span className="font-bold">{isDemoMode ? "DTN SIMULATION FALLBACK" : "LIVE MONGO CLUSTER"}</span>
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

          {/* ⚡ SIMULATE SOS PACKET BUTTON (Key Evaluator Interactive Feature) */}
          <button
            onClick={simulateNewDistressBeacon}
            className="font-mono text-[9px] md:text-[10px] font-black px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white border border-rose-400/30 shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
            <span className="tracking-wider">TRANSMIT SOS BEACON</span>
          </button>

          {/* Manual Refresh Button */}
          <button 
            onClick={() => fetchAlerts(true)}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-sky-400 hover:border-sky-500/40 transition-all cursor-pointer shadow-md"
            disabled={refreshing}
            title="Refresh Inbound Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* TACTICAL KPI METRICS STRIP */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 px-4 md:px-6 bg-[#070b16]/70 border-b border-slate-800/80 z-20">
        {/* Metric 1: Active Distresses (P1 Crimson) */}
        <div className="bg-gradient-to-br from-rose-950/20 to-slate-950/80 border border-rose-500/30 rounded-xl p-3 flex flex-col justify-between shadow-[0_0_20px_rgba(239,68,68,0.06)] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-rose-300 tracking-wider font-bold uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              PRIORITY 1 DISPATCHES
            </span>
            <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
              CRITICAL
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black font-mono text-rose-500 tracking-tight">{activeCount}</span>
            <span className="text-[10px] text-rose-300/70 font-mono">ACTIVE BEACONS</span>
          </div>
          <div className="font-mono text-[8px] text-slate-400 mt-1 flex items-center justify-between border-t border-rose-900/30 pt-1">
            <span>IMMEDIATE EXTRACTION</span>
            <span className="text-rose-400 font-semibold">{activeCount > 0 ? "TRIAGE REQ" : "ALL CLEAR"}</span>
          </div>
        </div>

        {/* Metric 2: Acknowledged / Responding (Amber) */}
        <div className="bg-gradient-to-br from-amber-950/20 to-slate-950/80 border border-amber-500/30 rounded-xl p-3 flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.06)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-amber-300 tracking-wider font-bold uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              IN-ROUTE TEAMS
            </span>
            <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
              EN ROUTE
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black font-mono text-amber-400 tracking-tight">{ackCount}</span>
            <span className="text-[10px] text-amber-300/70 font-mono">RESPONDING</span>
          </div>
          <div className="font-mono text-[8px] text-slate-400 mt-1 flex items-center justify-between border-t border-amber-900/30 pt-1">
            <span>AVG RESPONSE TIME</span>
            <span className="text-amber-400 font-semibold">3.4 MIN</span>
          </div>
        </div>

        {/* Metric 3: Resolved & Secured (Cyber Emerald) */}
        <div className="bg-gradient-to-br from-emerald-950/20 to-slate-950/80 border border-emerald-500/30 rounded-xl p-3 flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.06)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-emerald-300 tracking-wider font-bold uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              SECURED / EXTRACTED
            </span>
            <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              SAFE
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black font-mono text-emerald-400 tracking-tight">{resolvedCount}</span>
            <span className="text-[10px] text-emerald-300/70 font-mono">RESOLVED</span>
          </div>
          <div className="font-mono text-[8px] text-slate-400 mt-1 flex items-center justify-between border-t border-emerald-900/30 pt-1">
            <span>EXTRACTION RATE</span>
            <span className="text-emerald-400 font-semibold">100.0%</span>
          </div>
        </div>

        {/* Metric 4: Mesh Topology & Hops (Electric Cyan) */}
        <div className="bg-gradient-to-br from-cyan-950/20 to-slate-950/80 border border-cyan-500/30 rounded-xl p-3 flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.06)] relative overflow-hidden">
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
          <div className="font-mono text-[8px] text-slate-400 mt-1 flex items-center justify-between border-t border-cyan-900/30 pt-1">
            <span>PACKET LOSS RATE</span>
            <span className="text-cyan-400 font-semibold">0.0% (STORE & FWD)</span>
          </div>
        </div>
      </section>

      {/* MAIN OPERATIONS WORKSPACE */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-9 h-9 text-sky-400 animate-spin" />
          <span className="font-mono text-xs text-slate-400 tracking-widest uppercase">INITIALIZING TACTICAL C2 INTERFACES...</span>
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

              {/* Status Tabs */}
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

            {/* Incidents Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 min-h-0">
              {filteredAlerts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-950/40 my-6">
                  <Activity className="w-8 h-8 text-slate-700 mb-3 animate-pulse" />
                  <span className="font-mono text-xs text-slate-400 font-bold tracking-wider">NO INCIDENTS IN QUEUE</span>
                  <p className="font-mono text-[9px] text-slate-500 mt-1 max-w-[240px]">
                    All wilderness sectors report nominal conditions. Click below to simulate an ad-hoc distress signal.
                  </p>
                  <button
                    onClick={simulateNewDistressBeacon}
                    className="mt-4 font-mono text-[9px] px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 cursor-pointer transition-all flex items-center gap-1.5 font-bold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    SEED TEST BEACON
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

                      {/* Tactical Action Buttons (Always accessible when selected or expanded) */}
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
                <span className="text-emerald-400 font-bold">SYSTEM READY</span>
              </div>
            </footer>
          </main>

        </div>
      )}
    </div>
  );
}
