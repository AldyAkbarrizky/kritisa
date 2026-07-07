import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalPool = globalThis as unknown as {
  __kritisaDrizzle?: ReturnType<typeof drizzle>;
};

function ensureVerifyFull(connectionString: string): string {
  const url = new URL(connectionString);
  const sslmode = url.searchParams.get("sslmode");
  if (
    !sslmode ||
    sslmode === "prefer" ||
    sslmode === "require" ||
    sslmode === "verify-ca"
  ) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

function getDb() {
  if (!globalPool.__kritisaDrizzle) {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) {
      throw new Error("DATABASE_URL belum dikonfigurasi di environment.");
    }

    const connectionString = ensureVerifyFull(rawUrl);

    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    globalPool.__kritisaDrizzle = drizzle(pool, { schema });
  }

  return globalPool.__kritisaDrizzle;
}

export const db = getDb();
export { schema };
