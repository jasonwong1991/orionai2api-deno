/**
 * Authentication middleware
 */

import { Context, Next } from "@oak/oak";
import * as log from "@std/log";
import { config } from "../core/config.ts";
import { createErrorResponse } from "../models/schemas.ts";

const logger = log.getLogger();

// Paths that don't require API key authentication
const EXEMPT_PATHS = ["/", "/health", "/docs"];

export async function authMiddleware(ctx: Context, next: Next) {
  const { pathname } = ctx.request.url;

  // Skip authentication for exempt paths
  if (EXEMPT_PATHS.includes(pathname)) {
    await next();
    return;
  }

  // Skip authentication if not required
  if (!config.requireApiKey) {
    await next();
    return;
  }

  // Extract API key from various sources
  const apiKey = extractApiKey(ctx);

  if (!apiKey) {
    logger.warning(`API key missing for request to ${pathname}`);
    ctx.response.status = 401;
    ctx.response.body = createErrorResponse(
      "API key required. Please provide a valid API key.",
      "authentication_error"
    );
    return;
  }

  // Validate API key
  if (!config.apiKeys.includes(apiKey)) {
    logger.warning(`Invalid API key for request to ${pathname}: ${apiKey.slice(0, 10)}...`);
    ctx.response.status = 401;
    ctx.response.body = createErrorResponse(
      "Invalid API key provided.",
      "authentication_error"
    );
    return;
  }

  logger.debug(`Valid API key provided for ${pathname}`);
  await next();
}

function extractApiKey(ctx: Context): string | null {
  // 1. Check Authorization header (Bearer token)
  const authHeader = ctx.request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // 2. Check custom headers
  const customHeaders = ["x-api-key", "api-key"];
  for (const header of customHeaders) {
    const value = ctx.request.headers.get(header);
    if (value) return value;
  }

  // 3. Check query parameters
  const url = new URL(ctx.request.url);
  const queryApiKey = url.searchParams.get("api_key");
  if (queryApiKey) return queryApiKey;

  return null;
}