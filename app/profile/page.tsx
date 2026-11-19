import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import ProfileView from "@/components/ProfileView";
import { db } from "@/lib/db";
import { users, posts, follows } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [stats] = await db
    .select({
      postCount: sql<number>`(select count(*) from posts where posts.user_id = ${user.id})`,
      followerCount: sql<number>`(select count(*) from follows where follows.following_id = ${user.id})`,
      followingCount: sql<number>`(select count(*) from follows where follows.follower_id = ${user.id})`,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return (
    <AppShell user={user}>
      <ProfileView
        user={{
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          postCount: Number(stats?.postCount ?? 0),
          followerCount: Number(stats?.followerCount ?? 0),
          followingCount: Number(stats?.followingCount ?? 0),
          isOwner: true,
          isFollowing: false,
        }}
      />
    </AppShell>
  );
}

