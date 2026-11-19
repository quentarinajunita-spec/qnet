import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, posts } from "@/lib/schema";
import { or, like, sql, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ users: [], posts: [] });
  }
  const pattern = `%${q}%`;
  const hashtagPattern = `%#${q}%`;

  try {
    const [userRows, postRows] = await Promise.all([
      db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          bio: users.bio,
        })
        .from(users)
        .where(or(like(users.username, pattern), like(users.fullName, pattern)))
        .limit(10),
      db
        .select({
          id: posts.id,
          publicId: posts.publicId,
          content: posts.content,
          createdAt: posts.createdAt,
          username: sql<string>`(select username from users where users.id = ${posts.userId})`,
        })
        .from(posts)
        .where(or(like(posts.content, pattern), like(posts.content, hashtagPattern)))
        .orderBy(desc(posts.createdAt))
        .limit(10),
    ]);

    return NextResponse.json({ users: userRows, posts: postRows });
  } catch (error) {
    console.error("search error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
