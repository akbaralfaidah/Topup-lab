import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/authorization";
import { AppError } from "@/server/http/errors";

export const dynamic = "force-dynamic";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    requireAdmin();
  } catch (error) {
    if (error instanceof AppError && error.code === "ACCESS_DENIED") notFound();
    throw error;
  }
  return (
    <div className="admin-shell">
      <aside aria-label="Administrasi">
        <span className="wordmark">TOPUPLAB</span>
        <p>Administrasi</p>
      </aside>
      <main id="main">{children}</main>
    </div>
  );
}
