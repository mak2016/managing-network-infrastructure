// The signature "pace" overlay: tints the whole screen green -> orange -> red
// as the driver goes over the posted limit.
//
// The original prototype's exact updateVisuals() curve wasn't available in
// this build, so this reimplements the same shape from the brief's
// description: a few mph of grace before anything visibly shifts, then a
// smooth two-stage color ramp (green->orange, orange->red) with opacity
// climbing alongside it so the effect reads as "gently building," not a
// hard flip.
export const GRACE_MPH = 5; // no visible shift until this far over the limit
const RED_AT_MPH = 18; // fully red by this far over the limit
const PULSE_AT_MPH = 25; // flashes for emphasis once wildly over

const GREEN = [39, 174, 96];
const ORANGE = [243, 156, 18];
const RED = [192, 57, 43];

const lerp = (a, b, t) => a + (b - a) * t;
const lerpRgb = (c1, c2, t) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)));
const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);

// speedMph/limitMph -> { rgb: [r,g,b], alpha: 0..1, state, overMph, pulse }
export function getSpeedTint(speedMph, limitMph) {
  if (speedMph == null || limitMph == null) {
    return { rgb: GREEN, alpha: 0, state: "unknown", overMph: null, pulse: false };
  }

  const over = speedMph - limitMph;

  if (over <= GRACE_MPH) {
    // At or under the limit, and inside the grace buffer: calm, steady green.
    const t = easeInOutQuad(Math.max(0, over) / GRACE_MPH);
    return { rgb: GREEN, alpha: lerp(0.1, 0.18, t), state: "safe", overMph: over, pulse: false };
  }

  const t = Math.min(1, (over - GRACE_MPH) / (RED_AT_MPH - GRACE_MPH));
  const eased = easeInOutQuad(t);

  const rgb = t <= 0.5 ? lerpRgb(GREEN, ORANGE, eased / 0.5) : lerpRgb(ORANGE, RED, (eased - 0.5) / 0.5);
  const alpha = lerp(0.18, 0.6, eased);

  return {
    rgb,
    alpha,
    state: t < 0.5 ? "warn" : "danger",
    overMph: over,
    pulse: over >= PULSE_AT_MPH,
  };
}
