import { useCallback, useEffect, useRef, useState } from "react";
import MapView from "./components/MapView";
import SpeedCluster from "./components/SpeedCluster";
import TurnBanner from "./components/TurnBanner";
import SearchBar from "./components/SearchBar";
import HazardToolbar from "./components/HazardToolbar";
import SpeedOverlay from "./components/SpeedOverlay";
import { useGeolocation } from "./hooks/useGeolocation";
import { fetchRoute } from "./lib/osrm";
import { fetchNearestSpeedLimit } from "./lib/overpass";
import { getSpeedTint } from "./lib/speedColor";
import { distanceMeters } from "./lib/geo";
import "./App.css";

const STEP_ADVANCE_M = 25; // close enough to a maneuver to consider it done
const SPEED_LIMIT_REQUERY_M = 120; // re-poll Overpass after moving this far
const SPEED_LIMIT_REQUERY_MS = 15000; // ...or after this much time, whichever first

export default function App() {
  const { position, speedMph, headingDeg, error: geoError } = useGeolocation();

  const [following, setFollowing] = useState(true);
  const [route, setRoute] = useState(null); // { geometry, steps, distance, duration }
  const [destination, setDestination] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [routeError, setRouteError] = useState(null);
  const [routing, setRouting] = useState(false);

  const [speedLimit, setSpeedLimit] = useState(null);
  const speedLimitQueryRef = useRef({ position: null, time: 0, inFlight: false });

  const [hazards, setHazards] = useState([]);

  const [mapError, setMapError] = useState(null);
  const lastMapErrorRef = useRef(null);
  const handleMapError = useCallback((detail) => {
    // Tile fetch failures can fire repeatedly for the same underlying cause;
    // only surface the first occurrence of a given message so the banner
    // doesn't thrash.
    if (lastMapErrorRef.current === detail) return;
    lastMapErrorRef.current = detail;
    setMapError(detail);
  }, []);

  // --- Destination selection -> OSRM route request -------------------------
  const requestRoute = useCallback(async (from, to) => {
    setRouting(true);
    setRouteError(null);
    try {
      const result = await fetchRoute(from, to);
      setRoute(result);
      setStepIndex(0);
    } catch (err) {
      setRouteError(err.message);
      setRoute(null);
    } finally {
      setRouting(false);
    }
  }, []);

  function handleSelectDestination(center) {
    setDestination(center);
    if (position) requestRoute(position, center);
  }

  function handleMapClick(lngLat) {
    handleSelectDestination(lngLat);
  }

  function handleClearRoute() {
    setRoute(null);
    setDestination(null);
    setRouteError(null);
    setStepIndex(0);
  }

  // --- Turn-by-turn progression ---------------------------------------------
  useEffect(() => {
    if (!route || !position) return;
    const step = route.steps[stepIndex];
    if (!step) return;
    const d = distanceMeters(position, step.location);
    if (d < STEP_ADVANCE_M && stepIndex < route.steps.length - 1) {
      setStepIndex((i) => i + 1);
    }
  }, [position, route, stepIndex]);

  // --- Live speed-limit lookup (Overpass), throttled by distance/time ------
  useEffect(() => {
    if (!position) return;
    const q = speedLimitQueryRef.current;
    const now = Date.now();
    const movedFar = !q.position || distanceMeters(position, q.position) >= SPEED_LIMIT_REQUERY_M;
    const dueForRefresh = now - q.time >= SPEED_LIMIT_REQUERY_MS;

    if (q.inFlight || !(movedFar || dueForRefresh)) return;

    q.inFlight = true;
    q.position = position;
    q.time = now;

    fetchNearestSpeedLimit(position)
      .then((limit) => setSpeedLimit(limit))
      .catch((err) => console.error("Overpass lookup failed:", err))
      .finally(() => {
        q.inFlight = false;
      });
  }, [position]);

  // --- Hazard reporting (local-only; see HazardToolbar) ---------------------
  function handleReport(type) {
    if (!position) return;
    setHazards((prev) => [...prev, { id: `${Date.now()}-${type}`, type, position }]);
  }

  const tint = getSpeedTint(speedMph, speedLimit?.limitMph ?? null);
  const currentStep = route?.steps[stepIndex] ?? null;
  const distanceToStepM = currentStep && position ? distanceMeters(position, currentStep.location) : null;

  return (
    <div className="app">
      <MapView
        userPosition={position}
        headingDeg={headingDeg}
        route={route?.geometry}
        destination={destination}
        hazards={hazards}
        following={following}
        onMapClick={handleMapClick}
        onUserDrag={() => setFollowing(false)}
        onMapError={handleMapError}
      />

      <SpeedOverlay tint={tint} />

      <div className="hud hud--top">
        <SearchBar
          userPosition={position}
          onSelectDestination={handleSelectDestination}
          onClear={handleClearRoute}
          hasRoute={Boolean(route)}
        />
        {currentStep && <TurnBanner step={currentStep} distanceToStepM={distanceToStepM} />}
      </div>

      <div className="hud hud--bottom">
        <HazardToolbar onReport={handleReport} disabled={!position} />
        <SpeedCluster speedMph={speedMph} limit={speedLimit} />
      </div>

      {!following && (
        <button className="recenter-btn" onClick={() => setFollowing(true)}>
          Recenter
        </button>
      )}

      {(geoError || routeError || routing || mapError) && (
        <div className="status-banner">
          {routing && "Finding route…"}
          {geoError && `GPS error: ${geoError}`}
          {routeError && `Routing error: ${routeError}`}
          {mapError && `Map error: ${mapError}`}
        </div>
      )}
    </div>
  );
}
