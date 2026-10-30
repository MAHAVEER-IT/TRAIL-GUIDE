"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";

export default function InteractiveMap({ lat, lng, name, sectorId }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayersRef = useRef({});
  const userMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [activeBasemap, setActiveBasemap] = useState("dark"); // "dark" | "satellite"
  const [userLocation, setUserLocation] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);

  // Determine GeoJSON data URL based on sector ID or coordinates
  const isSece = sectorId === "sri-eswar-college" || (lat > 10 && lat < 11);
  const geojsonUrl = isSece ? "/data/sec-campus.geojson" : "/data/sumatra-jungle.geojson";

  // Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let active = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      if (!active || !mapContainerRef.current) return;

      // Remove existing instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize Leaflet Map centered on destination
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: true,
      });

      // Add Zoom Controls bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Attribution
      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution('&copy; <span class="text-zinc-400">Esri Cartography & TrailGuide Vector</span>')
        .addTo(map);

      // 1. Free Esri Dark Gray Canvas (Base + Labels) - Zero API Key, Zero Watermark
      const darkBase = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, subdomains: ["server", "services"] }
      );
      const darkRef = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, pane: "shadowPane" }
      );
      const darkGroup = L.layerGroup([darkBase, darkRef]);

      // 2. Free Esri World Imagery (Satellite Reconnaissance)
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

      // Layer groups for vectors and routes
      const vectorGroup = L.layerGroup().addTo(map);
      const routeGroup = L.layerGroup().addTo(map);
      routeLayerRef.current = routeGroup;

      // Render Destination Beacon (Emerald Sonar Pin)
      const beaconIcon = L.divIcon({
        className: "custom-dest-beacon",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer" style="width: 44px; height: 44px;">
            <div class="absolute inset-0 rounded-full border border-emerald-400/40 animate-ping" style="animation-duration: 2.2s;"></div>
            <div class="relative z-10 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 flex items-center justify-center shadow-[0_0_14px_#10b981]">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
            <div class="absolute -bottom-4 font-mono font-bold tracking-widest text-[8px] px-1.5 py-0.2 rounded bg-slate-950/90 border border-emerald-500/30 text-emerald-300 shadow-md whitespace-nowrap z-20 pointer-events-none">
              ${isSece ? "SECE CAMPUS" : "SECTOR BASE"}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -20],
      });

      const destMarker = L.marker([lat, lng], { icon: beaconIcon }).addTo(map);
      destMarker.bindPopup(`
        <div style="font-family: monospace; padding: 6px; background: #080c14; border-radius: 6px; color: #e2e8f0;">
          <strong style="color: #34d399; font-size: 11px;">${name || "Sri Eshwar College"}</strong><br/>
          <span style="font-size: 8px; color: #94a3b8;">COORDINATES: ${lat.toFixed(5)}°, ${lng.toFixed(5)}°</span><br/>
          <span style="font-size: 8px; color: #10b981; font-weight: bold;">● SECTOR VECTOR MAP CACHED</span>
        </div>
      `);

      // Load Sector GeoJSON Vector Layer (Paths, Roads & Landmarks)
      try {
        const geoRes = await fetch(geojsonUrl);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (active && geoData && geoData.features) {
            L.geoJSON(geoData, {
              style: (feature) => {
                if (feature.geometry.type === "LineString") {
                  return {
                    color: "#10b981",
                    weight: 3.5,
                    opacity: 0.85,
                    dashArray: "4, 6",
                    lineCap: "round",
                    lineJoin: "round",
                  };
                }
                return {
                  color: "#059669",
                  weight: 2,
                  fillColor: "#10b981",
                  fillOpacity: 0.15,
                };
              },
              pointToLayer: (feature, latlng) => {
                const landmarkName = feature.properties?.name || "Campus Node";
                const category = feature.properties?.category || "landmark";

                let nodeColor = "#38bdf8"; // cyan default
                if (category === "gate" || category === "entrance") nodeColor = "#34d399";
                if (category === "dining" || category === "hostel") nodeColor = "#fbbf24";
                if (category === "medical") nodeColor = "#f43f5e";

                const nodeIcon = L.divIcon({
                  className: "custom-geojson-node",
                  html: `
                    <div class="relative flex items-center justify-center cursor-pointer group" style="width: 20px; height: 20px;">
                      <div class="w-2.5 h-2.5 rounded-full border border-slate-950 shadow-md" style="background-color: ${nodeColor}; box-shadow: 0 0 8px ${nodeColor};"></div>
                    </div>
                  `,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                });

                const nodeMarker = L.marker(latlng, { icon: nodeIcon });
                nodeMarker.bindTooltip(landmarkName, {
                  permanent: false,
                  direction: "top",
                  className: "tactical-tooltip",
                  offset: [0, -8],
                });
                return nodeMarker;
              },
            }).addTo(vectorGroup);
          }
        }
      } catch (err) {
        console.warn("Could not load local GeoJSON vector map:", err);
      }

      // Request User Geolocation (Optional live routing)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            if (!active) return;
            const userLat = pos.coords.latitude;
            const userLng = pos.coords.longitude;
            setUserLocation({ lat: userLat, lng: userLng });

            // User Location Cyan Beacon
            const userIcon = L.divIcon({
              className: "custom-user-icon",
              html: `
                <div class="relative flex items-center justify-center cursor-pointer" style="width: 40px; height: 40px;">
                  <div class="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping" style="animation-duration: 2.5s;"></div>
                  <div class="relative z-10 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-slate-950 flex items-center justify-center shadow-[0_0_12px_#22d3ee]">
                    <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  <div class="absolute -bottom-4 font-mono font-bold tracking-widest text-[8px] px-1.5 py-0.2 rounded bg-slate-950/90 border border-cyan-500/30 text-cyan-300 shadow-md whitespace-nowrap z-20 pointer-events-none">
                    MY LOCATION
                  </div>
                </div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
              popupAnchor: [0, -18],
            });

            const userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
            userMarker.bindPopup(`
              <div style="font-family: monospace; padding: 6px; background: #080c14; border-radius: 6px; color: #e2e8f0;">
                <strong style="color: #22d3ee; font-size: 11px;">CURRENT USER POSITION</strong><br/>
                <span style="font-size: 8px; color: #94a3b8;">GPS FIX: ${userLat.toFixed(5)}°, ${userLng.toFixed(5)}°</span>
              </div>
            `);
            userMarkerRef.current = userMarker;

            // Fit bounds to show both user and destination
            const bounds = L.latLngBounds([[userLat, userLng], [lat, lng]]);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });

            // Fetch OSRM Road Route
            try {
              const routeUrl = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${lng},${lat}?overview=full&geometries=geojson`;
              const res = await fetch(routeUrl);
              const data = await res.json();

              if (data.routes && data.routes.length > 0) {
                const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
                setRouteDistance(`${distanceKm} km`);

                const routeCoordinates = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                L.polyline(routeCoordinates, {
                  color: "#34d399",
                  weight: 4,
                  opacity: 0.9,
                  lineCap: "round",
                  lineJoin: "round",
                }).addTo(routeGroup);
              } else {
                // Fallback direct line
                L.polyline([[userLat, userLng], [lat, lng]], {
                  color: "#34d399",
                  weight: 3,
                  dashArray: "6, 8",
                  opacity: 0.7,
                }).addTo(routeGroup);
              }
            } catch (_) {
              // Direct connecting line fallback
              L.polyline([[userLat, userLng], [lat, lng]], {
                color: "#34d399",
                weight: 3,
                dashArray: "6, 8",
                opacity: 0.7,
              }).addTo(routeGroup);
            }
          },
          () => {
            // Geolocation not granted: keep center locked on destination campus
            map.setView([lat, lng], 16);
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      }

      mapInstanceRef.current = map;

      // Invalidate size to guarantee sharp tile rendering
      setTimeout(() => {
        if (active && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    };

    initMap();

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, name, geojsonUrl, isSece]);

  // Basemap Switcher Handler
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

  // Re-center on Destination Sector
  const centerOnDestination = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([lat, lng], 16, { duration: 1.2 });
  };

  // Re-center on User Location
  const centerOnUser = () => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    map.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 1.2 });
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl bg-[#06090e] select-none">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Crosshair Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none z-[400] border border-zinc-800/60 rounded-xl shadow-[inset_0_0_50px_rgba(3,7,18,0.7)]" />

      {/* Top Map HUD Controls: Basemap Switcher & Re-center */}
      <div className="absolute top-3 left-3 z-[500] flex flex-wrap items-center gap-2 pointer-events-auto">
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

        {/* Re-center Buttons */}
        <button
          onClick={centerOnDestination}
          className="font-mono text-[9px] px-2.5 py-1.5 rounded-lg bg-[#090d16]/90 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40 transition-all cursor-pointer font-semibold shadow-md flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          CENTER CAMPUS
        </button>

        {userLocation && (
          <button
            onClick={centerOnUser}
            className="font-mono text-[9px] px-2.5 py-1.5 rounded-lg bg-[#090d16]/90 backdrop-blur-md border border-slate-800 text-cyan-300 hover:bg-slate-900 transition-all cursor-pointer font-semibold shadow-md flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            MY LOCATION
          </button>
        )}
      </div>

      {/* Bottom Map HUD: Telemetry & Distance Tag */}
      <div className="absolute bottom-3 left-3 z-[500] pointer-events-none flex items-center gap-2.5 font-mono text-[9px] text-slate-400 bg-[#090d16]/90 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-lg shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-bold">SECTOR FIX:</span>
          <span>{lat.toFixed(5)}° N, {lng.toFixed(5)}° E</span>
        </div>
        {routeDistance && (
          <>
            <div className="h-3 w-px bg-slate-800" />
            <div className="text-cyan-300 font-bold">
              EST. ROUTE: {routeDistance}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
