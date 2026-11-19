"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "./AppShell";

export type ProfileData = {
  id: number;
  username: string;
  fullName: string;
  bio: string;
  avatarUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isOwner: boolean;
  isFollowing: boolean;
};

export default function ProfileView({ user }: { user: ProfileData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [bio, setBio] = useState(user.bio);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  const [followerCount, setFollowerCount] = useState(user.followerCount);
  const [followBusy, setFollowBusy] = useState(false);

  async function handleFollow() {
    if (followBusy) return;
    setFollowBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${user.username}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal follow user");
        return;
      }
      setIsFollowing(data.following);
      setFollowerCount((c) => c + (data.following ? 1 : -1));
    } catch {
      setError("Gagal follow user");
    } finally {
      setFollowBusy(false);
    }
  }

  async function handleUpload(file: File) {
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal unggah foto");
        return;
      }
      setAvatarUrl(data.url);
    } catch {
      setError("Gagal unggah foto");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, bio, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan profil");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Gagal menyimpan profil");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <section className="card profile-header">
        <h1 style={{ marginBottom: 16 }}>Edit Profil</h1>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSave}>
          <div className="field" style={{ textAlign: "left" }}>
            <label>Foto Profil</label>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
            {uploading && <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>Uploading...</p>}
          </div>
          <div className="field" style={{ textAlign: "left" }}>
            <label>Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ textAlign: "left" }}>
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              style={{
                width: "100%",
                padding: "13px 16px",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-sm)",
                fontSize: "14.5px",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={busy || uploading}>
              Simpan
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <>
      <section className="card profile-header">
        <div className="profile-avatar">
          <Avatar fullName={user.fullName} avatarUrl={user.avatarUrl} className="profile-avatar" />
        </div>
        <h1>{user.fullName}</h1>
        <div className="profile-username">@{user.username}</div>
        {user.bio && <p className="profile-bio">{user.bio}</p>}
        <div className="profile-stats">
          <div className="profile-stat">
            <strong>{user.postCount}</strong>
            <span>Posts</span>
          </div>
          <div className="profile-stat">
            <strong>{followerCount}</strong>
            <span>Followers</span>
          </div>
          <div className="profile-stat">
            <strong>{user.followingCount}</strong>
            <span>Following</span>
          </div>
        </div>
        {user.isOwner && (
          <button className="btn-ghost follow-btn" onClick={() => setEditing(true)}>
            Edit Profil
          </button>
        )}
        {!user.isOwner && (
          <button
            className={isFollowing ? "btn-ghost follow-btn" : "btn-primary follow-btn"}
            onClick={handleFollow}
            disabled={followBusy}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </section>
    </>
  );
}

