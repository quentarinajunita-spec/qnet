"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "./AppShell";
import type { SessionUser } from "./AppShell";

export default function Composer({
  user,
  onPosted,
}: {
  user: SessionUser;
  onPosted?: () => void;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function fakeProgress() {
    setUploadProgress(8);
    const timer = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 90) {
          clearInterval(timer);
          return 90;
        }
        return p + Math.random() * 15;
      });
    }, 180);
    return timer;
  }

  async function handleUpload(file: File) {
    setError("");
    setUploading(true);
    setUploadProgress(0);
    const timer = fakeProgress();
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal unggah gambar");
        return;
      }
      setUploadProgress(100);
      setTimeout(() => setImageUrl(data.url), 200);
    } catch {
      setError("Gagal unggah gambar");
    } finally {
      clearInterval(timer);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 400);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || uploading) return;
    setError("");
    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memposting");
        return;
      }
      setContent("");
      setImageUrl(null);
      onPosted?.();
      router.refresh();
    } catch {
      setError("Gagal memposting");
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="card composer">
      {error && <div className="login-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="composer-row">
          <Avatar fullName={user.fullName} avatarUrl={user.avatarUrl} className="avatar" />
          <textarea
            rows={2}
            placeholder="Share your creative moment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        {uploading && (
          <div className="upload-progress">
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="upload-progress-label">
              {Math.round(uploadProgress)}%
            </div>
          </div>
        )}
        {imageUrl && (
          <div className="composer-preview upload-fade-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="preview" />
            <button type="button" className="chip" onClick={() => setImageUrl(null)}>
              Hapus
            </button>
          </div>
        )}
        <div className="composer-actions">
          <button
            type="button"
            className="chip"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "Mengunggah..." : "Gambar"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            type="submit"
            className="chip post"
            disabled={posting || uploading || !content.trim()}
          >
            {posting ? "Memposting..." : "Posting"}
          </button>
        </div>
      </form>
    </section>
  );
}
