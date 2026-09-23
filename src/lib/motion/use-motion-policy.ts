"use client";

import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";
import { stateTransition } from "./transitions";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useMotionPolicy() {
  const preference = useReducedMotion();
  const hydrated = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  );
  const reduced = !hydrated || preference !== false;
  return { reduced, transition: stateTransition(reduced) };
}
