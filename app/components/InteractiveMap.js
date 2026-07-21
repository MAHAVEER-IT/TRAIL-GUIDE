"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export default function InteractiveMap({ lat, lng, name }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    let active = true;

    // Load Leaflet dynamically inside the browser only
    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;

      // Remove previous instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize Leaflet Map
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: true
      });

      // Load CartoDB Dark Matter tiles (moody premium black-and-green aesthetic)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
        subdomains: "abcd"
      }).addTo(map);

      // Create a pulsing radar beacon icon using HTML DivIcon
      const beaconIcon = L.divIcon({
        className: "custom-beacon-icon",
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <div class="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-zinc-950 shadow-[0_0_12px_#10b981] animate-pulse"></div>
            <div class="absolute w-8 h-8 rounded-full bg-emerald-400/25 animate-ping" style="animation-duration: 2s;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // Add beacon marker
      L.marker([lat, lng], { icon: beaconIcon }).addTo(map);

      // Draw simulated trail polyline route matching the contours
      const trailPoints = [
        [lat - 0.015, lng - 0.025],
        [lat - 0.008, lng - 0.012],
        [lat, lng],
        [lat + 0.005, lng + 0.01],
        [lat + 0.012, lng + 0.008]
      ];

      L.polyline(trailPoints, {
        color: "#34d399",
        weight: 3,
        dashArray: "6, 8",
        opacity: 0.85,
        lineJoin: "round"
      }).addTo(map);

      mapInstanceRef.current = map;

      // Force map to recalculate its dimensions to prevent gray tile loading bugs
      setTimeout(() => {
        if (active && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    };

    loadLeaflet();

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, name]);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full bg-zinc-950" />

      {/* Grid lines overlay for the tactical cockpit feel */}
      <div className="absolute inset-0 pointer-events-none z-10 border border-zinc-800/40 rounded-xl" />
    </div>
  );
}
