import type { Transition, Variants } from "framer-motion";

// ── Spring presets (standardized on duration/bounce API) ──────────────────

export const springs = {
  /** Buttons, taps, micro-interactions */
  snappy: { type: "spring", duration: 0.3, bounce: 0.1 } as Transition,
  /** Cards, panels, general transitions */
  smooth: { type: "spring", duration: 0.4, bounce: 0.15 } as Transition,
  /** Celebrations, FAB pop-in, emphasis */
  bouncy: { type: "spring", duration: 0.5, bounce: 0.35 } as Transition,
  /** Bottom sheets, drawers */
  sheet: { type: "spring", duration: 0.45, bounce: 0.12 } as Transition,
} as const;

// ── Duration tiers ────────────────────────────────────────────────────────

export const durations = {
  /** Micro-interactions: tap feedback, toggle, count change */
  fast: 0.15,
  /** Standard transitions: fade, slide, toast */
  normal: 0.3,
  /** Emphasis: celebrations, large reveals */
  slow: 0.5,
} as const;

// ── Gesture presets ───────────────────────────────────────────────────────

/** Standard tap feedback — scale down to 95% */
export const tapScale = { scale: 0.95 } as const;

/** Emoji/reaction tap — scale up to 120% */
export const tapScaleUp = { scale: 1.2 } as const;

// ── Enter animation presets ───────────────────────────────────────────────

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
} as const;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
} as const;

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
} as const;

export const popIn = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
} as const;

// ── Toast / notification presets ──────────────────────────────────────────

export const toastSlideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
} as const;

// ── Sheet / overlay presets ───────────────────────────────────────────────

export const sheetSlideUp = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
} as const;

export const backdropFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

// ── List stagger variants ─────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: "easeOut" },
  },
};

// ── Wizard slide variants (bidirectional) ─────────────────────────────────

export const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

/** Standard wizard slide transition */
export const slideTransition: Transition = {
  duration: 0.25,
  ease: "easeInOut",
};

// ── Vote bar animation ────────────────────────────────────────────────────

export const voteBarTransition: Transition = {
  duration: 0.4,
  ease: "easeOut",
};

// ── Success pulse (vote confirmation, selection feedback) ─────────────────

export const successPulse = {
  animate: { scale: [1, 1.1, 1] as number[] },
  transition: { duration: durations.fast },
};
