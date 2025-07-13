/**
 * OpenAI API compatible data models and schemas
 */

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason?: string;
}

export interface ChatCompletionDelta {
  role?: string;
  content?: string;
}

export interface ChatCompletionStreamChoice {
  index: number;
  delta: ChatCompletionDelta;
  finish_reason?: string;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: ChatCompletionUsage;
}

export interface ChatCompletionStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionStreamChoice[];
  usage?: ChatCompletionUsage;
}

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

export interface ErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export interface InternalChatRequest {
  conversationId: string;
  mode: string;
  message?: string;
  messages?: Record<string, unknown>[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  tokenPool: {
    total: number;
    available: number;
    failed: number;
  };
  stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
  };
}

// Utility functions

export function generateRequestId(): string {
  return `chatcmpl-${crypto.randomUUID().replace(/-/g, "").substring(0, 24)}`;
}

export function generateConversationId(): string {
  return crypto.randomUUID();
}

export function openaiToInternalModelName(openaiModel: string): string {
  // Direct mapping - return the model name as is
  return openaiModel;
}

export function messagesToSingleMessage(messages: ChatMessage[]): string {
  if (!messages || messages.length === 0) {
    return "";
  }

  // If only one user message, return it directly
  if (messages.length === 1 && messages[0].role === "user") {
    return messages[0].content;
  }

  // Otherwise combine all messages
  let combinedMessage = "";
  for (const msg of messages) {
    switch (msg.role) {
      case "system":
        combinedMessage += `System: ${msg.content}\n`;
        break;
      case "user":
        combinedMessage += `User: ${msg.content}\n`;
        break;
      case "assistant":
        combinedMessage += `Assistant: ${msg.content}\n`;
        break;
    }
  }

  return combinedMessage.trim();
}

export function createErrorResponse(message: string, type = "invalid_request_error", code?: string): ErrorResponse {
  const error: ErrorResponse["error"] = {
    message,
    type,
  };
  if (code) {
    error.code = code;
  }
  return { error };
}

export function createModelInfo(id: string, ownedBy = "proxy"): ModelInfo {
  return {
    id,
    object: "model",
    created: Math.floor(Date.now() / 1000),
    owned_by: ownedBy,
  };
}

export function createChatCompletionResponse(
  model: string,
  content: string,
  requestId?: string,
  usage?: ChatCompletionUsage
): ChatCompletionResponse {
  return {
    id: requestId || generateRequestId(),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
        },
        finish_reason: "stop",
      },
    ],
    usage,
  };
}

export function createStreamChunk(
  model: string,
  content: string,
  requestId: string,
  created: number,
  finishReason?: string,
  usage?: ChatCompletionUsage
): ChatCompletionStreamResponse {
  return {
    id: requestId,
    object: "chat.completion.chunk",
    created,
    model,
    choices: [
      {
        index: 0,
        delta: {
          content,
        },
        finish_reason: finishReason || undefined,
      },
    ],
    usage,
  };
}