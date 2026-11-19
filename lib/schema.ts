import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    bio: text("bio").default("").notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_username_unique").on(table.username),
    uniqueIndex("users_email_unique").on(table.email),
  ]
);

export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    publicId: text("public_id"),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("posts_user_idx").on(table.userId),
    uniqueIndex("posts_public_id_unique").on(table.publicId),
  ]
);

export const likes = sqliteTable(
  "likes",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.postId] }),
    index("likes_post_idx").on(table.postId),
  ]
);

export const comments = sqliteTable(
  "comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    parentId: integer("parent_id"),
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("comments_post_idx").on(table.postId),
    index("comments_parent_idx").on(table.parentId),
  ]
);

export const follows = sqliteTable(
  "follows",
  {
    followerId: integer("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: integer("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followingId] }),
    index("follows_following_idx").on(table.followingId),
  ]
);

export const hashtags = sqliteTable(
  "hashtags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tag: text("tag").notNull(),
  },
  (table) => [uniqueIndex("hashtags_tag_unique").on(table.tag)]
);

export const postHashtags = sqliteTable(
  "post_hashtags",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    hashtagId: integer("hashtag_id")
      .notNull()
      .references(() => hashtags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.hashtagId] }),
    index("post_hashtags_hashtag_idx").on(table.hashtagId),
  ]
);

export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
