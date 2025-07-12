/**
 * Error handling middleware
 */

import { Context, Next } from "@oak/oak";
import * as log from "@std/log";
import { createErrorResponse } from "../models/schemas.ts";

const logger = log.getLogger();

export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    logger.error(`Unhandled error: ${error.message}`, error);

    // Set default error response
    ctx.response.status = error.status || 500;
    ctx.response.headers.set("Content-Type", "application/json");

    if (error.status === 404) {
      ctx.response.body = createErrorResponse(
        "The requested resource was not found.",
        "not_found_error"
      );
    } else if (error.status >= 400 && error.status < 500) {
      ctx.response.body = createErrorResponse(
        error.message || "Bad request",
        "invalid_request_error"
      );
    } else {
      ctx.response.body = createErrorResponse(
        "Internal server error",
        "internal_error"
      );
    }
  }
}