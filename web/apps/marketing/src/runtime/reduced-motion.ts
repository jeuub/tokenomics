// Inert helper: single source of truth for the reduced-motion query.
// No behavior beyond reading the media query (SSR-safe).
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
