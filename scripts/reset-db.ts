import { createClient } from "@libsql/client";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });
config({ path: ".env" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  for (const table of [
    "post_hashtags",
    "hashtags",
    "comments",
    "likes",
    "posts",
    "follows",
    "users",
  ]) {
    await client.execute(`DELETE FROM ${table}`);
  }
  console.log("semua tabel dibersihkan");

  const hash = await bcrypt.hash("junet444", 10);
  await client.execute({
    sql: "INSERT INTO users (username, email, password_hash, full_name, bio, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: ["junet", "junet@qnet.id", hash, "Junet", "Halo, gua Junet!", Math.floor(Date.now() / 1000)],
  });
  console.log("user junet dibuat (password: junet444)");

  const check = await client.execute("SELECT id, username, full_name FROM users");
  console.log(check.rows);
}

main();
