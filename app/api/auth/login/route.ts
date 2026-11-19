import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { loginSchema } from "@/lib/validation";
import { createSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;

    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("login error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
