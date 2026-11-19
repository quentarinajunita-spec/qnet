import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashtags, postHashtags, posts } from "@/lib/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        tag: hashtags.tag,
        count: sql<number>`count(${postHashtags.postId})`,
      })
      .from(hashtags)
      .innerJoin(postHashtags, eq(postHashtags.hashtagId, hashtags.id))
      .groupBy(hashtags.id, hashtags.tag)
      .orderBy(desc(sql`count(${postHashtags.postId})`))
      .limit(5);
    return NextResponse.json({ trends: rows });
  } catch (error) {
    console.error("trending error", error);
    return NextResponse.json({ trends: [] });
  }
}
