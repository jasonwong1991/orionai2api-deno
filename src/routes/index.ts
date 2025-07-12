/**
 * Route definitions and router setup
 */

import { Router } from "@oak/oak";
import { listModels, createChatCompletion } from "./v1.ts";
import { rootHandler, healthCheck, docsHandler } from "./system.ts";

export function createRoutes(): Router {
  const router = new Router();

  // System routes
  router.get("/", rootHandler);
  router.get("/health", healthCheck);
  router.get("/docs", docsHandler);

  // OpenAI compatible API routes
  router.get("/v1/models", listModels);
  router.post("/v1/chat/completions", createChatCompletion);

  return router;
}