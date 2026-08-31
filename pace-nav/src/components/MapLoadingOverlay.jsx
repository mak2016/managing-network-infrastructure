export default function MapLoadingOverlay({ loading }) {
  return (
    <div className={`map-loading${loading ? "" : " map-loading--hidden"}`} aria-hidden={!loading}>
      <div className="map-loading__spinner" />
      <span className="map-loading__text">Loading map…</span>
    </div>
  );
}
