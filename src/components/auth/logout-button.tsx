"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("logout");
      router.replace("/");
      router.refresh();
    } catch {
      setError("Belum bisa keluar. Coba lagi.");
      setPending(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        className="button"
        onClick={logout}
        disabled={pending}
      >
        {pending ? "Mengakhiri sesi…" : "Keluar"}
      </button>
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
    </div>
  );
}
