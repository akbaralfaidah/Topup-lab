export const duration = {
  instant: 0.11,
  fast: 0.16,
  normal: 0.22,
  emphasized: 0.3,
} as const;
export const easing = {
  standard: [0.2, 0, 0, 1],
  enter: [0, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1],
  emphasized: [0.2, 0.8, 0.2, 1],
} as const;
export const distance = {
  press: 1,
  small: 4,
  normal: 8,
  emphasized: 12,
  maximum: 24,
} as const;
export const spring = {
  interactive: { type: "spring", duration: duration.fast, bounce: 0 },
  soft: { type: "spring", duration: duration.normal, bounce: 0.08 },
  sheet: { type: "spring", duration: duration.emphasized, bounce: 0 },
} as const;
