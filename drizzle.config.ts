import type { Config } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
