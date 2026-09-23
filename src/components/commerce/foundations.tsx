"use client";

import { useId, type ReactNode } from "react";
import { Check, Search } from "lucide-react";
import { motion } from "motion/react";
import { useMotionPolicy } from "@/lib/motion/use-motion-policy";
import { distance } from "@/lib/motion/tokens";
import { Button } from "@/components/ui/actions";
import { StatusBadge, type Tone } from "@/components/ui/feedback";
import { Input } from "@/components/ui/forms";

export function QuickSearchHero({
  query,
  onQueryChange,
  onSearch,
  children,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="commerce-search">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <label htmlFor={id}>Cari contoh produk</label>
        <div className="commerce-search-row">
          <Search size={20} aria-hidden="true" />
          <Input
            id={id}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Contoh: kredit demo"
          />
          <Button type="submit">Cari</Button>
        </div>
      </form>
      {children}
    </div>
  );
}
export function ProductCard({
  name,
  category,
  onSelect,
  artwork,
}: {
  name: string;
  category: string;
  onSelect: () => void;
  artwork?: ReactNode;
}) {
  const { reduced, transition } = useMotionPolicy();
  return (
    <motion.button
      className="commerce-product"
      type="button"
      onClick={onSelect}
      whileHover={reduced ? undefined : { y: -distance.small }}
      transition={transition}
    >
      <span className="commerce-product-art" aria-hidden="true">
        {artwork ?? (
          <span>
            Kredit
            <br />
            demo
          </span>
        )}
      </span>
      <strong>{name}</strong>
      <span>{category}</span>
    </motion.button>
  );
}
export function DenominationOption({
  name,
  value,
  label,
  price,
  selected,
  onSelect,
  disabled,
}: {
  name: string;
  value: string;
  label: string;
  price: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <label className={`commerce-denomination${selected ? " is-selected" : ""}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        disabled={disabled}
      />
      <span>
        <strong>{label}</strong>
        <span className="numeric">{price}</span>
      </span>
      {selected && <Check size={20} aria-hidden="true" />}
    </label>
  );
}
export function PaymentMethodRow({
  name,
  label,
  description,
  checked,
  onSelect,
  disabled,
}: {
  name: string;
  label: string;
  description: string;
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <label className="commerce-payment">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        disabled={disabled}
      />
      <span>
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
      {checked && <Check size={20} aria-hidden="true" />}
    </label>
  );
}
export function PriceBreakdown({
  lines,
  total,
}: {
  lines: { label: string; value: string }[];
  total: string;
}) {
  return (
    <dl className="commerce-breakdown">
      {lines.map((line) => (
        <div key={line.label}>
          <dt>{line.label}</dt>
          <dd className="numeric">{line.value}</dd>
        </div>
      ))}
      <div className="commerce-total">
        <dt>Total contoh</dt>
        <dd className="price numeric">{total}</dd>
      </div>
    </dl>
  );
}
export function SmartCheckoutBar({
  total,
  disabled,
  onAction,
}: {
  total: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  return (
    <div className="commerce-checkout-bar">
      <div>
        <span>Total contoh</span>
        <strong className="price numeric">{total}</strong>
      </div>
      <Button disabled={disabled} onClick={onAction}>
        Tinjau contoh
      </Button>
    </div>
  );
}
export function TransactionTimeline({
  steps,
}: {
  steps: {
    title: string;
    detail: string;
    state: "complete" | "current" | "upcoming";
  }[];
}) {
  return (
    <ol className="commerce-timeline">
      {steps.map((step, index) => (
        <li
          key={step.title}
          aria-current={step.state === "current" ? "step" : undefined}
          data-state={step.state}
        >
          <span className="timeline-marker" aria-hidden="true">
            {step.state === "complete" ? <Check size={16} /> : index + 1}
          </span>
          <div>
            <strong>{step.title}</strong>
            <p>{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
export function TierPriceCell({
  tier,
  price,
  selected,
}: {
  tier: string;
  price: string;
  selected?: boolean;
}) {
  return (
    <div className={`commerce-tier${selected ? " is-selected" : ""}`}>
      <span>
        {tier}
        {selected && " · Dipilih"}
      </span>
      <strong className="numeric">{price}</strong>
    </div>
  );
}
export function ProviderHealthIndicator({
  label,
  status,
  tone,
}: {
  label: string;
  status: string;
  tone: Tone;
}) {
  return (
    <div className="commerce-provider">
      <strong>{label}</strong>
      <StatusBadge tone={tone}>{status}</StatusBadge>
    </div>
  );
}
