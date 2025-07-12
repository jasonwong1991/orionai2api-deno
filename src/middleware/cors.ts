/**
 * CORS middleware
 */

import { Context, Next } from "@oak/oak";

export async function corsMiddleware(ctx: Context, next: Next) {
  // Set CORS headers
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Credentials", "true");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key, api-key"
  );

  // Handle preflight requests
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }

  await next();
}