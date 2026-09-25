import { redirect } from "next/navigation";
import { currentSession } from "@/server/auth/session";
import { safeReturnPath } from "@/server/auth/input";
import { AuthForm } from "@/components/auth/auth-form";
import "../auth.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Masuk | TOPUPLAB",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
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
        <h1>Masuk ke akun Anda.</h1>
        <p>Lihat identitas dan status keanggotaan Anda di satu tempat.</p>
        <p>Jelajah produk tetap bisa tanpa akun.</p>
      </div>
      <AuthForm mode="login" returnTo={returnTo} />
    </div>
  );
}
