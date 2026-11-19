import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getLibsqlClient } from "@/lib/db";
import { commentSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Post tidak valid" }, { status: 400 });
  }

  const client = getLibsqlClient();
  const post = await client.execute({
    sql: `select id from posts where public_id = ?`,
    args: [id],
  });
  if (post.rows.length === 0) {
    return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
  }
  const postId = Number(post.rows[0].id);

  const result = await client.execute({
    sql: `select c.id, c.content, c.created_at, c.parent_id, u.username, u.full_name, u.avatar_url
          from comments c inner join users u on c.user_id = u.id
          where c.post_id = ? order by c.created_at asc`,
    args: [postId],
  });

  const rows = result.rows.map((r) => ({
    id: Number(r.id),
    content: String(r.content),
    createdAt: String(r.created_at),
    parentId: r.parent_id === null ? null : Number(r.parent_id),
    username: String(r.username),
    fullName: String(r.full_name),
    avatarUrl: r.avatar_url ? String(r.avatar_url) : null,
  }));

  return NextResponse.json({ comments: rows });
}

export async function POST(request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Post tidak valid" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }
    const content = parsed.data.content;
    const parentId =
      typeof body.parentId === "number" && Number.isInteger(body.parentId)
        ? body.parentId
        : null;

    const client = getLibsqlClient();
    const postRow = await client.execute({
      sql: `select id from posts where public_id = ?`,
      args: [id],
    });
    if (postRow.rows.length === 0) {
      return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
    }
    const postId = Number(postRow.rows[0].id);

    if (parentId !== null) {
      const parent = await client.execute({
        sql: "select id, post_id from comments where id = ?",
        args: [parentId],
      });
      if (
        parent.rows.length === 0 ||
        Number(parent.rows[0].post_id) !== postId
      ) {
        return NextResponse.json(
          { error: "Komentar induk tidak valid" },
          { status: 400 }
        );
      }
    }

    const tx = await client.transaction("write");
    let commentId: { duplicate: boolean; id: number };
    try {
      const dup = await tx.execute({
        sql: `select id from comments
              where user_id = ? and post_id = ? and content = ?
              and created_at > ?`,
        args: [userId, postId, content, Math.floor(Date.now() / 1000) - 5],
      });
      if (dup.rows.length > 0) {
        commentId = { duplicate: true, id: Number(dup.rows[0].id) };
      } else {
        const now = Math.floor(Date.now() / 1000);
        const inserted = await tx.execute({
          sql: "insert into comments (user_id, post_id, parent_id, content, created_at) values (?, ?, ?, ?, ?)",
          args: [userId, postId, parentId, content, now],
        });
        commentId = { duplicate: false, id: Number(inserted.lastInsertRowid) };
      }
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }

    return NextResponse.json({
      ok: true,
      commentId: commentId.id,
      duplicate: commentId.duplicate,
    });
  } catch (error) {
    console.error("comment error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
