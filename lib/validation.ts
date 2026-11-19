import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-z0-9_]+$/, "Username hanya boleh huruf kecil, angka, dan underscore"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  fullName: z.string().min(1, "Nama lengkap wajib diisi").max(60),
});

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const postSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Postingan tidak boleh kosong")
    .max(500, "Postingan maksimal 500 karakter"),
  imageUrl: z.string().url().nullable().optional(),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, "Komentar tidak boleh kosong").max(300),
  parentId: z.number().int().nullable().optional(),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Nama wajib diisi").max(60),
  bio: z.string().trim().max(200, "Bio maksimal 200 karakter"),
  avatarUrl: z.string().url().nullable().optional(),
});

export function extractHashtags(content: string): string[] {
  const matches = content.match(/#([\p{L}\p{N}_]+)/gu) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}
