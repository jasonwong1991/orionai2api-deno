/**
 * OpenAI compatible API routes
 */

import { Context } from "@oak/oak";
import * as log from "@std/log";
import { proxyService } from "../services/proxyService.ts";
import {
  ChatCompletionRequest,
  ModelsResponse,
  createModelInfo,
  createErrorResponse,
} from "../models/schemas.ts";
import { config } from "../core/config.ts";

const logger = log.getLogger();

export function listModels(ctx: Context) {
  try {
    const models = config.availableModels.map((modelId) =>
      createModelInfo(modelId, "proxy")
    );

    const response: ModelsResponse = {
      object: "list",
      data: models,
    };

    ctx.response.body = response;
    logger.debug(`Listed ${models.length} available models`);
  } catch (error) {
    logger.error(`Error listing models: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = createErrorResponse("Failed to list models");
  }
}

export async function createChatCompletion(ctx: Context) {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const request = body as ChatCompletionRequest;

    // Validate request
    if (!request.model) {
      ctx.response.status = 400;
      ctx.response.body = createErrorResponse(
        "Model is required",
        "invalid_request_error"
      );
      return;
    }

    if (!request.messages || request.messages.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = createErrorResponse(
        "Messages are required",
        "invalid_request_error"
      );
      return;
    }

    logger.info(
      `Received chat completion request for model: ${request.model}, stream: ${request.stream}`
    );
    logger.debug(
      `Request details: messages=${request.messages.length}, temperature=${request.temperature}`
    );

    // Forward request to proxy service
    const response = await proxyService.forwardRequest(request);

    if (request.stream) {
      // Streaming response
      logger.info("Returning streaming response");
      ctx.response.headers.set("Content-Type", "text/plain; charset=utf-8");
      ctx.response.headers.set("Cache-Control", "no-cache");
      ctx.response.headers.set("Connection", "keep-alive");
      ctx.response.body = response as ReadableStream<Uint8Array>;
    } else {
      // Non-streaming response
      logger.info("Chat completion request processed successfully");
      ctx.response.body = response;
    }
  } catch (error) {
    logger.error(`Error processing chat completion: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = createErrorResponse(
      `Failed to process request: ${error.message}`
    );
  }
}
