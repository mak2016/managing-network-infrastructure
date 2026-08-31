const ARROWS = {
  left: "⬅️",
  "slight left": "↖️",
  "sharp left": "⬅️",
  right: "➡️",
  "slight right": "↗️",
  "sharp right": "➡️",
  straight: "⬆️",
  uturn: "↩️",
};

function formatDistance(meters) {
  if (meters == null) return "";
  if (meters < 30) return "now";
  if (meters < 300) return `${Math.round(meters / 10) * 10} ft`;
  const miles = meters / 1609.34;
  return miles < 0.2 ? `${Math.round(meters)} m` : `${miles.toFixed(1)} mi`;
}

export default function TurnBanner({ step, distanceToStepM }) {
  if (!step) return null;

  const arrow = ARROWS[step.modifier] ?? "⬆️";

  return (
    <div className="turn-banner">
      <span className="turn-banner__arrow">{arrow}</span>
      <div className="turn-banner__text">
        <span className="turn-banner__distance">{formatDistance(distanceToStepM)}</span>
        <span className="turn-banner__instruction">{step.instruction}</span>
      </div>
    </div>
  );
}
