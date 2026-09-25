"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export function AuthForm({
  mode,
  returnTo,
}: {
  mode: "login" | "register";
  returnTo: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const registration = mode === "register";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnTo }),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        setError(
          registration && result.error === "duplicate"
            ? "Email ini sudah terdaftar. Masuk dengan akun yang ada."
            : registration && result.error === "invalid"
              ? "Periksa email dan kata sandi. Gunakan minimal 12 karakter."
              : registration && result.error === "unavailable"
                ? "Pendaftaran sedang tidak tersedia. Coba lagi nanti."
                : "Email atau kata sandi tidak sesuai.",
        );
        return;
      }
      router.replace(result.returnTo);
      router.refresh();
    } catch {
      setError("Sambungan terputus. Coba lagi.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <div className="auth-field">
        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby={error ? "auth-error" : undefined}
        />
      </div>
      <div className="auth-field">
        <label htmlFor="auth-password">Kata sandi</label>
        <div className="auth-password-wrap">
          <input
            id="auth-password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete={registration ? "new-password" : "current-password"}
            required
            minLength={registration ? 12 : undefined}
            maxLength={256}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={
              error
                ? "auth-error"
                : registration
                  ? "auth-password-help"
                  : undefined
            }
          />
          <button
            type="button"
            aria-label={
              visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? (
              <EyeOff size={20} aria-hidden="true" />
            ) : (
              <Eye size={20} aria-hidden="true" />
            )}
          </button>
        </div>
        {registration && (
          <p id="auth-password-help">
            Minimal 12 karakter. Anda boleh menempelkan kata sandi dari
            pengelola kata sandi.
          </p>
        )}
      </div>
      {error && (
        <p className="auth-error" id="auth-error" role="alert">
          {error}
        </p>
      )}
      <button className="button auth-submit" type="submit" disabled={pending}>
        {pending ? "Memproses…" : registration ? "Buat akun" : "Masuk"}
      </button>
      <p className="auth-switch">
        {registration ? "Sudah punya akun? " : "Belum punya akun? "}
        <Link
          href={`${registration ? "/login" : "/register"}?returnTo=${encodeURIComponent(returnTo)}`}
        >
          {registration ? "Masuk" : "Daftar"}
        </Link>
      </p>
    </form>
  );
}
