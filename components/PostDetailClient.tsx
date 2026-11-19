"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import type { SessionUser } from "@/components/AppShell";
import type { FeedPost } from "@/components/Feed";
import type { CommentRow } from "@/components/PostCard";

export default function PostDetailClient({ user }: { user: SessionUser }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<CommentRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal memuat post");
        setPost(data.post as FeedPost);
      })
      .catch((e) => setError(e.message));

    fetch(`/api/posts/${id}/comments`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setComments(data.comments ?? []);
      })
      .catch(() => setComments([]));
  }, [id]);

  if (error) {
    return (
      <div className="card empty-state">
        <span className="emoji">🔍</span>
        {error}
        <div style={{ marginTop: 12 }}>
          <Link href="/explore" className="btn-ghost">
            Kembali ke Explore
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return <div className="card loading-state">Memuat post...</div>;
  }

  return (
    <>
      <button className="btn-ghost back-btn" onClick={() => router.back()}>
        ← Kembali
      </button>
      <PostCard post={post} currentUser={user} detail initialComments={comments} />
    </>
  );
}
