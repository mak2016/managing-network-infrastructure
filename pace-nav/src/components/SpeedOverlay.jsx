export default function SpeedOverlay({ tint }) {
  const { rgb, alpha, pulse } = tint;
  const [r, g, b] = rgb;

  return (
    <div
      className={`speed-overlay${pulse ? " speed-overlay--pulse" : ""}`}
      style={{ backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})` }}
      aria-hidden="true"
    />
  );
}
