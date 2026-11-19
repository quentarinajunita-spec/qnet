import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { registerSchema } from "@/lib/validation";
import { createSession } from "@/lib/auth";
import { eq, or } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }
    const { username, email, password, fullName } = parsed.data;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email)));
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Username atau email sudah dipakai" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({ username, email, passwordHash, fullName })
      .returning({ id: users.id });

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("register error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
