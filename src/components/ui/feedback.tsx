import type { ComponentProps, ReactNode } from "react";
import { CheckCircle2, CircleAlert, Clock3, Info, XCircle } from "lucide-react";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";
const toneIcons = {
  neutral: Clock3,
  success: CheckCircle2,
  warning: CircleAlert,
  danger: XCircle,
  info: Info,
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return <span className={`ui-badge tone-${tone}`}>{children}</span>;
}
export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const Icon = toneIcons[tone];
  return (
    <span className={`ui-badge ui-status tone-${tone}`}>
      <Icon size={16} aria-hidden="true" />
      {children}
    </span>
  );
}
export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`ui-card ${className}`} {...props} />;
}
export function Divider() {
  return <hr className="ui-divider" />;
}
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`ui-skeleton ${className}`} />;
}
export function Spinner({ label = "Memuat…" }: { label?: string }) {
  return (
    <span className="ui-spinner" role="status">
      <span className="sr-only">{label}</span>
    </span>
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <label className="ui-progress">
      <span>
        {label}{" "}
        <span className="numeric">
          {Math.round(Math.max(0, Math.min(100, value)))}%
        </span>
      </span>
      <progress max={100} value={value}>
        {value}%
      </progress>
    </label>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="ui-empty">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Alert({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: Tone;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const Icon = toneIcons[tone];
  return (
    <div
      className={`ui-alert tone-${tone}`}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon size={20} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
        {action}
      </div>
    </div>
  );
}
