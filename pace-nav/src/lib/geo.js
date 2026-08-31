const EARTH_RADIUS_M = 6371000;

export function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

// Haversine distance in meters between two [lon, lat] points.
export function distanceMeters([lon1, lat1], [lon2, lat2]) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Bearing in degrees (0-360) from point a to point b, both [lon, lat].
export function bearing([lon1, lat1], [lon2, lat2]) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Shortest distance in meters from point p to the segment [a, b] (all [lon, lat]).
// Uses an equirectangular local projection, accurate enough at street scale.
export function distanceToSegmentMeters(p, a, b) {
  const lat0 = toRad(a[1]);
  const project = ([lon, lat]) => [
    toRad(lon) * Math.cos(lat0) * EARTH_RADIUS_M,
    toRad(lat) * EARTH_RADIUS_M,
  ];
  const [px, py] = project(p);
  const [ax, ay] = project(a);
  const [bx, by] = project(b);

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Shortest distance in meters from point p to a polyline of [lon, lat] points.
export function distanceToLineMeters(p, line) {
  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    min = Math.min(min, distanceToSegmentMeters(p, line[i], line[i + 1]));
  }
  return min;
}

export const mpsToMph = (mps) => mps * 2.2369362921;
export const mpsToKmh = (mps) => mps * 3.6;
export const kmhToMph = (kmh) => kmh * 0.62137119;
