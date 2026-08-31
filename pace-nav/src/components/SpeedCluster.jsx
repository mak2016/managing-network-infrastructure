export default function SpeedCluster({ speedMph, limit }) {
  const speedLabel = speedMph == null ? "--" : Math.round(speedMph);

  return (
    <div className="speed-cluster">
      <div className="speed-cluster__you">
        <span className="speed-cluster__value">{speedLabel}</span>
        <span className="speed-cluster__unit">mph</span>
      </div>

      <div className="speed-limit-sign" title={limit?.roadName ?? undefined}>
        <span className="speed-limit-sign__label">SPEED</span>
        <span className="speed-limit-sign__label">LIMIT</span>
        <span className="speed-limit-sign__value">{limit ? limit.limitMph : "--"}</span>
      </div>
    </div>
  );
}
