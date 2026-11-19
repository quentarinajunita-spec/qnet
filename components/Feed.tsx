"use client";

import { useEffect, useState } from "react";
import Composer from "./Composer";
import PostCard from "./PostCard";
import type { SessionUser } from "./AppShell";

export type FeedPost = {
  id: number;
  publicId: string | null;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  userId: number;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe: number;
};

const tabs = [
  { key: "foryou", label: "For You" },
  { key: "following", label: "Following" },
  { key: "popular", label: "Popular" },
];

export default function Feed({ user }: { user: SessionUser }) {
  const [tab, setTab] = useState("foryou");
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setPosts(null);
    setError("");
    fetch(`/api/posts?tab=${tab}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal memuat feed");
        setPosts(data.posts);
      })
      .catch((e) => setError(e.message));
  }, [tab, refreshKey]);

  function handlePosted() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <>
      <section className="card hero">
        <h1>Welcome to Q-net!</h1>
        <p>Create. Share. Grow.</p>
      </section>

      <Composer user={user} onPosted={handlePosted} />

      <nav className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && <div className="card empty-state">⚠️ {error}</div>}
      {!error && posts === null && <div className="card loading-state">Memuat feed...</div>}
      {!error && posts !== null && posts.length === 0 && (
        <div className="card empty-state">
          <span className="emoji">🌱</span>
          Belum ada postingan di sini. Jadilah yang pertama berbagi karya!
        </div>
      )}
      {posts?.map((post) => (
        <PostCard key={post.id} post={post} currentUser={user} />
      ))}
    </>
  );
}
