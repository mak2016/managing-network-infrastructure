const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Free-text destination search, backed by OSM's free geocoder (same data
// family as the Overpass/OSRM/OpenFreeMap stack, no key required).
// Optionally biased toward a [lon, lat] point.
export async function searchPlaces(query, near) {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "5",
  });
  if (near) {
    const [lon, lat] = near;
    const delta = 2; // degrees, loose viewbox bias toward current area
    params.set("viewbox", `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`);
    params.set("bounded", "0");
  }

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Nominatim request failed: ${res.status}`);
  const data = await res.json();

  return data.map((r) => ({
    label: r.display_name,
    center: [parseFloat(r.lon), parseFloat(r.lat)],
  }));
}
