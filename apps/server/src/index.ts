import "dotenv/config";
import { serve } from "@hono/node-server";
import { showRoutes } from "hono/dev";
import { docs } from "@/lib/docs";
import { logger } from "@/lib/logger";
import { runMigrations } from "@/lib/migrate";
import { app } from "@/routers/main";

docs(app, process.env.ENABLE_DOCS === "true");
showRoutes(app, {
  colorize: true,
  // verbose: true,
});

// Only run migrations on startup when NOT in Lambda
// In Lambda, migrations are handled in handler.ts
if (!process.env.AWS_EXECUTION_ENV) {
  await runMigrations();

  serve(
    {
      fetch: app.fetch,
      port: Number.parseInt(process.env.PORT || "3000", 10),
    },
    (info) => {
      logger.info(`Server is running on http://localhost:${info.port}`);
      logger.info(`Server is running on http://localhost:${info.port}`);
    }
  );
}

export default app;
