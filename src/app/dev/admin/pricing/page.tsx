import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { localDemoPricingEnabled } from "@/server/pricing/demo-gate";
import {
  loadWorkspace,
  serializeWorkspace,
  workspaceIssues,
} from "@/server/pricing/workspace";
import { PricingWorkspace } from "@/components/pricing/pricing-workspace";
import "./pricing.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Ruang harga contoh | TOPUPLAB",
  robots: { index: false, follow: false },
};

export default async function PricingWorkspacePage() {
  const host = (await headers()).get("host")?.split(":")[0];
  if (
    !localDemoPricingEnabled() ||
    !host ||
    !["localhost", "127.0.0.1"].includes(host)
  )
    notFound();
  let view;
  let issues;
  try {
    const data = await loadWorkspace();
    view = serializeWorkspace(data);
    issues = workspaceIssues(data);
  } catch {
    return (
      <main className="pricing-shell">
        <h1>Ruang harga belum tersedia</h1>
        <p>Periksa database demo lokal lalu muat ulang halaman.</p>
      </main>
    );
  }
  return <PricingWorkspace data={view} issues={issues} />;
}
