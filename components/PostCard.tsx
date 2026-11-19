"use client";

import { useState, FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "./AppShell";
import type { SessionUser } from "./AppShell";
import type { FeedPost } from "./Feed";

export type CommentRow = {
  id: number;
  content: string;
  createdAt?: string;
  parentId: number | null;
  username: string;
  fullName: string;
  avatarUrl: string | null;
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function PostCard({
  post,
  currentUser,
  detail = false,
  initialComments = null,
}: {
  post: FeedPost;
  currentUser: SessionUser;
  detail?: boolean;
  initialComments?: CommentRow[] | null;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.likedByMe > 0);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likePop, setLikePop] = useState(false);
  const [showComments, setShowComments] = useState(detail);
  const [comments, setComments] = useState<CommentRow[] | null>(
    initialComments
  );
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [lightboxZoomed, setLightboxZoomed] = useState(false);

  const isOwner = post.userId === currentUser.id;
  const postUrl = `/post/${post.publicId ?? post.id}`;

  function buildTree(rows: CommentRow[]) {
    const roots: CommentRow[] = [];
    const byId = new Map<number, CommentRow & { replies: CommentRow[] }>();
    for (const r of rows) byId.set(r.id, { ...r, replies: [] });
    for (const r of byId.values()) {
      if (r.parentId !== null && byId.has(r.parentId)) {
        byId.get(r.parentId)!.replies.push(r);
      } else {
        roots.push(r);
      }
    }
    return roots;
  }

  async function handleLike() {
    if (busy) return;
    setBusy(true);
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
    if (!liked) {
      setLikePop(true);
      setTimeout(() => setLikePop(false), 400);
    }
    try {
      const res = await fetch(`/api/posts/${post.publicId ?? post.id}/like`, { method: "POST" });
      if (!res.ok) {
        setLiked((v) => !v);
        setLikeCount((c) => c + (liked ? 1 : -1));
        return;
      }
      const data = await res.json();
      setLiked(data.liked);
    } catch {
      setLiked((v) => !v);
      setLikeCount((c) => c + (liked ? 1 : -1));
    } finally {
      setBusy(false);
    }
  }

  async function loadComments() {
    const res = await fetch(`/api/posts/${post.publicId ?? post.id}/comments`);
    const data = await res.json();
    setComments(data.comments ?? []);
  }

  function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) loadComments();
  }

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.publicId ?? post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentText,
          parentId: replyTo?.id ?? null,
        }),
      });
      const data = await res.json();
      if (res.ok && !data.duplicate) {
        const newComment: CommentRow & { replies?: CommentRow[] } = {
          id: data.commentId ?? Date.now(),
          content: commentText.trim(),
          parentId: replyTo?.id ?? null,
          username: currentUser.username,
          fullName: currentUser.fullName,
          avatarUrl: currentUser.avatarUrl,
          replies: [],
        };
        if (replyTo) {
          setComments((prev) =>
            prev
              ? prev.map((c) =>
                  c.id === replyTo.id
                    ? {
                        ...c,
                        replies: [
                          ...((c as CommentRow & { replies?: CommentRow[] })
                            .replies ?? []),
                          newComment,
                        ],
                      }
                    : c
                )
              : [newComment]
          );
        } else {
          setComments((prev) => (prev ? [newComment, ...prev] : [newComment]));
        }
        setCommentText("");
        setReplyTo(null);
        setCommentCount((c) => c + 1);
      } else if (res.ok && data.duplicate) {
        setCommentText("");
        setReplyTo(null);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit() {
    if (!editText.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.publicId ?? post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.publicId ?? post.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleted(true);
        setTimeout(() => router.refresh(), 250);
      }
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  function renderComment(c: CommentRow & { replies?: CommentRow[] }, depth = 0) {
    return (
      <div key={c.id} className={`comment ${depth > 0 ? "comment-reply" : ""}`}>
        <Link href={`/u/${c.username}`}>
          <Avatar
            fullName={c.fullName}
            avatarUrl={c.avatarUrl}
            className="comment-avatar"
          />
        </Link>
        <div className="comment-body">
          <div className="comment-name">
            <Link href={`/u/${c.username}`}>@{c.username}</Link>
            {c.createdAt && (
              <span className="comment-time"> · {timeAgo(c.createdAt)}</span>
            )}
          </div>
          <div className="comment-text">{c.content}</div>
          <button
            className="comment-reply-btn"
            onClick={() => setReplyTo(c)}
          >
            Balas
          </button>
          {c.replies && c.replies.length > 0 && (
            <div className="comment-replies">
              {c.replies.map((r) => renderComment(r, depth + 1))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (deleted) {
    return (
      <article className="card post post-deleted">
        <p className="empty-state">Post dihapus.</p>
      </article>
    );
  }

  const commentTree = comments ? buildTree(comments) : null;

  return (
    <article className={`card post ${detail ? "post-detail" : ""}`}>
      <div className="post-header">
        <Link href={`/u/${post.username}`}>
          <Avatar
            fullName={post.fullName}
            avatarUrl={post.avatarUrl}
            className="post-avatar"
          />
        </Link>
        <div className="post-meta">
          <div className="post-name">
            <Link href={`/u/${post.username}`}>{post.fullName}</Link>
          </div>
          <div className="post-sub">
            @{post.username} · {timeAgo(post.createdAt)}
          </div>
        </div>
        {isOwner && (
          <button className="post-more" onClick={() => setMenuOpen((v) => !v)}>
            ⋯
          </button>
        )}
      </div>

      {menuOpen && (
        <div className="post-menu">
          <button
            onClick={() => {
              setEditing(true);
              setMenuOpen(false);
            }}
          >
            ✏️ Edit
          </button>
          <button
            className="danger"
            onClick={() => {
              setConfirmDelete(true);
              setMenuOpen(false);
            }}
          >
            🗑 Hapus
          </button>
        </div>
      )}

      {editing ? (
        <div className="post-edit">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div className="post-edit-actions">
            <button className="btn-ghost" onClick={() => setEditing(false)}>
              Batal
            </button>
            <button
              className="btn-primary"
              onClick={handleSaveEdit}
              disabled={busy || !editText.trim()}
            >
              {busy ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="post-caption">{post.content}</p>
          {post.imageUrl && (
            <div className="post-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt="post image"
                onClick={() => setLightbox(true)}
                className="post-image-clickable"
              />
            </div>
          )}
        </>
      )}

      <div className="post-stats">
        <button
          className={`stat ${liked ? "liked" : ""} ${likePop ? "like-pop" : ""}`}
          onClick={handleLike}
        >
          {liked ? "❤️" : "🤍"} {likeCount}
        </button>
        <Link className="stat" href={postUrl}>
          💬 {commentCount}
        </Link>
        {!detail && commentCount > 0 && (
          <button className="stat" onClick={toggleComments}>
            {showComments ? "Tutup" : "Lihat komentar"}
          </button>
        )}
      </div>

      {showComments && (
        <div className="comments-section">
          {commentTree === null ? (
            <p className="loading-state">Memuat komentar...</p>
          ) : commentTree.length === 0 ? (
            <p className="empty-state">Belum ada komentar.</p>
          ) : (
            commentTree.map((c) => renderComment(c))
          )}
          {replyTo && (
            <div className="replying-to">
              Membalas @{replyTo.username}
              <button onClick={() => setReplyTo(null)}>✕</button>
            </div>
          )}
          <form className="comment-form" onSubmit={handleComment}>
            <input
              type="text"
              placeholder={replyTo ? `Balas @${replyTo.username}...` : "Tulis komentar..."}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" disabled={busy || !commentText.trim()}>
              {busy ? "..." : "Kirim"}
            </button>
          </form>
        </div>
      )}

      {lightbox &&
        createPortal(
          <div
            className={`lightbox ${lightboxZoomed ? "zoomed" : ""}`}
            onClick={() => setLightbox(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl!}
              alt="post image full"
              className="lightbox-img"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxZoomed((v) => !v);
              }}
            />
            <button
              className="lightbox-close"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(false);
              }}
            >
              ✕
            </button>
          </div>,
          document.body
        )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Hapus postingan?</h3>
            <p>Postingan yang dihapus tidak bisa dikembalikan.</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>
                Batal
              </button>
              <button className="btn-danger" onClick={handleDelete} disabled={busy}>
                {busy ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
