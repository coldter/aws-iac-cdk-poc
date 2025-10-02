import path from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "@/db";
import { logger } from "@/lib/logger";

export async function runMigrations() {
  const start = Date.now();

  await migrate(db, {
    // AWS_EXECUTION_ENV is set when running in Lambda
    migrationsFolder: process.env.AWS_EXECUTION_ENV
      ? path.join(import.meta.dirname, "db", "migrations")
      : path.join(import.meta.dirname, "..", "db", "migrations"),
  });

  const end = Date.now();

  logger.info(`Migrations completed in ${end - start}ms`);
}
