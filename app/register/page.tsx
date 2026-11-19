"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal daftar. Coba lagi.");
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
          <h2>Buat akun baru</h2>
          <p>Mulai perjalanan kreatifmu di Q-net.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="regName">Nama Lengkap</label>
              <input
                type="text"
                id="regName"
                placeholder="Nama kamu"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="regUsername">Username</label>
              <input
                type="text"
                id="regUsername"
                placeholder="username_unik"
                required
                minLength={3}
                maxLength={20}
                pattern="[a-z0-9_]+"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
              />
            </div>
            <div className="field">
              <label htmlFor="regEmail">Email</label>
              <input
                type="email"
                id="regEmail"
                placeholder="nama@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="regPassword">Password</label>
              <input
                type="password"
                id="regPassword"
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <p className="login-signup">
            Sudah punya akun? <Link href="/login">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
