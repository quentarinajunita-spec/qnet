"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  bio: string;
  avatarUrl: string | null;
};

export function Avatar({
  fullName,
  avatarUrl,
  className,
}: {
  fullName: string;
  avatarUrl: string | null;
  className?: string;
}) {
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (avatarUrl) {
    return (
      <span className={className} style={{ overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </span>
    );
  }
  return <span className={className}>{initials}</span>;
}

const navItems = [
  { href: "/explore", label: "Explore", icon: "🏠" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="topbar">
        <Link className="logo" href="/explore">
          <span className="logo-mark">Q</span>
          <span className="logo-text">net</span>
        </Link>
        <form className="search" onSubmit={handleSearch}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search creators, projects, or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        <div className="topbar-actions">
          <button className="icon-btn" title="Keluar" onClick={handleLogout}>
            🚪
          </button>
          <Link href="/profile">
            <Avatar fullName={user.fullName} avatarUrl={user.avatarUrl} className="avatar" />
          </Link>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`nav-item ${pathname === item.href ? "active" : ""}`}
              href={item.href}
            >
              {item.icon} {item.label}
            </Link>
          ))}

          <div className="sidebar-section">Quick Links</div>
          <Link className="quick-link" href="/explore">
            📈 Explore Feed
          </Link>
          <Link className="quick-link" href="/profile">
            ⚙️ Edit Profile
          </Link>

          <div className="promo-card">
            <h4>Share your creativity with the world</h4>
            <Link href="/explore">Start Creating</Link>
          </div>
        </aside>

        <main className="feed">{children}</main>

        <aside className="right-panel">
          <section className="card panel-card">
            <h3 className="panel-title">Quick Links</h3>
            <Link className="panel-link" href="/explore">
              Explore Feed <span className="arrow">→</span>
            </Link>
            <Link className="panel-link" href="/search">
              Find Creators <span className="arrow">→</span>
            </Link>
            <Link className="panel-link" href="/profile">
              My Profile <span className="arrow">→</span>
            </Link>
          </section>

          <section className="card join-card">
            <div className="emoji">🌟</div>
            <h4>Join the Q-net Community!</h4>
            <p>Share your journey, inspire others.</p>
            <Link className="btn-primary" href="/explore">
              Join Now
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}

