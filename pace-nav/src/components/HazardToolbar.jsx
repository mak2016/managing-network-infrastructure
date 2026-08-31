const HAZARD_TYPES = [
  { type: "police", icon: "🚓", label: "Police" },
  { type: "hazard", icon: "⚠️", label: "Hazard" },
  { type: "crash", icon: "💥", label: "Crash" },
  { type: "camera", icon: "📷", label: "Speed camera" },
];

// Reports are drawn locally on the map only — no backend yet, per the brief
// ("don't build the hazard-report backend until the core map/speed loop
// works"), so nothing here is visible to other users.
export default function HazardToolbar({ onReport, disabled }) {
  return (
    <div className="hazard-toolbar">
      {HAZARD_TYPES.map(({ type, icon, label }) => (
        <button
          key={type}
          type="button"
          className="hazard-toolbar__btn"
          title={label}
          disabled={disabled}
          onClick={() => onReport(type)}
        >
          <span>{icon}</span>
        </button>
      ))}
    </div>
  );
}
