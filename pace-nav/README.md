# Pace — navigation app

A Waze/Google Maps-style navigation web app: a real street map, live GPS
speed, and the signature feature — the screen tints green → orange → red as
you go over the posted speed limit.

Milestone 1 build: real map, live GPS speed, destination search with a
road-snapped route, turn-by-turn banner, live speed-limit lookups, the
speed-color overlay, and a local-only hazard toolbar.

## Stack (no paid accounts or API keys required)

- **Framework:** React + Vite
- **Map:** [MapLibre GL JS](https://maplibre.org/) over [OpenFreeMap](https://openfreemap.org/) tiles (`https://tiles.openfreemap.org/styles/liberty`)
- **Routing:** [OSRM demo server](http://project-osrm.org/) (`https://router.project-osrm.org`) — road-snapped routes + turn-by-turn steps
- **Speed limits:** [Overpass API](https://overpass-api.de/) — queries nearby ways for `maxspeed` as you move
- **Destination search:** [Nominatim](https://nominatim.openstreetmap.org/) geocoding (same OSM data family as the rest of the stack, free, keyless) — you can also just tap the map to set a destination
- **Device speed/position:** browser Geolocation API (`navigator.geolocation.watchPosition`)

All of the above are free demo/community services with no key management,
but they're rate-limited and **not meant for production traffic** — swap in
a self-hosted OSRM instance and a paid tile/routing provider before any real
deployment.

## Running it

```bash
npm install
npm run dev
```

Open the printed `localhost` URL in a real browser (not this session's
sandbox — the sandbox can't reach OpenFreeMap/OSRM/Overpass or use device
GPS). The Geolocation API requires **HTTPS or `localhost`**, which
`npm run dev` already serves over, so no certificate setup is needed.

On load, allow the location permission prompt. The map centers on your
position, your live GPS speed shows in the bottom-right cluster, and the
sign next to it shows the posted limit for the nearest tagged road (roads
Overpass has no `maxspeed` tag for show `--`). Search a destination (or tap
the map) to get a routed line and turn-by-turn banner. Driving over the
limit tints the screen — a few mph of grace before it visibly shifts, then
smoothly green → orange → red as the overage grows (see
`src/lib/speedColor.js`).

## Notes on this build

- The original prototype's `updateVisuals()` easing curve wasn't available
  in this environment, so `src/lib/speedColor.js` reimplements the same
  shape (grace buffer, then a smooth two-stage color/opacity ramp) from the
  brief's description rather than reusing exact prototype code.
- Hazard reports (police/hazard/crash/speed-camera) are drawn locally on the
  map only — there's no backend yet, so reports aren't visible to other
  users. That's the next milestone once the core map/speed loop is
  confirmed working.
- Traffic-colored routing isn't implemented — the OSRM demo server doesn't
  provide live traffic data, and it wasn't in this milestone's scope.
