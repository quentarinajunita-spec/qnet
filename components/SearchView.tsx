"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "./AppShell";

type UserResult = {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string;
};

type PostResult = {
  id: number;
  publicId: string | null;
  content: string;
  createdAt: string;
  username: string;
};

export default function SearchView({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [users, setUsers] = useState<UserResult[] | null>(null);
  const [posts, setPosts] = useState<PostResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialQuery.trim()) {
      setUsers(null);
      setPosts(null);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(initialQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setPosts(data.posts ?? []);
      })
      .catch(() => {
        setUsers([]);
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, [initialQuery]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
  }

  return (
    <>
      <section className="card" style={{ padding: 20 }}>
        <form className="comment-form" onSubmit={handleSearch} style={{ marginTop: 0 }}>
          <input
            type="text"
            placeholder="Cari kreator, postingan, atau #hashtag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Cari</button>
        </form>
      </section>

      {loading && <div className="card loading-state">Mencari...</div>}

      {!loading && users !== null && posts !== null && (
        <>
          <section className="card" style={{ padding: "20px 0 0" }}>
            <h3 className="panel-title" style={{ padding: "0 20px" }}>Kreator</h3>
            {users.length === 0 ? (
              <p className="empty-state">Tidak ada kreator ditemukan.</p>
            ) : (
              users.map((u) => (
                <Link key={u.id} className="user-result" href={`/u/${u.username}`}>
                  <Avatar fullName={u.fullName} avatarUrl={u.avatarUrl} className="post-avatar" />
                  <div>
                    <div className="post-name">{u.fullName}</div>
                    <div className="post-sub">@{u.username}</div>
                  </div>
                </Link>
              ))
            )}
          </section>

          <section className="card" style={{ padding: "20px 0 0" }}>
            <h3 className="panel-title" style={{ padding: "0 20px" }}>Postingan</h3>
            {posts.length === 0 ? (
              <p className="empty-state">Tidak ada postingan ditemukan.</p>
            ) : (
              posts.map((p) => (
                <div key={p.id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
                  <Link href={`/u/${p.username}`} className="post-name">
                    @{p.username}
                  </Link>
                  {p.publicId ? (
                    <Link href={`/post/${p.publicId}`}>
                      <p className="post-caption">{p.content}</p>
                    </Link>
                  ) : (
                    <p className="post-caption">{p.content}</p>
                  )}
                </div>
              ))
            )}
          </section>
        </>
      )}

      {!loading && users === null && (
        <div className="card empty-state">
          <span className="emoji">🔍</span>
          Ketik kata kunci untuk mulai mencari.
        </div>
      )}
    </>
  );
}
