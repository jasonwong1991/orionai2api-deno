/**
 * Logging middleware
 */

import { Context, Next } from "@oak/oak";
import * as log from "@std/log";

const logger = log.getLogger();

export async function loggingMiddleware(ctx: Context, next: Next) {
  const start = Date.now();
  const { method, url } = ctx.request;

  logger.info(`--> ${method} ${url.pathname}${url.search}`);

  await next();

  const duration = Date.now() - start;
  const { status } = ctx.response;

  logger.info(`<-- ${method} ${url.pathname} ${status} ${duration}ms`);
}