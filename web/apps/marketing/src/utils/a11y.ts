// Small a11y helpers shared by act sections.

/** Stable id from an act id + suffix, for aria-labelledby wiring. */
export const headingId = (actId: string): string => `${actId}-title`;

/** Props to spell an ASCII field as an image to AT. */
export interface AsciiRoleImg {
  role: "img";
  "aria-label": string;
}
export const asciiImg = (label: string): AsciiRoleImg => ({
  role: "img",
  "aria-label": label,
});

/** The ambient substrate canvas is decorative; hide it from AT. */
export const SUBSTRATE_ARIA = { "aria-hidden": "true" } as const;
