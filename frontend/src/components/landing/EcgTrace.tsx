/**
 * The landing page's signature motif: a heartbeat-monitor trace, echoing the "pulse of the
 * clinic" language in the hero copy. `pathLength="1"` normalizes the dash math so the draw-in
 * animation doesn't need a measured path length. Static (no animation) when the browser prefers
 * reduced motion — see globals for the media query gate on `.ecg-draw`.
 */
export function EcgTrace({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 60"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0,30 L60,30 L75,30 L85,8 L95,52 L105,14 L115,30 L140,30
           L200,30 L215,30 L225,8 L235,52 L245,14 L255,30 L280,30
           L340,30 L355,30 L365,8 L375,52 L385,14 L395,30 L420,30
           L480,30 L495,30 L505,8 L515,52 L525,14 L535,30 L600,30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        className="ecg-draw"
      />
    </svg>
  );
}
