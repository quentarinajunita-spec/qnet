import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, likes, comments, users, hashtags, postHashtags } from "@/lib/schema";
import { postSchema, extractHashtags } from "@/lib/validation";
import { attachHashtags } from "@/lib/hashtags";
import { and, eq, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const publicId = id;
  if (!/^[0-9a-f-]{36}$/i.test(publicId)) {
    return NextResponse.json({ error: "Post tidak valid" }, { status: 400 });
  }

  try {
    const rows = await db
      .select({
        id: posts.id,
        publicId: posts.publicId,
        userId: posts.userId,
        content: posts.content,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        username: users.username,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        likeCount: sql<number>`(select count(*) from ${likes} where ${likes.postId} = ${posts.id})`,
        commentCount: sql<number>`(select count(*) from ${comments} where ${comments.postId} = ${posts.id})`,
        likedByMe: sql<number>`(select count(*) from ${likes} where ${likes.postId} = ${posts.id} and ${likes.userId} = ${userId})`,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.publicId, publicId))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
    }

    const rowHashtags = await db
      .select({ tag: hashtags.tag })
      .from(postHashtags)
      .innerJoin(hashtags, eq(postHashtags.hashtagId, hashtags.id))
      .where(eq(postHashtags.postId, row.id));

    return NextResponse.json({
      post: { ...row, hashtags: rowHashtags.map((h) => h.tag) },
    });
  } catch (error) {
    console.error("get post error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const publicId = id;
  if (!/^[0-9a-f-]{36}$/i.test(publicId)) {
    return NextResponse.json({ error: "Post tidak valid" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const [post] = await db
      .select({ id: posts.id, userId: posts.userId })
      .from(posts)
      .where(eq(posts.publicId, publicId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
    }
    if (post.userId !== userId) {
      return NextResponse.json({ error: "Bukan postinganmu" }, { status: 403 });
    }

    await db
      .update(posts)
      .set({ content: parsed.data.content })
      .where(eq(posts.id, post.id));

    await db
      .delete(postHashtags)
      .where(eq(postHashtags.postId, post.id));
    await attachHashtags(post.id, extractHashtags(parsed.data.content));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("update post error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const publicId = id;
  if (!/^[0-9a-f-]{36}$/i.test(publicId)) {
    return NextResponse.json({ error: "Post tidak valid" }, { status: 400 });
  }

  try {
    const [post] = await db
      .select({ id: posts.id, userId: posts.userId })
      .from(posts)
      .where(eq(posts.publicId, publicId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
    }
    if (post.userId !== userId) {
      return NextResponse.json({ error: "Bukan postinganmu" }, { status: 403 });
    }

    await db.delete(posts).where(eq(posts.id, post.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("delete post error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
