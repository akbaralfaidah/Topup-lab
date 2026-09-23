"use client";

import NextLink from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { useMotionPolicy } from "@/lib/motion/use-motion-policy";
import { distance } from "@/lib/motion/tokens";
import { Spinner } from "./feedback";

export type ButtonProps = HTMLMotionProps<"button"> & {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "small" | "normal" | "large";
  loading?: boolean;
  loadingLabel?: string;
};

export function Button({
  variant = "primary",
  size = "normal",
  loading = false,
  loadingLabel = "Memproses…",
  disabled,
  className = "",
  children,
  type = "button",
  ref,
  ...props
}: ButtonProps) {
  const { reduced, transition } = useMotionPolicy();
  return (
    <motion.button
      ref={ref}
      type={type}
      className={`ui-button ui-button-${variant} ui-button-${size} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileTap={
        reduced || disabled || loading || props["aria-haspopup"]
          ? undefined
          : { y: distance.press }
      }
      transition={transition}
      {...props}
    >
      {loading ? (
        <>
          <Spinner label={loadingLabel} />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}

export function IconButton({
  label,
  children,
  ...props
}: Omit<ButtonProps, "children"> & { label: string; children: ReactNode }) {
  return (
    <Button
      variant="tertiary"
      {...props}
      className={`ui-icon-button ${props.className ?? ""}`}
      aria-label={label}
    >
      {children}
    </Button>
  );
}

export function Link({
  className = "",
  ...props
}: ComponentProps<typeof NextLink>) {
  return <NextLink className={`ui-link ${className}`} {...props} />;
}
