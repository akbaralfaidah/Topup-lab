import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  requireAdminAccess,
  requireSession,
} from "@/server/auth/authorization";
import { safeReturnPath } from "@/server/auth/input";

export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (!session) {
    const path = safeReturnPath(
      (await headers()).get("x-pathname") ?? "/admin",
    );
    redirect(`/login?returnTo=${encodeURIComponent(path)}`);
  }
  if (!(await requireAdminAccess())) notFound();
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#main">
        Lewati ke konten
      </a>
      <aside aria-label="Administrasi" className="admin-rail">
        <Link href="/" className="wordmark">
          TOPUPLAB
        </Link>
        <p>Administrasi</p>
        <nav aria-label="Area admin">
          <Link href="/admin">Ringkasan</Link>
          <Link href="/admin/pricing">Aturan harga</Link>
          <Link href="/account">Akun saya</Link>
        </nav>
      </aside>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
