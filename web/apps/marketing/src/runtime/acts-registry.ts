// Ordered registry of the 9 acts. Inert metadata only — ScrollStage imports the
// register*() fns explicitly (no barrels) and walks ACTS in this order.
export interface ActMeta {
  id: string;
  slug: string;
  /** Scroll length of the act's pinned/scrubbed region, in viewport heights. */
  scrubVh: number;
  /** Whether the act snaps into view. */
  snap: boolean;
  /** Accessible section title (also used for aria-label on the act region). */
  ariaTitle: string;
  /** Prebaked still shown at the act's entry (reduced-motion / LCP). */
  prebakedHero?: string;
  /** Prebaked still shown at the act's resolved/final state. */
  prebakedFinal?: string;
}

export const ACTS: ActMeta[] = [
  { id: "act0", slug: "boot", scrubVh: 100, snap: false, ariaTitle: "Boot" },
  {
    id: "act1",
    slug: "hero",
    scrubVh: 150,
    snap: true,
    ariaTitle: "Match the model to the task",
    prebakedHero: "/prebaked/act1-hero.svg",
    prebakedFinal: "/prebaked/act1-final.svg",
  },
  {
    id: "act2",
    slug: "problem",
    scrubVh: 150,
    snap: true,
    ariaTitle: "The cost of overkill",
    prebakedHero: "/prebaked/act2-overdense.svg",
  },
  { id: "act3", slug: "mechanism", scrubVh: 300, snap: true, ariaTitle: "How routing works" },
  {
    id: "act4",
    slug: "distribution",
    scrubVh: 150,
    snap: true,
    ariaTitle: "Where the turns go",
    prebakedHero: "/prebaked/act4-sorted.svg",
  },
  { id: "act5", slug: "proof", scrubVh: 150, snap: true, ariaTitle: "Measured savings" },
  {
    id: "act6",
    slug: "transparency",
    scrubVh: 120,
    snap: false,
    ariaTitle: "Every route is shown",
  },
  { id: "act7", slug: "byok", scrubVh: 120, snap: false, ariaTitle: "Bring your own keys" },
  { id: "act8", slug: "price", scrubVh: 120, snap: true, ariaTitle: "Connect your keys" },
];
