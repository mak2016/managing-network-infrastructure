import { useEffect, useRef, useState } from "react";
import { mpsToMph } from "../lib/geo";

// Wraps navigator.geolocation.watchPosition. Requires HTTPS or localhost.
// Exposes position as [lon, lat] (GeoJSON/MapLibre order) plus speed in mph
// and heading in degrees, both nullable when the browser can't report them
// (e.g. stationary, or a device without a compass).
export function useGeolocation() {
  const [state, setState] = useState({
    position: null, // [lon, lat]
    accuracyM: null,
    speedMph: null,
    headingDeg: null,
    error: null,
    ready: false,
  });
  const lastHeading = useRef(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, error: "Geolocation is not supported by this browser." }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy, speed, heading } = pos.coords;
        if (heading != null && !Number.isNaN(heading)) lastHeading.current = heading;

        setState({
          position: [longitude, latitude],
          accuracyM: accuracy,
          speedMph: speed != null && !Number.isNaN(speed) ? Math.max(0, mpsToMph(speed)) : null,
          headingDeg: lastHeading.current,
          error: null,
          ready: true,
        });
      },
      (err) => {
        setState((s) => ({ ...s, error: err.message, ready: true }));
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
