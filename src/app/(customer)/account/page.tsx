import { redirect } from "next/navigation";
import { currentSession } from "@/server/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";
import "../auth.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Akun saya | TOPUPLAB",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await currentSession();
  if (!session) redirect("/login?returnTo=%2Faccount");
  return (
    <section className="account-page">
      <span className="auth-kicker">AKUN SAYA</span>
      <h1>Informasi akun</h1>
      <p>Data ini berasal dari akun dan keanggotaan yang tersimpan.</p>
      <dl>
        <div>
          <dt>Email</dt>
          <dd>{session.email}</dd>
        </div>
        <div>
          <dt>Keanggotaan</dt>
          <dd>{session.membership ?? "Belum ditetapkan"}</dd>
        </div>
        <div>
          <dt>Sesi</dt>
          <dd>
            Aktif hingga{" "}
            {new Intl.DateTimeFormat("id-ID", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Asia/Jakarta",
            }).format(session.expiresAt)}{" "}
            WIB
          </dd>
        </div>
      </dl>
      <LogoutButton />
    </section>
  );
}
