import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const FALLBACK_CENTER = [-122.4194, 37.7749]; // San Francisco, used before a GPS fix arrives

const HAZARD_ICON = {
  police: "🚓",
  hazard: "⚠️",
  crash: "💥",
  camera: "📷",
};

export default function MapView({
  userPosition,
  headingDeg,
  route,
  destination,
  hazards,
  following,
  onMapClick,
  onUserDrag,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const hazardMarkersRef = useRef(new Map());

  // Create the map once.
  useEffect(() => {
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      center: FALLBACK_CENTER,
      zoom: 15,
      pitch: 45,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#3b82f6", "line-width": 6, "line-opacity": 0.85 },
      });
    });

    map.on("click", (e) => onMapClick?.([e.lngLat.lng, e.lngLat.lat]));
    map.on("dragstart", () => onUserDrag?.());

    const userEl = document.createElement("div");
    userEl.className = "user-puck";
    userEl.innerHTML = '<div class="user-puck__arrow"></div>';
    userMarkerRef.current = new Marker({ element: userEl, rotationAlignment: "map" });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move / show the user location puck, and (while following) keep the
  // camera centered on it and rotated to the direction of travel.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPosition) return;

    const marker = userMarkerRef.current;
    marker.setLngLat(userPosition);
    if (!marker.getElement().isConnected) marker.addTo(map);
    if (headingDeg != null) marker.setRotation(headingDeg);

    if (following) {
      map.easeTo({
        center: userPosition,
        bearing: headingDeg ?? map.getBearing(),
        duration: 400,
      });
    }
  }, [userPosition, headingDeg, following]);

  // Draw the route polyline.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource("route");
      if (!src) return;
      src.setData({
        type: "Feature",
        geometry: route ?? { type: "LineString", coordinates: [] },
      });
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [route]);

  // Destination marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!destination) {
      destMarkerRef.current?.remove();
      destMarkerRef.current = null;
      return;
    }

    if (!destMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "dest-pin";
      destMarkerRef.current = new Marker({ element: el, anchor: "bottom" });
    }
    destMarkerRef.current.setLngLat(destination).addTo(map);
  }, [destination]);

  // Hazard markers (local-only reports).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set();
    for (const h of hazards) {
      seen.add(h.id);
      if (hazardMarkersRef.current.has(h.id)) continue;
      const el = document.createElement("div");
      el.className = "hazard-pin";
      el.textContent = HAZARD_ICON[h.type] ?? "⚠️";
      const marker = new Marker({ element: el, anchor: "bottom" }).setLngLat(h.position).addTo(map);
      hazardMarkersRef.current.set(h.id, marker);
    }
    for (const [id, marker] of hazardMarkersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        hazardMarkersRef.current.delete(id);
      }
    }
  }, [hazards]);

  return <div ref={containerRef} className="map-view" />;
}
