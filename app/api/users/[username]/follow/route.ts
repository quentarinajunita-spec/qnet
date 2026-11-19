import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getLibsqlClient } from "@/lib/db";

type Params = { params: Promise<{ username: string }> };

export async function POST(
  _request: Request,
  { params }: Params
) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { username } = await params;

  const client = getLibsqlClient();
  const target = await client.execute({
    sql: "select id from users where username = ?",
    args: [username],
  });
  if (target.rows.length === 0) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }
  const targetId = Number(target.rows[0].id);
  if (targetId === userId) {
    return NextResponse.json(
      { error: "Tidak bisa follow diri sendiri" },
      { status: 400 }
    );
  }

  const tx = await client.transaction("write");
  let following: boolean;
  try {
    const existing = await tx.execute({
      sql: "select 1 from follows where follower_id = ? and following_id = ?",
      args: [userId, targetId],
    });
    if (existing.rows.length > 0) {
      await tx.execute({
        sql: "delete from follows where follower_id = ? and following_id = ?",
        args: [userId, targetId],
      });
      following = false;
    } else {
      await tx.execute({
        sql: "insert into follows (follower_id, following_id, created_at) values (?, ?, ?) on conflict do nothing",
        args: [userId, targetId, Math.floor(Date.now() / 1000)],
      });
      following = true;
    }
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }

  return NextResponse.json({ following });
}