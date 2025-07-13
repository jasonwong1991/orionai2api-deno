/**
 * System routes (health check, status, etc.)
 */

import { Context } from "@oak/oak";
import * as log from "@std/log";
import { config } from "../core/config.ts";
import { tokenManager } from "../services/tokenManager.ts";
import { proxyService } from "../services/proxyService.ts";
import { HealthStatus } from "../models/schemas.ts";

const logger = log.getLogger();
const startTime = Date.now();

export function rootHandler(ctx: Context) {
  ctx.response.body = {
    name: config.appName,
    description: "OpenAI-compatible LLM Proxy API (Deno Version)",
    version: "1.0.0",
    docs: "/docs",
    health: "/health",
    endpoints: {
      "GET /v1/models": "List available models",
      "POST /v1/chat/completions": "Create chat completion",
    },
  };
}

export function healthCheck(ctx: Context) {
  try {
    const tokenPoolStatus = tokenManager.getPoolStatus();
    const stats = proxyService.getStats();
    const uptime = Date.now() - startTime;

    const health: HealthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime,
      version: "1.0.0",
      tokenPool: {
        total: tokenPoolStatus.totalTokens,
        available: tokenPoolStatus.availableTokens,
        failed: tokenPoolStatus.failedTokens,
      },
      stats: {
        totalRequests: stats.totalRequests,
        successfulRequests: stats.successfulRequests,
        failedRequests: stats.failedRequests,
        successRate: stats.successRate,
      },
    };

    ctx.response.body = health;
    logger.debug("Health check completed successfully");
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

export function docsHandler(ctx: Context) {
  const docs = `
<!DOCTYPE html>
<html>
<head>
    <title>${config.appName} - API Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .method { font-weight: bold; color: #2196F3; }
        .path { font-family: monospace; background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
        .example { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <h1>${config.appName}</h1>
    <p>OpenAI-compatible LLM Proxy API (Deno Version)</p>
    
    <h2>Available Endpoints</h2>
    
    <div class="endpoint">
        <div><span class="method">GET</span> <span class="path">/v1/models</span></div>
        <p>List all available models</p>
        <div class="example">curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3333/v1/models</div>
    </div>
    
    <div class="endpoint">
        <div><span class="method">POST</span> <span class="path">/v1/chat/completions</span></div>
        <p>Create a chat completion (supports streaming)</p>
        <div class="example">
curl -X POST http://localhost:3333/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "Claude 4-Default",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
        </div>
    </div>
    
    <div class="endpoint">
        <div><span class="method">GET</span> <span class="path">/health</span></div>
        <p>Health check and system status</p>
        <div class="example">curl http://localhost:3333/health</div>
    </div>
    
    <h2>Authentication</h2>
    <p>API key can be provided in multiple ways:</p>
    <ul>
        <li>Authorization header: <code>Authorization: Bearer YOUR_API_KEY</code></li>
        <li>Custom headers: <code>X-API-Key: YOUR_API_KEY</code> or <code>api-key: YOUR_API_KEY</code></li>
        <li>Query parameter: <code>?api_key=YOUR_API_KEY</code></li>
    </ul>
    
    <h2>Available Models</h2>
    <ul>
        ${config.availableModels.map(model => `<li><code>${model}</code></li>`).join('')}
    </ul>
</body>
</html>
  `;

  ctx.response.headers.set("Content-Type", "text/html");
  ctx.response.body = docs;
}
