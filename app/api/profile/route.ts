import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { profileSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({
        fullName: parsed.data.fullName,
        bio: parsed.data.bio,
        avatarUrl: parsed.data.avatarUrl ?? null,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("profile update error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
