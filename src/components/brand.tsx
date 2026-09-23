import type { SVGProps } from "react";

export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4 14h8v10h8v4H4V14ZM12 4h16v14h-8V8h-8V4Z" />
    </svg>
  );
}

export function Brand({ monochrome = false }: { monochrome?: boolean }) {
  return (
    <span className={`brand-lockup${monochrome ? " brand-mono" : ""}`}>
      <BrandMark />
      <span className="brand-name">
        TOPUP<span>LAB</span>
      </span>
    </span>
  );
}
