import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/authorization";
import {
  loadWorkspace,
  serializeWorkspace,
  workspaceIssues,
} from "@/server/pricing/workspace";
import { PricingWorkspace } from "@/components/pricing/pricing-workspace";
import "../../dev/admin/pricing/pricing.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Aturan harga | TOPUPLAB",
  robots: { index: false, follow: false },
};

export default async function AdminPricingPage() {
  if (!(await requirePermission("pricing.read"))) notFound();
  let view;
  let issues;
  try {
    const data = await loadWorkspace("admin");
    view = serializeWorkspace(data);
    issues = workspaceIssues(data);
  } catch {
    return (
      <main className="pricing-shell">
        <h1>Aturan harga belum tersedia</h1>
        <p>Periksa koneksi database lalu muat ulang halaman.</p>
      </main>
    );
  }
  return (
    <PricingWorkspace
      data={view}
      issues={issues}
      endpoint="/api/admin/pricing"
    />
  );
}
