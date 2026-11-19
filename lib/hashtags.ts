import { db } from "./db";
import { hashtags, postHashtags } from "./schema";
import { inArray } from "drizzle-orm";

export async function attachHashtags(postId: number, tags: string[]) {
  if (tags.length === 0) return;
  await db
    .insert(hashtags)
    .values(tags.map((tag) => ({ tag })))
    .onConflictDoNothing();
  const rows = await db
    .select({ id: hashtags.id })
    .from(hashtags)
    .where(inArray(hashtags.tag, tags));
  if (rows.length > 0) {
    await db
      .insert(postHashtags)
      .values(rows.map((row) => ({ postId, hashtagId: row.id })))
      .onConflictDoNothing();
  }
}
