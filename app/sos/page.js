"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  MapPin, 
  Activity, 
  RefreshCw, 
  ArrowLeft,
  Settings,
  BellRing
} from "lucide-react";
import SosControlMap from "../components/SosControlMap";

export default function SosControlRoom() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch alerts from backend
  const fetchAlerts = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/sos");
      const json = await res.json();
      if (json.success) {
        setAlerts(json.data);
        setErrorMsg(null);
      } else {
        setErrorMsg(json.message || json.error || "Failed to load alerts");
      }
    } catch (e) {
      console.error("Failed to fetch alerts:", e);
      setErrorMsg("Network request failed. Ensure backend service is reachable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Poll database every 5 seconds for live distress feeds
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => fetchAlerts(), 5000);
    return () => clearInterval(interval);
  }, []);

  // Update status of alert
  const updateAlertStatus = async (sosId, newStatus) => {
    try {
      const res = await fetch("/api/sos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sosId, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        // Refresh local state list
        fetchAlerts();
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  // Filtered Alert lists
  const filteredAlerts = alerts.filter((alert) => {
    if (filterStatus === "ALL") return true;
    return alert.status === filterStatus;
  });

  // Telemetry counts
  const activeCount = alerts.filter(a => a.status === "ACTIVE").length;
  const ackCount = alerts.filter(a => a.status === "ACKNOWLEDGED").length;
  const resolvedCount = alerts.filter(a => a.status === "RESOLVED").length;
  const maxHops = alerts.length > 0 ? Math.max(...alerts.map(a => a.hopCount || 0)) : 0;

  return (
    <div className="h-screen w-full overflow-hidden bg-[#030303] text-zinc-100 font-sans relative flex flex-col">
      {/* Noise Texture Grid Overlay */}
      <div className="noise-overlay" />

      {/* Control Room Header */}
      <header className="w-full bg-[#09090b] border-b border-zinc-900 p-4 px-6 flex items-center justify-between z-10 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-4">
          <Link 
            href="/explore"
            className="font-mono text-[9px] px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          >
            <ArrowLeft className="w-3 h-3" />
            Cockpit
          </Link>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <h1 className="font-mono text-xs md:text-sm font-black tracking-[0.25em] text-white">
              INCIDENT CONTROL ROOM
            </h1>
          </div>
          <span className="font-mono text-[8px] tracking-wider text-rose-500 px-2 py-0.5 rounded bg-rose-950/20 border border-rose-500/20 uppercase flex items-center gap-1 animate-pulse">
            <BellRing className="w-2.5 h-2.5" />
            LIVE DISTRESS FEED
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchAlerts(true)}
            className="p-2 rounded bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer"
            disabled={refreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Telemetry Dashboard Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 px-6 bg-[#060608]/50 border-b border-zinc-900 z-10">
        {/* Active Distresses */}
        <div className="bg-rose-950/10 border border-rose-950/40 rounded-xl p-4 flex flex-col justify-between shadow-[0_0_15px_rgba(244,63,94,0.02)]">
          <span className="font-mono text-[9px] text-rose-400 tracking-wider font-semibold uppercase">ACTIVE DISPATCHES</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-rose-500">{activeCount}</span>
            <span className="text-[10px] text-rose-400/60 font-mono">INCIDENTS</span>
          </div>
        </div>

        {/* Acknowledged */}
        <div className="bg-amber-950/10 border border-amber-950/40 rounded-xl p-4 flex flex-col justify-between shadow-[0_0_15px_rgba(245,158,11,0.02)]">
          <span className="font-mono text-[9px] text-amber-400 tracking-wider font-semibold uppercase">ACKNOWLEDGED</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-amber-500">{ackCount}</span>
            <span className="text-[10px] text-amber-400/60 font-mono">RESPONDING</span>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-emerald-950/10 border border-emerald-950/40 rounded-xl p-4 flex flex-col justify-between shadow-[0_0_15px_rgba(16,185,129,0.02)]">
          <span className="font-mono text-[9px] text-emerald-400 tracking-wider font-semibold uppercase">RESOLVED</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-emerald-500">{resolvedCount}</span>
            <span className="text-[10px] text-emerald-400/60 font-mono">SECURED</span>
          </div>
        </div>

        {/* Max Hop Count */}
        <div className="bg-zinc-900/10 border border-zinc-850 rounded-xl p-4 flex flex-col justify-between shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <span className="font-mono text-[9px] text-zinc-400 tracking-wider font-semibold uppercase">MAX MESH HOPS</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-zinc-100">{maxHops}</span>
            <span className="text-[10px] text-zinc-500/60 font-mono">RELAY NODES</span>
          </div>
        </div>
      </section>

      {/* Split Dashboard Area */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="font-mono text-xs text-zinc-500 tracking-widest uppercase">TUNING MESH SENSORS...</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
          
          {/* Left Panel: Logs & Filters */}
          <aside className="w-full md:w-[420px] border-r border-zinc-900 flex flex-col bg-[#050505] overflow-hidden">
            {/* Filter Tabs */}
            <div className="flex border-b border-zinc-900 p-3 bg-zinc-950/40 gap-2 shrink-0">
              {["ALL", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setFilterStatus(tab);
                    setSelectedAlertId(null);
                  }}
                  className={`flex-1 font-mono text-[8px] tracking-wider py-2 rounded font-bold cursor-pointer transition-all border ${
                    filterStatus === tab
                      ? tab === "ACTIVE"
                        ? "bg-rose-950/20 border-rose-500/30 text-rose-400"
                        : tab === "ACKNOWLEDGED"
                        ? "bg-amber-950/20 border-amber-500/30 text-amber-400"
                        : tab === "RESOLVED"
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-200"
                      : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Connection/SRV DNS Error Banner */}
            {errorMsg && (
              <div className="mx-4 mt-4 p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-400 font-mono text-[9px] leading-relaxed shadow-[0_0_15px_rgba(244,63,94,0.05)] relative overflow-hidden flex flex-col gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                  <ShieldAlert className="w-3.5 h-3.5 animate-pulse text-rose-500" />
                  Database Connection Error
                </div>
                <div className="text-zinc-400 select-all select-text font-mono text-[9px]">
                  {errorMsg}
                </div>
                <div className="text-zinc-500 text-[8px] italic mt-1 border-t border-rose-950/40 pt-1">
                  Troubleshooting: SRV errors are usually caused by local DNS blocking _mongodb._tcp. Try setting your computer DNS to Google (8.8.8.8) or Cloudflare (1.1.1.1) to unblock the Mongo cluster.
                </div>
              </div>
            )}

            {/* Incident Cards list */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
              {filteredAlerts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-650 border border-dashed border-zinc-900 rounded-xl bg-zinc-950/10">
                  <Activity className="w-8 h-8 text-zinc-800 animate-pulse mb-3" />
                  <span className="font-mono text-[9px] text-zinc-600 tracking-wider">NO INCIDENTS FILED</span>
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
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col gap-3 relative overflow-hidden group ${
                        isSelected 
                          ? isActive
                            ? "bg-rose-950/10 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.06)]"
                            : isAck
                            ? "bg-amber-950/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.06)]"
                            : "bg-emerald-950/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.06)]"
                          : "bg-zinc-950/50 border-zinc-900 hover:border-zinc-800"
                      }`}
                    >
                      {/* Left color glow tab */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isActive ? "bg-rose-500" : isAck ? "bg-amber-500" : "bg-emerald-500"
                      }`} />

                      {/* Card Header details */}
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className={`font-mono text-[10px] font-black tracking-wide ${
                            isActive ? "text-rose-400" : isAck ? "text-amber-400" : "text-emerald-400"
                          }`}>
                            ID: {alert.sosId}
                          </span>
                          <span className="font-mono text-[8px] text-zinc-500 mt-0.5">SENDER: {alert.senderDeviceId}</span>
                        </div>
                        <span className={`font-mono text-[8px] px-2 py-0.5 rounded font-bold uppercase ${
                          isActive 
                            ? "bg-rose-950/30 text-rose-400 border border-rose-500/20 animate-pulse" 
                            : isAck 
                            ? "bg-amber-950/30 text-amber-400 border border-amber-500/20" 
                            : "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {alert.status}
                        </span>
                      </div>

                      {/* GPS & Alt Details */}
                      <div className="flex flex-col gap-1.5 font-mono text-[9px] text-zinc-400 border-t border-dashed border-zinc-900/60 pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                          <span>COORDS: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
                        </div>
                        {alert.altitude && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span>ALTITUDE: {alert.altitude.toFixed(1)}m • HOPS: {alert.hopCount}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Clock className="w-3.5 h-3.5 text-zinc-650" />
                          <span>BROADCAST: {new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Card Action workflows (Visible only when selected) */}
                      {isSelected && (
                        <div className="flex gap-2 mt-2 pt-3 border-t border-zinc-900">
                          {isActive && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAlertStatus(alert.sosId, "ACKNOWLEDGED");
                                }}
                                className="flex-1 font-mono text-[8px] py-1.5 rounded bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 cursor-pointer text-center"
                              >
                                ACKNOWLEDGE
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAlertStatus(alert.sosId, "RESOLVED");
                                }}
                                className="flex-1 font-mono text-[8px] py-1.5 rounded bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 cursor-pointer text-center"
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
                              className="flex-1 font-mono text-[8px] py-1.5 rounded bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 cursor-pointer text-center"
                            >
                              RESOLVE INCIDENT
                            </button>
                          )}
                          {alert.status === "RESOLVED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAlertStatus(alert.sosId, "ACTIVE");
                              }}
                              className="flex-1 font-mono text-[8px] py-1.5 rounded bg-rose-500 text-zinc-950 font-bold hover:bg-rose-450 cursor-pointer text-center"
                            >
                              RE-OPEN INCIDENT
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

          {/* Right Panel: Interactive Beacons Map */}
          <main className="flex-1 h-[300px] md:h-full relative overflow-hidden bg-zinc-950">
            <SosControlMap 
              alerts={alerts} 
              selectedAlertId={selectedAlertId} 
              onSelectAlert={setSelectedAlertId} 
            />
          </main>

        </div>
      )}
    </div>
  );
}
