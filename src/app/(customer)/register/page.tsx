import { redirect } from "next/navigation";
import { currentSession } from "@/server/auth/session";
import { safeReturnPath } from "@/server/auth/input";
import { AuthForm } from "@/components/auth/auth-form";
import "../auth.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Daftar | TOPUPLAB",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const returnTo = safeReturnPath((await searchParams).returnTo);
  if (await currentSession()) redirect(returnTo);
  return (
    <div className="auth-layout">
      <div className="auth-intro">
        <span className="auth-kicker">AKUN TOPUPLAB</span>
        <h1>Buat akun, lanjut jelajah.</h1>
        <p>
          Simpan identitas akun untuk layanan yang akan tersedia nanti. Belanja
          sebagai tamu tetap direncanakan.
        </p>
        <p>
          Alamat email belum diverifikasi; jangan gunakan akun ini untuk
          tindakan sensitif.
        </p>
      </div>
      <AuthForm mode="register" returnTo={returnTo} />
    </div>
  );
}
