import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, likes, comments, users } from "@/lib/schema";
import { postSchema, extractHashtags } from "@/lib/validation";
import { attachHashtags } from "@/lib/hashtags";
import { desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const likedByMe = (userId: number) =>
  sql<number>`(select count(*) from likes where likes.post_id = ${posts.id} and likes.user_id = ${userId})`;

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") ?? "foryou";

  const baseSelect = {
    id: posts.id,
    publicId: posts.publicId,
    content: posts.content,
    imageUrl: posts.imageUrl,
    createdAt: posts.createdAt,
    userId: users.id,
    username: users.username,
    fullName: users.fullName,
    avatarUrl: users.avatarUrl,
    likeCount: sql<number>`(select count(*) from likes where likes.post_id = ${posts.id})`,
    commentCount: sql<number>`(select count(*) from comments where comments.post_id = ${posts.id})`,
    likedByMe: likedByMe(userId),
  };

  let rows;
  if (tab === "following") {
    rows = await db
      .select(baseSelect)
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .innerJoin(
        sql`follows`,
        sql`follows.following_id = ${users.id} and follows.follower_id = ${userId}`
      )
      .orderBy(desc(posts.createdAt))
      .limit(50);
  } else if (tab === "popular") {
    rows = await db
      .select(baseSelect)
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(sql`(select count(*) from likes where likes.post_id = ${posts.id})`))
      .limit(50);
  } else {
    rows = await db
      .select(baseSelect)
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(50);
  }

  return NextResponse.json({ posts: rows });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const { content, imageUrl } = parsed.data;

    const [post] = await db
      .insert(posts)
      .values({
        userId,
        content,
        imageUrl: imageUrl ?? null,
        publicId: randomUUID(),
      })
      .returning({ id: posts.id, publicId: posts.publicId });

    await attachHashtags(post.id, extractHashtags(content));
    return NextResponse.json({ ok: true, postId: post.publicId });
  } catch (error) {
    console.error("create post error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
