import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import ProfileView from "@/components/ProfileView";
import PostCard from "@/components/PostCard";
import { db } from "@/lib/db";
import { users, posts, likes, comments, follows } from "@/lib/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!target) notFound();

  const [stats] = await db
    .select({
      postCount: sql<number>`(select count(*) from posts where posts.user_id = ${target.id})`,
      followerCount: sql<number>`(select count(*) from follows where follows.following_id = ${target.id})`,
      followingCount: sql<number>`(select count(*) from follows where follows.follower_id = ${target.id})`,
      isFollowing: sql<number>`(select count(*) from follows where follows.following_id = ${target.id} and follows.follower_id = ${currentUser.id})`,
    })
    .from(users)
    .where(eq(users.id, target.id))
    .limit(1);

  const userPosts = await db
    .select({
      id: posts.id,
      publicId: posts.publicId,
      content: posts.content,
      imageUrl: posts.imageUrl,
      createdAt: posts.createdAt,
      userId: users.id,
      username: users.username,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      likeCount: sql<number>`(select count(*) from likes where likes.post_id = ${posts.id})`,
      commentCount: sql<number>`(select count(*) from comments where comments.post_id = ${posts.id})`,
      likedByMe: sql<number>`(select count(*) from likes where likes.post_id = ${posts.id} and likes.user_id = ${currentUser.id})`,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.userId, target.id))
    .orderBy(desc(posts.createdAt))
    .limit(50);

  return (
    <AppShell user={currentUser}>
      <ProfileView
        user={{
          id: target.id,
          username: target.username,
          fullName: target.fullName,
          bio: target.bio,
          avatarUrl: target.avatarUrl,
          postCount: Number(stats?.postCount ?? 0),
          followerCount: Number(stats?.followerCount ?? 0),
          followingCount: Number(stats?.followingCount ?? 0),
          isOwner: target.id === currentUser.id,
          isFollowing: Number(stats?.isFollowing ?? 0) > 0,
        }}
      />
      {userPosts.map((post) => (
        <PostCard
          key={post.id}
          post={{ ...post, createdAt: post.createdAt.toISOString() }}
          currentUser={currentUser}
        />
      ))}
    </AppShell>
  );
}
