import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export const localDatabaseUrl = "postgresql://ielts:ielts@localhost:5432/ielts";

export function createDatabase(databaseUrl = process.env.DATABASE_URL ?? localDatabaseUrl) {
  const client = postgres(databaseUrl, { max: 10 });

  return {
    client,
    db: drizzle(client, { schema }),
  };
}
