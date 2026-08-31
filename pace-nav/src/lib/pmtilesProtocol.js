import { addProtocol } from "maplibre-gl";
import { Protocol } from "pmtiles";

// OpenFreeMap serves its vector tile data as PMTiles — a single archive
// fetched via HTTP byte-range requests under a custom "pmtiles://" URL
// scheme, not plain XYZ tile URLs. MapLibre GL JS doesn't understand that
// scheme unless a handler is registered for it, so without this the style
// and sprites load fine (ordinary https:// requests) but no actual map
// data (roads, water, buildings, labels) ever gets fetched — silently,
// since it never becomes a request MapLibre's error/network machinery
// sees at all. Must run before any Map is constructed.
const protocol = new Protocol();
addProtocol("pmtiles", protocol.tile);
