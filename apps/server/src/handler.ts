import type { LambdaContext, LambdaEvent } from "hono/aws-lambda";
import { handle } from "hono/aws-lambda";
import { docs } from "@/lib/docs";
import { logger } from "@/lib/logger";
import { runMigrations } from "@/lib/migrate";
import { app } from "@/routers/main";

docs(app, process.env.ENABLE_DOCS === "true");

let initialized = false;
let initError: Error | null = null;

async function initialize() {
  try {
    logger.info("Initializing Lambda function...");
    await runMigrations();
    initialized = true;
    logger.info("Lambda function initialized successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to initialize Lambda function:", errorMessage);
    initError = new Error(`Initialization failed: ${errorMessage}`);
    throw initError;
  }
}

export const handler = async (event: LambdaEvent, context: LambdaContext) => {
  try {
    if (!initialized && initError === null) {
      // Initialize on first request
      await initialize();
    }

    if (initError) {
      // If initialization previously failed, return error
      logger.error("Lambda function not initialized:", initError.message);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Service Unavailable",
          message: "Failed to initialize application",
          details: initError.message,
        }),
      };
    }

    // Handle the request
    return await handle(app)(event, context);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Handler error:", errorMessage);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: errorMessage,
      }),
    };
  }
};
