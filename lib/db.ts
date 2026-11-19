import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";

let client: Client | null = null;

function getClient(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    client = createClient({ url, authToken });
  } else if (process.env.NEXT_PHASE === "phase-production-build") {
    client = createClient({ url: "file:local-build.db" });
  } else if (process.env.NODE_ENV === "production") {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Set it in Vercel project environment variables."
    );
  } else {
    client = createClient({ url: "file:local.db" });
  }
  return client;
}

export function getDb() {
  return drizzle(getClient(), { schema });
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export function getLibsqlClient() {
  return getClient();
}
