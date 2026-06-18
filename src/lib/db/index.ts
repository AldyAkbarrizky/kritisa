import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalPool = globalThis as unknown as { __kritisaDrizzle?: ReturnType<typeof drizzle> };

function getDb() {
  if (!globalPool.__kritisaDrizzle) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL belum dikonfigurasi di environment.");
    }

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
