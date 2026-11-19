import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getLibsqlClient } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Post tidak valid" }, { status: 400 });
  }

  const client = getLibsqlClient();
  const postRow = await client.execute({
    sql: `select id from posts where public_id = ?`,
    args: [id],
  });
  if (postRow.rows.length === 0) {
    return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
  }
  const postId = Number(postRow.rows[0].id);

  try {
    const tx = await client.transaction("write");
    let liked: boolean;
    try {
      const existing = await tx.execute({
        sql: "SELECT post_id FROM likes WHERE user_id = ? AND post_id = ?",
        args: [userId, postId],
      });
      if (existing.rows.length > 0) {
        await tx.execute({
          sql: "DELETE FROM likes WHERE user_id = ? AND post_id = ?",
          args: [userId, postId],
        });
        liked = false;
      } else {
        await tx.execute({
          sql: "INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
          args: [userId, postId, Math.floor(Date.now() / 1000)],
        });
        liked = true;
      }
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }

    return NextResponse.json({ liked });
  } catch (error) {
    console.error("like error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
