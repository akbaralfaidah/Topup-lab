export function LoadingState() {
  return (
    <div className="state-content" role="status" aria-live="polite">
      <p>Memuat halaman…</p>
      <div className="skeleton skeleton-title" aria-hidden="true" />
      <div className="skeleton skeleton-line" aria-hidden="true" />
    </div>
  );
}
