import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({
  url: process.env.DB_FILE_NAME || "local.db",
});

export const db = drizzle({ client });
