"use client";

import { MotionConfig } from "motion/react";
import { duration, easing } from "@/lib/motion/tokens";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: duration.normal, ease: easing.standard }}
    >
      {children}
    </MotionConfig>
  );
}
