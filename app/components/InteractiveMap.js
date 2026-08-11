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

      // Initialize Leaflet Map centered on destination initially
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

      // Create SECE Emerald beacon icon
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

      // Add destination beacon marker
      L.marker([lat, lng], { icon: beaconIcon }).addTo(map).bindPopup(name || "Sri Eshwar College");

      mapInstanceRef.current = map;

      // Helper function to draw simulated fallback trail
      const drawSimulatedTrail = () => {
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
      };

      // Request user's current location dynamically
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            if (!active) return;
            const userLat = pos.coords.latitude;
            const userLng = pos.coords.longitude;

            // Create user location Cyan beacon icon
            const userIcon = L.divIcon({
              className: "custom-user-icon",
              html: `
                <div class="relative flex items-center justify-center w-6 h-6">
                  <div class="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-zinc-950 shadow-[0_0_12px_#22d3ee] animate-pulse"></div>
                  <div class="absolute w-8 h-8 rounded-full bg-cyan-400/25 animate-ping" style="animation-duration: 2.5s;"></div>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            // Add user marker
            L.marker([userLat, userLng], { icon: userIcon }).addTo(map).bindPopup("My Location").openPopup();

            // Fit map to show both markers
            const bounds = L.latLngBounds([[userLat, userLng], [lat, lng]]);
            map.fitBounds(bounds, { padding: [50, 50] });

            // Try fetching OSRM road routing
            try {
              const routeUrl = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${lng},${lat}?overview=full&geometries=geojson`;
              const res = await fetch(routeUrl);
              const data = await res.json();

              if (data.routes && data.routes.length > 0) {
                const routeCoordinates = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]); // Swap to [lat, lng]
                
                L.polyline(routeCoordinates, {
                  color: "#34d399",
                  weight: 4,
                  opacity: 0.85,
                  lineJoin: "round"
                }).addTo(map);
              } else {
                // Fallback direct line
                L.polyline([[userLat, userLng], [lat, lng]], {
                  color: "#34d399",
                  weight: 3,
                  dashArray: "6, 8",
                  opacity: 0.7
                }).addTo(map);
              }
            } catch (routeError) {
              console.error("OSRM Route fetching failed, drawing direct line fallback:", routeError);
              L.polyline([[userLat, userLng], [lat, lng]], {
                color: "#34d399",
                weight: 3,
                dashArray: "6, 8",
                opacity: 0.7
              }).addTo(map);
            }
          },
          (geoError) => {
            console.warn("Geolocation permission denied or timed out:", geoError);
            drawSimulatedTrail();
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      } else {
        drawSimulatedTrail();
      }

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
