"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { Check } from "lucide-react";

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`ui-input ${className}`} {...props} />;
}
export function Textarea({
  className = "",
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea className={`ui-input ui-textarea ${className}`} {...props} />
  );
}
export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`ui-input ui-select ${className}`} {...props} />;
}
export function FormMessage({
  tone = "neutral",
  children,
  id,
}: {
  tone?: "neutral" | "danger" | "success";
  children: ReactNode;
  id?: string;
}) {
  return (
    <p
      id={id}
      className={`ui-form-message tone-${tone}`}
      role={tone === "danger" ? "alert" : undefined}
    >
      {children}
    </p>
  );
}
type FieldControl = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};
export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: FieldControl) => ReactNode;
}) {
  const id = useId();
  const description = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="ui-field">
      <label htmlFor={id}>
        {label}
        {required && <span className="ui-required"> (wajib)</span>}
      </label>
      {children({
        id,
        "aria-describedby": description || undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {hint && <FormMessage id={`${id}-hint`}>{hint}</FormMessage>}
      {error && (
        <FormMessage tone="danger" id={`${id}-error`}>
          {error}
        </FormMessage>
      )}
    </div>
  );
}
export function Checkbox({
  label,
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: string }) {
  return (
    <label className={`ui-choice ${className}`}>
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}
export function Radio({
  label,
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: string }) {
  return (
    <label className={`ui-choice ${className}`}>
      <input type="radio" {...props} />
      <span>{label}</span>
    </label>
  );
}
export function Switch({
  label,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="ui-switch"
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="ui-switch-track" aria-hidden="true">
        <span>{checked && <Check size={12} />}</span>
      </span>
      <span>{label}</span>
    </button>
  );
}
