import type { Transition } from "motion/react";
import { duration, easing } from "./tokens";

export function stateTransition(reduced: boolean): Transition {
  return { duration: reduced ? 0 : duration.normal, ease: easing.standard };
}
