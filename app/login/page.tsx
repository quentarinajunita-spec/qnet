"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal masuk. Coba lagi.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-view">
      <div className="login-brand">
        <div className="brand-logo">
          <span className="logo-mark">Q</span>
          <span className="logo-text">net</span>
        </div>
        <div className="brand-hero">
          <h1>Ruang karya digital untuk kreator.</h1>
          <p>
            Kumpulkan, simpan, dan pamerkan seluruh karya video, tutorial, dan
            desain dalam satu platform.
          </p>
          <div className="brand-points">
            <div className="brand-point">
              <span className="check">✓</span> Arsip karya tanpa batas
            </div>
            <div className="brand-point">
              <span className="check">✓</span> Portofolio siap dibagikan
            </div>
            <div className="brand-point">
              <span className="check">✓</span> Terhubung dengan kreator lain
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-box">
          <h2>Selamat datang kembali</h2>
          <p>Masuk untuk melanjutkan ke ruang karyamu.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="loginEmail">Email</label>
              <input
                type="email"
                id="loginEmail"
                placeholder="nama@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="loginPassword">Password</label>
              <input
                type="password"
                id="loginPassword"
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="login-signup">
            Belum punya akun? <Link href="/register">Daftar sekarang</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
