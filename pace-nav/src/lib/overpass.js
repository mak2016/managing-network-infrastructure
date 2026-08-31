import { distanceToLineMeters, kmhToMph } from "./geo";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const QUERY_RADIUS_M = 60;

// Parse an OSM maxspeed tag into mph. Handles plain numbers (assumed km/h,
// the OSM default when no unit is given), "50 mph", "national", etc.
function parseMaxspeedMph(raw) {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();

  const mphMatch = trimmed.match(/^(\d+(\.\d+)?)\s*mph$/);
  if (mphMatch) return Math.round(parseFloat(mphMatch[1]));

  const kmhMatch = trimmed.match(/^(\d+(\.\d+)?)\s*(km\/h)?$/);
  if (kmhMatch) return Math.round(kmhToMph(parseFloat(kmhMatch[1])));

  // "national", "walk", "none", zone-based values, etc. — not a fixed number.
  return null;
}

// Fetch highway ways with a maxspeed tag near [lon, lat] and return the one
// closest to the point, i.e. the road the driver is most likely on.
export async function fetchNearestSpeedLimit([lon, lat]) {
  const query = `
    [out:json][timeout:10];
    way(around:${QUERY_RADIUS_M},${lat},${lon})["highway"]["maxspeed"];
    out geom;
  `;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!res.ok) throw new Error(`Overpass request failed: ${res.status}`);
  const data = await res.json();

  let best = null;
  let bestDist = Infinity;

  for (const el of data.elements ?? []) {
    if (el.type !== "way" || !el.geometry) continue;
    const mph = parseMaxspeedMph(el.tags?.maxspeed);
    if (mph == null) continue;

    const line = el.geometry.map((pt) => [pt.lon, pt.lat]);
    const dist = distanceToLineMeters([lon, lat], line);
    if (dist < bestDist) {
      bestDist = dist;
      best = {
        limitMph: mph,
        roadName: el.tags?.name ?? el.tags?.ref ?? null,
        wayId: el.id,
        distanceM: dist,
      };
    }
  }

  return best; // null if nothing tagged nearby
}
