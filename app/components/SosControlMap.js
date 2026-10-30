"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";

export default function SosControlMap({ 
  alerts = [], 
  selectedAlertId, 
  onSelectAlert, 
  onUpdateStatus 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletModuleRef = useRef(null);
  const markersGroupRef = useRef(null);
  const circlesGroupRef = useRef(null);
  const tileLayersRef = useRef({});
  const markerMapRef = useRef({});

  const [activeBasemap, setActiveBasemap] = useState("dark"); // "dark" | "satellite"
  const [showPerimeters, setShowPerimeters] = useState(true);
  const [cursorCoords, setCursorCoords] = useState(null);
  const [mapZoom, setMapZoom] = useState(14);

  // Initialize Map Once
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      leafletModuleRef.current = L;

      if (!isMounted || !mapContainerRef.current) return;

      // Clean existing instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default center: SECE Campus
      const initialCenter = [10.82804, 77.06054];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
        maxZoom: 19,
        minZoom: 2,
      });

      // Add Zoom Control at bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Attribution control in dark styling
      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution('&copy; <span class="text-zinc-400">Esri SAR Cartography</span>')
        .addTo(map);

      // 1. Esri World Dark Gray Canvas Base + Reference Labels (Zero API Key, Clean Dark)
      const darkBase = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, subdomains: ["server", "services"] }
      );
      const darkRef = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, pane: "shadowPane" }
      );
      const darkGroup = L.layerGroup([darkBase, darkRef]);

      // 2. Esri World Imagery (Satellite Reconnaissance)
      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      );

      tileLayersRef.current = {
        dark: darkGroup,
        satellite: satellite,
      };

      // Default to Dark Canvas
      darkGroup.addTo(map);

      // Dedicated layer groups for markers & radius perimeters
      const perimetersGroup = L.layerGroup().addTo(map);
      const markersGroup = L.layerGroup().addTo(map);

      markersGroupRef.current = markersGroup;
      circlesGroupRef.current = perimetersGroup;
      mapInstanceRef.current = map;

      // Track cursor coordinates
      map.on("mousemove", (e) => {
        setCursorCoords({
          lat: e.latlng.lat.toFixed(5),
          lng: e.latlng.lng.toFixed(5),
        });
      });

      map.on("zoomend", () => {
        setMapZoom(map.getZoom());
      });

      // Ensure dimensions render sharply
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch basemap layer smoothly
  const handleBasemapChange = useCallback((mode) => {
    const map = mapInstanceRef.current;
    const layers = tileLayersRef.current;
    if (!map || !layers.dark || !layers.satellite) return;

    if (mode === "satellite") {
      if (map.hasLayer(layers.dark)) map.removeLayer(layers.dark);
      if (!map.hasLayer(layers.satellite)) map.addLayer(layers.satellite);
      setActiveBasemap("satellite");
    } else {
      if (map.hasLayer(layers.satellite)) map.removeLayer(layers.satellite);
      if (!map.hasLayer(layers.dark)) map.addLayer(layers.dark);
      setActiveBasemap("dark");
    }
  }, []);

  // Update Markers & Perimeter circles when alerts change (without destroying map)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletModuleRef.current;
    const markersGroup = markersGroupRef.current;
    const circlesGroup = circlesGroupRef.current;

    if (!map || !L || !markersGroup || !circlesGroup) return;

    markersGroup.clearLayers();
    circlesGroup.clearLayers();
    markerMapRef.current = {};

    alerts.forEach((alert) => {
      if (!alert.location || !alert.location.coordinates) return;
      const [lng, lat] = alert.location.coordinates;
      const status = alert.status || "ACTIVE";
      const isSelected = alert.sosId === selectedAlertId;

      // Color scheme based on severity & triage status
      let mainColor = "#ef4444"; // Crimson (Active)
      let glowColor = "rgba(239, 68, 68, 0.4)";
      let pulseAnimClass = "animate-sonar-red";
      let statusLabel = "CRITICAL DISTRESS";

      if (status === "ACKNOWLEDGED") {
        mainColor = "#f59e0b"; // Amber (Acknowledged / In Route)
        glowColor = "rgba(245, 158, 11, 0.35)";
        pulseAnimClass = "animate-sonar-amber";
        statusLabel = "RESPONSE IN-ROUTE";
      } else if (status === "RESOLVED") {
        mainColor = "#10b981"; // Cyber Emerald (Secured)
        glowColor = "rgba(16, 185, 129, 0.25)";
        pulseAnimClass = "";
        statusLabel = "MISSION SECURED";
      }

      // Add Search / Reception Perimeter Circle (250m & 500m)
      if (showPerimeters) {
        const radiusMeters = status === "ACTIVE" ? 450 : 250;
        const circle = L.circle([lat, lng], {
          radius: radiusMeters,
          color: mainColor,
          weight: 1.5,
          dashArray: status === "ACTIVE" ? "4, 6" : undefined,
          fillColor: mainColor,
          fillOpacity: status === "ACTIVE" ? 0.08 : 0.04,
        });
        circlesGroup.addLayer(circle);
      }

      // Custom Pulsing DivIcon
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer select-none" style="width: 48px; height: 48px;">
          <!-- Sonar Rings for Active Beacons -->
          ${
            status === "ACTIVE"
              ? `<div class="absolute inset-0 rounded-full border-2 border-rose-500/70 ${pulseAnimClass}"></div>
                 <div class="absolute inset-2 rounded-full bg-rose-500/20 ${pulseAnimClass}" style="animation-delay: 0.8s;"></div>`
              : status === "ACKNOWLEDGED"
              ? `<div class="absolute inset-1 rounded-full border border-amber-500/60 ${pulseAnimClass}"></div>`
              : ""
          }

          <!-- Tactical Reticle when Selected -->
          ${
            isSelected
              ? `<div class="absolute -inset-1.5 border border-dashed border-cyan-400 rounded-lg animate-reticle-spin"></div>`
              : ""
          }

          <!-- Center Solid Beacon Core -->
          <div class="relative z-10 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center shadow-lg"
               style="background-color: ${mainColor}; box-shadow: 0 0 14px ${glowColor};">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>

          <!-- Micro Tag Below Beacon -->
          <div class="absolute -bottom-4 font-mono font-bold tracking-widest text-[8px] px-1.5 py-0.2 rounded bg-slate-950/90 border border-slate-800 text-slate-200 shadow-md whitespace-nowrap z-20 pointer-events-none">
            ${alert.sosId.replace("SOS-", "")}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: `tactical-beacon-${alert.sosId}`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -22],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Tactical Popup Content
      const popupHtml = `
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; width: 280px; padding: 12px; background: #080c14; border-radius: 10px; color: #e2e8f0;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 8px; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${mainColor}; box-shadow: 0 0 8px ${mainColor};"></span>
              <strong style="color: #ffffff; font-size: 11px; letter-spacing: 0.05em;">${alert.sosId}</strong>
            </div>
            <span style="font-size: 8px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${status === "ACTIVE" ? "rgba(239,68,68,0.2)" : status === "ACKNOWLEDGED" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}; color: ${mainColor}; border: 1px solid ${mainColor}40;">
              ${status}
            </span>
          </div>

          <div style="font-size: 10px; margin-bottom: 6px; color: #94a3b8;">
            HIKER: <span style="color: #f1f5f9; font-weight: 600;">${alert.hikerName || alert.senderDeviceId}</span>
          </div>

          <div style="font-size: 9px; padding: 4px 6px; background: rgba(15, 23, 42, 0.6); border-radius: 4px; border: 1px solid #1e293b; margin-bottom: 8px;">
            <span style="color: #38bdf8;">ALERT:</span> ${alert.emergencyType || "GENERAL DISTRESS"}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 9px; margin-bottom: 8px; border-top: 1px dashed #1e293b; padding-top: 6px;">
            <div><span style="color: #64748b;">LAT:</span> ${lat.toFixed(5)}°</div>
            <div><span style="color: #64748b;">LNG:</span> ${lng.toFixed(5)}°</div>
            <div><span style="color: #64748b;">ALT:</span> ${alert.altitude ? alert.altitude.toFixed(1) + 'm' : 'N/A'}</div>
            <div><span style="color: #64748b;">HOPS:</span> ${alert.hopCount} (${alert.relayDeviceId || 'Direct'})</div>
            <div><span style="color: #64748b;">BATT:</span> ${alert.batteryLevel ? alert.batteryLevel + '%' : 'N/A'}</div>
            <div><span style="color: #64748b;">STEPS:</span> ${alert.stepCount ? alert.stepCount.toLocaleString() : 'N/A'}</div>
          </div>

          <div style="font-size: 8px; color: #64748b; margin-bottom: 8px;">
            BROADCAST: ${new Date(alert.timestamp).toLocaleTimeString()} (${alert.sector || 'Main Sector'})
          </div>

          <div style="display: flex; gap: 6px; margin-top: 8px; border-top: 1px solid #1e293b; padding-top: 8px;">
            ${
              status === "ACTIVE"
                ? `<button onclick="window.__SAR_DISPATCH_ACK__('${alert.sosId}')" style="flex: 1; font-family: monospace; font-size: 9px; font-weight: bold; background: #f59e0b; color: #020617; border: none; padding: 5px; border-radius: 4px; cursor: pointer;">
                    ACKNOWLEDGE
                   </button>
                   <button onclick="window.__SAR_DISPATCH_RES__('${alert.sosId}')" style="flex: 1; font-family: monospace; font-size: 9px; font-weight: bold; background: #10b981; color: #020617; border: none; padding: 5px; border-radius: 4px; cursor: pointer;">
                    RESOLVE
                   </button>`
                : status === "ACKNOWLEDGED"
                ? `<button onclick="window.__SAR_DISPATCH_RES__('${alert.sosId}')" style="flex: 1; font-family: monospace; font-size: 9px; font-weight: bold; background: #10b981; color: #020617; border: none; padding: 5px; border-radius: 4px; cursor: pointer;">
                    RESOLVE INCIDENT
                   </button>`
                : `<button onclick="window.__SAR_DISPATCH_REOPEN__('${alert.sosId}')" style="flex: 1; font-family: monospace; font-size: 9px; font-weight: bold; background: #ef4444; color: #ffffff; border: none; padding: 5px; border-radius: 4px; cursor: pointer;">
                    RE-OPEN DISTRESS
                   </button>`
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300 });

      marker.on("click", () => {
        onSelectAlert?.(alert.sosId);
      });

      markersGroup.addLayer(marker);
      markerMapRef.current[alert.sosId] = marker;
    });

    // Provide global hooks for popup action buttons
    window.__SAR_DISPATCH_ACK__ = (id) => onUpdateStatus?.(id, "ACKNOWLEDGED");
    window.__SAR_DISPATCH_RES__ = (id) => onUpdateStatus?.(id, "RESOLVED");
    window.__SAR_DISPATCH_REOPEN__ = (id) => onUpdateStatus?.(id, "ACTIVE");

  }, [alerts, selectedAlertId, showPerimeters, onSelectAlert, onUpdateStatus]);

  // Smooth Fly-to on Alert Selection
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedAlertId) return;

    const alert = alerts.find((a) => a.sosId === selectedAlertId);
    if (alert && alert.location && alert.location.coordinates) {
      const [lng, lat] = alert.location.coordinates;
      map.flyTo([lat, lng], 16, {
        duration: 1.2,
        easeLinearity: 0.25,
      });

      const marker = markerMapRef.current[selectedAlertId];
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 600);
      }
    }
  }, [selectedAlertId, alerts]);

  // Quick Sector Jump Handlers
  const jumpToSector = (coords, zoom = 15) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(coords, zoom, { duration: 1.4 });
  };

  const fitAllIncidents = () => {
    const map = mapInstanceRef.current;
    const L = leafletModuleRef.current;
    if (!map || !L || alerts.length === 0) return;

    const validPoints = alerts
      .filter((a) => a.location?.coordinates)
      .map((a) => [a.location.coordinates[1], a.location.coordinates[0]]);

    if (validPoints.length > 0) {
      map.fitBounds(L.latLngBounds(validPoints), { padding: [60, 60], maxZoom: 16 });
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#06090e] select-none">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Crosshair Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none z-[400] shadow-[inset_0_0_80px_rgba(3,7,18,0.9)]" />

      {/* Top Map HUD: Tactical Basemap & Sector Jump Controls */}
      <div className="absolute top-4 left-4 z-[500] flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Basemap Switcher */}
        <div className="flex rounded-lg bg-[#090d16]/90 backdrop-blur-md border border-slate-800 p-1 shadow-2xl">
          <button
            onClick={() => handleBasemapChange("dark")}
            className={`font-mono text-[9px] px-2.5 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer font-bold ${
              activeBasemap === "dark"
                ? "bg-slate-800 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            TACTICAL CANVAS
          </button>
          <button
            onClick={() => handleBasemapChange("satellite")}
            className={`font-mono text-[9px] px-2.5 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer font-bold ${
              activeBasemap === "satellite"
                ? "bg-slate-800 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            SATELLITE RECON
          </button>
        </div>

        {/* Sector Quick-Nav Jump Pills */}
        <div className="hidden sm:flex rounded-lg bg-[#090d16]/90 backdrop-blur-md border border-slate-800 p-1 shadow-2xl items-center gap-1">
          <span className="font-mono text-[8px] text-slate-500 uppercase px-2 font-bold">SECTOR JUMP:</span>
          <button
            onClick={() => jumpToSector([10.82804, 77.06054], 15)}
            className="font-mono text-[9px] px-2 py-1 rounded bg-slate-900 text-slate-300 hover:text-sky-300 hover:bg-slate-800 transition-all cursor-pointer font-semibold"
          >
            SECE ALPHA
          </button>
          <button
            onClick={() => jumpToSector([11.41020, 76.71130], 14)}
            className="font-mono text-[9px] px-2 py-1 rounded bg-slate-900 text-slate-300 hover:text-sky-300 hover:bg-slate-800 transition-all cursor-pointer font-semibold"
          >
            NILGIRIS
          </button>
          <button
            onClick={() => jumpToSector([0.78930, 101.34310], 13)}
            className="font-mono text-[9px] px-2 py-1 rounded bg-slate-900 text-slate-300 hover:text-sky-300 hover:bg-slate-800 transition-all cursor-pointer font-semibold"
          >
            SUMATRA
          </button>
          <button
            onClick={fitAllIncidents}
            className="font-mono text-[9px] px-2 py-1 rounded bg-sky-950/60 border border-sky-500/30 text-sky-400 hover:bg-sky-900/60 transition-all cursor-pointer font-bold"
          >
            FIT ALL ({alerts.length})
          </button>
        </div>

        {/* Perimeter Radius Toggle */}
        <button
          onClick={() => setShowPerimeters(!showPerimeters)}
          className={`font-mono text-[9px] px-2.5 py-1.5 rounded-lg border backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer font-bold ${
            showPerimeters
              ? "bg-slate-900/90 border-cyan-500/40 text-cyan-300"
              : "bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showPerimeters ? "bg-cyan-400" : "bg-slate-600"}`}></span>
          MESH PERIMETER (450M)
        </button>
      </div>

      {/* Bottom Map Telemetry HUD (Live Coordinates & Grid Zoom) */}
      <div className="absolute bottom-4 left-4 z-[500] pointer-events-none flex items-center gap-3 font-mono text-[9px] text-slate-400 bg-[#090d16]/90 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-lg shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-bold">GRID:</span>
          <span>{cursorCoords ? `${cursorCoords.lat}° N, ${cursorCoords.lng}° E` : "10.82804° N, 77.06054° E"}</span>
        </div>
        <div className="h-3 w-px bg-slate-800" />
        <div>
          <span className="text-slate-500">ZOOM:</span> <span className="text-slate-200 font-bold">{mapZoom}X</span>
        </div>
        <div className="h-3 w-px bg-slate-800" />
        <div className="hidden sm:block">
          <span className="text-slate-500">PROJECTION:</span> <span className="text-slate-200">WGS84 EPSG:3857</span>
        </div>
      </div>
    </div>
  );
}
