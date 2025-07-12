#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * OpenAI-Compatible LLM Proxy API - Deno Version
 * 
 * A fully OpenAI-compatible LLM interface reverse proxy service
 * with API key validation, token pool management, and automatic UUID generation.
 */

import { Application } from "@oak/oak";
import { load } from "@std/dotenv";
import * as log from "@std/log";

import { config, reloadConfig } from "./src/core/config.ts";
import { createRoutes } from "./src/routes/index.ts";
import { errorHandler } from "./src/middleware/error.ts";
import { corsMiddleware } from "./src/middleware/cors.ts";
import { authMiddleware } from "./src/middleware/auth.ts";
import { loggingMiddleware } from "./src/middleware/logging.ts";
import { tokenManager } from "./src/services/tokenManager.ts";

// Load environment variables from both root and deno directory
try {
  // Try to load from root directory first
  await load({ envPath: "../.env", export: true, allowEmptyValues: true });
  console.log("Loaded .env from root directory");
} catch {
  try {
    // Fallback to deno directory
    await load({ envPath: ".env", export: true, allowEmptyValues: true });
    console.log("Loaded .env from deno directory");
  } catch {
    console.warn("No .env file found, using default configuration");
  }
}

// Reload config after environment variables are loaded
reloadConfig();

// Debug environment variables
console.log("🔍 Environment Variables Debug:");
console.log("TOKEN_POOL:", Deno.env.get("TOKEN_POOL"));
console.log("ORION_TOKEN:", Deno.env.get("ORION_TOKEN") ? "***SET***" : "NOT SET");
console.log("AUTO_CLEAN_CONVERSATIONS:", Deno.env.get("AUTO_CLEAN_CONVERSATIONS"));

// Configure logging
await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler(
      config.debug ? "DEBUG" : "INFO",
      {
        formatter: "{datetime} [{levelName}] {msg}",
      }
    ),
  },
  loggers: {
    default: {
      level: config.debug ? "DEBUG" : "INFO",
      handlers: ["console"],
    },
  },
});

const logger = log.getLogger();

async function createApp(): Promise<Application> {
  const app = new Application();

  // Global error handler
  app.use(errorHandler);

  // Logging middleware
  app.use(loggingMiddleware);

  // CORS middleware
  app.use(corsMiddleware);

  // Authentication middleware
  app.use(authMiddleware);

  // Routes
  const router = createRoutes();
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}

async function startServer() {
  try {
    logger.info("Starting OpenAI-compatible LLM Proxy API (Deno)...");
    
    // Initialize token manager
    await tokenManager.initialize();
    logger.info(`Token manager initialized with ${tokenManager.getPoolStatus().totalTokens} tokens`);
    logger.info(`Available models: ${config.availableModels.join(", ")}`);
    logger.info(`API key validation: ${config.requireApiKey ? "enabled" : "disabled"}`);

    const app = await createApp();

    logger.info(`Server starting on ${config.host}:${config.port}`);
    logger.info(`API documentation: http://${config.host}:${config.port}/docs`);
    logger.info(`Health check: http://${config.host}:${config.port}/health`);
    logger.info("Press Ctrl+C to stop the server");

    await app.listen({
      hostname: config.host,
      port: config.port,
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    Deno.exit(1);
  }
}

// Handle graceful shutdown
Deno.addSignalListener("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  Deno.exit(0);
});

Deno.addSignalListener("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  Deno.exit(0);
});

if (import.meta.main) {
  await startServer();
}

export { createApp };