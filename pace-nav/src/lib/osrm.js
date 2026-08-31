const OSRM_BASE = "https://router.project-osrm.org";

// Turn an OSRM maneuver into a human-readable instruction.
// OSRM doesn't return prose instructions (that's a Mapbox-specific extension),
// so we synthesize one from maneuver.type/modifier + the way name.
function describeManeuver(step) {
  const { maneuver, name } = step;
  const road = name && name.length > 0 ? name : "the road";
  const modifier = maneuver.modifier;

  const turnWord = {
    left: "left",
    "slight left": "slightly left",
    "sharp left": "sharply left",
    right: "right",
    "slight right": "slightly right",
    "sharp right": "sharply right",
    straight: "straight",
    uturn: "a U-turn",
  }[modifier];

  switch (maneuver.type) {
    case "depart":
      return `Head ${modifier ? turnWord + " " : ""}on ${road}`;
    case "arrive":
      return "Arrive at your destination";
    case "roundabout":
    case "rotary":
      return `Enter the roundabout and take exit ${maneuver.exit ?? ""} onto ${road}`;
    case "merge":
      return `Merge ${turnWord ?? ""} onto ${road}`;
    case "fork":
      return `Keep ${turnWord ?? "straight"} at the fork onto ${road}`;
    case "on ramp":
      return `Take the ramp onto ${road}`;
    case "off ramp":
      return `Take the exit onto ${road}`;
    case "continue":
      return `Continue ${turnWord ?? "straight"} onto ${road}`;
    case "new name":
      return `Continue onto ${road}`;
    case "turn":
    default:
      return turnWord
        ? `Turn ${turnWord} onto ${road}`
        : `Continue onto ${road}`;
  }
}

// Request a driving route from OSRM's public demo server.
// from/to are [lon, lat]. Returns { geometry, steps, distance, duration } or throws.
export async function fetchRoute(from, to) {
  const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM request failed: ${res.status}`);
  const data = await res.json();

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(data.message || "No route found");
  }

  const route = data.routes[0];
  const leg = route.legs[0];

  const steps = leg.steps.map((step) => ({
    instruction: describeManeuver(step),
    type: step.maneuver.type,
    modifier: step.maneuver.modifier,
    name: step.name,
    distance: step.distance,
    duration: step.duration,
    location: step.maneuver.location, // [lon, lat]
  }));

  return {
    geometry: route.geometry, // GeoJSON LineString
    distance: route.distance, // meters
    duration: route.duration, // seconds
    steps,
  };
}
