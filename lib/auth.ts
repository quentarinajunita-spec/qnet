import "server-only";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "cv_session";
const SESSION_DAYS = 7;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Copy .env.example to .env and fill it in.");
  }
  return secret;
}

export function signSession(userId: number): string {
  return jwt.sign({ userId }, getSecret(), {
    expiresIn: `${SESSION_DAYS}d`,
  });
}

export async function createSession(userId: number) {
  const token = signSession(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getSecret()) as { userId: number };
    return payload.userId;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (userId === null) return null;
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? null;
}
