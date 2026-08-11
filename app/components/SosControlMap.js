"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export default function SosControlMap({ alerts, selectedAlertId, onSelectAlert }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    let active = true;

    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;

      // Remove previous map instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = {};
      }

      // Default center (Coimbatore / SECE coordinates if no alerts exist)
      let defaultCenter = [10.82804, 77.06054];
      if (alerts && alerts.length > 0) {
        // Center on the first active/newest alert
        const newestAlert = alerts[0];
        if (newestAlert.location && newestAlert.location.coordinates) {
          defaultCenter = [newestAlert.location.coordinates[1], newestAlert.location.coordinates[0]];
        }
      }

      // Initialize Leaflet Map
      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
      });

      // Load dark CartoDB tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
        subdomains: "abcd"
      }).addTo(map);

      // Render markers for all alerts
      alerts.forEach((alert) => {
        if (!alert.location || !alert.location.coordinates) return;
        const [lng, lat] = alert.location.coordinates;
        const status = alert.status || "ACTIVE";

        let beaconColor = "bg-rose-500";
        let shadowColor = "shadow-[0_0_12px_#f43f5e]";
        let pulseBg = "bg-rose-500/25";
        if (status === "ACKNOWLEDGED") {
          beaconColor = "bg-amber-500";
          shadowColor = "shadow-[0_0_12px_#f59e0b]";
          pulseBg = "bg-amber-500/25";
        } else if (status === "RESOLVED") {
          beaconColor = "bg-emerald-500";
          shadowColor = "shadow-[0_0_12px_#10b981]";
          pulseBg = "bg-emerald-500/25";
        }

        const markerIcon = L.divIcon({
          className: `custom-alert-icon-${alert.sosId}`,
          html: `
            <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer">
              <div class="w-4 h-4 rounded-full ${beaconColor} border-2 border-zinc-950 ${shadowColor} animate-pulse"></div>
              <div class="absolute w-8 h-8 rounded-full ${pulseBg} animate-ping" style="animation-duration: 2s;"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);

        // Bind informative popup
        const popupContent = `
          <div style="font-family: monospace; font-size: 10px; color: #1e293b; padding: 4px;">
            <strong style="color: ${status === "ACTIVE" ? "#e11d48" : status === "ACKNOWLEDGED" ? "#d97706" : "#059669"}">
              [${status}] SOS INCIDENT
            </strong><br/>
            ID: ${alert.sosId}<br/>
            SENDER: ${alert.senderDeviceId}<br/>
            HOPS: ${alert.hopCount}<br/>
            ALT: ${alert.altitude ? alert.altitude.toFixed(1) + 'm' : 'N/A'}<br/>
            GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}<br/>
            TIME: ${new Date(alert.timestamp).toLocaleTimeString()}
          </div>
        `;
        marker.bindPopup(popupContent);

        // Notify parent on click
        marker.on("click", () => {
          onSelectAlert?.(alert.sosId);
        });

        markersRef.current[alert.sosId] = marker;
      });

      mapInstanceRef.current = map;

      // Fit map bounds to show all markers if there are multiple
      if (alerts.length > 1) {
        const boundsPoints = alerts
          .filter(a => a.location && a.location.coordinates)
          .map(a => [a.location.coordinates[1], a.location.coordinates[0]]);
        map.fitBounds(L.latLngBounds(boundsPoints), { padding: [50, 50] });
      }

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
  }, [alerts]);

  // Handle programmatic selection and panning
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedAlertId) return;

    const activeAlert = alerts.find(a => a.sosId === selectedAlertId);
    if (activeAlert && activeAlert.location && activeAlert.location.coordinates) {
      const [lng, lat] = activeAlert.location.coordinates;
      mapInstanceRef.current.setView([lat, lng], 16, { animate: true });

      const marker = markersRef.current[selectedAlertId];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedAlertId, alerts]);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl">
      <div ref={mapRef} className="w-full h-full bg-zinc-950" />
      <div className="absolute inset-0 pointer-events-none z-10 border border-zinc-800/40 rounded-xl" />
    </div>
  );
}
