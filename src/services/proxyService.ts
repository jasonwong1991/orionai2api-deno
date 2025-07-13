/**
 * Proxy service for forwarding requests to target API
 */

import * as log from "@std/log";
import { config } from "../core/config.ts";
import { tokenManager } from "./tokenManager.ts";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionStreamResponse,
  createChatCompletionResponse,
  createStreamChunk,
  generateRequestId,
  openaiToInternalModelName,
  messagesToSingleMessage,
} from "../models/schemas.ts";

const logger = log.getLogger();

interface ProjectConversation {
  projectId: string;
  conversationId: string;
}

interface RequestStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  startTime: Date;
}

export class ProxyService {
  private stats: RequestStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    startTime: new Date(),
  };

  async getProjects(token: string): Promise<Array<Record<string, unknown>> | null> {
    try {
      const headers = {
        "accept": "*/*",
        "accept-language": "en,zh;q=0.9,zh-TW;q=0.8,zh-CN;q=0.7",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-ch-ua": '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "cookie": `token=${token}`,
      };

      const response = await fetch(config.projectApiUrl, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(config.timeout),
      });

      logger.info(`Get projects response status: ${response.status}`);

      if (response.ok) {
        const projects = await response.json();
        logger.info(`Found ${projects.length} projects`);
        return projects;
      } else {
        logger.error(`Failed to get projects: ${response.status} - ${await response.text()}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error getting projects: ${error.message}`);
      return null;
    }
  }

  async createProject(token: string): Promise<string | null> {
    try {
      const headers = {
        "accept": "*/*",
        "accept-language": "en,zh;q=0.9,zh-TW;q=0.8,zh-CN;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/json",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-ch-ua": '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "cookie": `token=${token}`,
      };

      const projectName = crypto.randomUUID();
      const payload = { name: projectName };

      const response = await fetch(config.projectApiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(config.timeout),
      });

      logger.info(`Create project response status: ${response.status}`);

      if (response.ok) {
        const responseData = await response.json();
        const projectId = responseData.id;
        if (projectId) {
          logger.info(`Successfully created project: ${projectId}`);
          return projectId;
        } else {
          logger.error(`No project ID in response: ${JSON.stringify(responseData)}`);
          return null;
        }
      } else {
        logger.error(`Failed to create project: ${response.status} - ${await response.text()}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error creating project: ${error.message}`);
      return null;
    }
  }

  async getConversations(token: string, projectId: string): Promise<Array<Record<string, unknown>> | null> {
    try {
      const headers = {
        "accept": "*/*",
        "accept-language": "en,zh;q=0.9,zh-TW;q=0.8,zh-CN;q=0.7",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-ch-ua": '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "cookie": `token=${token}`,
      };

      const url = `${config.projectApiUrl}/${projectId}/conversations`;
      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(config.timeout),
      });

      logger.info(`Get conversations response status: ${response.status}`);

      if (response.ok) {
        const conversations = await response.json();
        logger.info(`Found ${conversations.length} conversations`);
        return conversations;
      } else {
        logger.error(`Failed to get conversations: ${response.status} - ${await response.text()}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error getting conversations: ${error.message}`);
      return null;
    }
  }

  async createConversation(token: string, projectId: string): Promise<string | null> {
    try {
      const headers = {
        "accept": "*/*",
        "accept-language": "en,zh;q=0.9,zh-TW;q=0.8,zh-CN;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/json",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-ch-ua": '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "referer": `https://www.orionai.asia/project/${projectId}`,
        "cookie": `token=${token}`,
      };

      const payload = { projectId };

      const response = await fetch(config.conversationApiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(config.timeout),
      });

      logger.info(`Create conversation response status: ${response.status}`);

      if (response.ok) {
        const responseData = await response.json();
        const conversationId = responseData.id || responseData.conversationId || responseData.conversation_id;
        if (conversationId) {
          logger.info(`Successfully created conversation: ${conversationId}`);
          return conversationId;
        } else {
          logger.error(`No conversation ID in response: ${JSON.stringify(responseData)}`);
          return null;
        }
      } else {
        logger.error(`Failed to create conversation: ${response.status} - ${await response.text()}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error creating conversation: ${error.message}`);
      return null;
    }
  }

  async deleteConversation(token: string, conversationId: string): Promise<boolean> {
    try {
      const headers = {
        "accept": "*/*",
        "accept-language": "en,zh;q=0.9,zh-TW;q=0.8,zh-CN;q=0.7",
        "cache-control": "no-cache",
        "origin": "https://www.orionai.asia",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-ch-ua": '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        "cookie": `token=${token}`,
      };

      const url = `${config.conversationApiUrl}/${conversationId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers,
        signal: AbortSignal.timeout(config.timeout),
      });

      logger.info(`Delete conversation ${conversationId} response status: ${response.status}`);

      if (response.ok) {
        logger.info(`Successfully deleted conversation: ${conversationId}`);
        return true;
      } else {
        logger.error(`Failed to delete conversation ${conversationId}: ${response.status} - ${await response.text()}`);
        return false;
      }
    } catch (error) {
      logger.error(`Error deleting conversation ${conversationId}: ${error.message}`);
      return false;
    }
  }

  async cleanAllConversationsInProject(token: string, projectId: string): Promise<{ deletedCount: number; totalCount: number }> {
    try {
      logger.info(`Starting to clean all conversations in project: ${projectId}`);
      
      // Get all conversations in the project
      const conversations = await this.getConversations(token, projectId);
      if (!conversations || conversations.length === 0) {
        logger.info(`No conversations found in project ${projectId}`);
        return { deletedCount: 0, totalCount: 0 };
      }

      const totalCount = conversations.length;
      let deletedCount = 0;

      // Delete each conversation
      for (const conversation of conversations) {
        const conversationId = conversation.id as string;
        if (conversationId) {
          const deleted = await this.deleteConversation(token, conversationId);
          if (deleted) {
            deletedCount++;
          }
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      logger.info(`Cleaned ${deletedCount}/${totalCount} conversations in project ${projectId}`);
      return { deletedCount, totalCount };
    } catch (error) {
      logger.error(`Error cleaning conversations in project ${projectId}: ${error.message}`);
      return { deletedCount: 0, totalCount: 0 };
    }
  }

  async getProjectAndConversation(token: string): Promise<ProjectConversation | null> {
    // 1. Get projects list
    const projects = await this.getProjects(token);

    let projectId: string | null = null;
    if (projects && projects.length > 0) {
      // Randomly select a project
      const selectedProject = projects[Math.floor(Math.random() * projects.length)];
      projectId = selectedProject.id as string;
      logger.info(`Selected existing project: ${projectId}`);
    } else {
      // Create new project
      projectId = await this.createProject(token);
      if (!projectId) {
        logger.error("Failed to create project");
        return null;
      }
    }

    // 2. Clean existing conversations if auto-clean is enabled
    if (config.autoCleanConversations && config.orionToken) {
      logger.info("Auto-cleaning conversations is enabled, cleaning existing conversations...");
      const cleanResult = await this.cleanAllConversationsInProject(config.orionToken, projectId);
      logger.info(`Cleaned ${cleanResult.deletedCount}/${cleanResult.totalCount} conversations`);
    }

    // 3. Always create a new conversation for fresh chat
    const conversationId = await this.createConversation(token, projectId);
    if (!conversationId) {
      logger.error("Failed to create conversation");
      return null;
    }

    return { projectId, conversationId };
  }

  async sendMessage(token: string, conversationId: string, projectId: string, messageContent: string): Promise<boolean> {
    try {
      const headers = {
        "accept": "*/*",
        "accept-language": "en,zh;q=0.9,zh-TW;q=0.8,zh-CN;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/json",
        "origin": "https://www.orionai.asia",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-ch-ua": '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "referer": `https://www.orionai.asia/project/${projectId}/conversation/${conversationId}`,
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        "cookie": `token=${token}`,
      };

      const payload = {
        content: messageContent,
        role: "user",
      };

      const url = `${config.messageApiUrl}/${conversationId}/message`;
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(config.timeout),
      });

      logger.info(`Send message response status: ${response.status}`);

      if (response.ok) {
        logger.info(`Successfully sent message to conversation: ${conversationId}`);
        return true;
      } else {
        logger.error(`Failed to send message: ${response.status} - ${await response.text()}`);
        return false;
      }
    } catch (error) {
      logger.error(`Error sending message: ${error.message}`);
      return false;
    }
  }

  async forwardRequest(request: ChatCompletionRequest): Promise<ChatCompletionResponse | ReadableStream<Uint8Array>> {
    this.stats.totalRequests++;

    const requestId = generateRequestId();
    const createdTime = Math.floor(Date.now() / 1000);
    const modelName = openaiToInternalModelName(request.model);
    const messageContent = messagesToSingleMessage(request.messages);

    const token = await tokenManager.getToken();
    if (!token) {
      this.stats.failedRequests++;
      const errorMsg = "No available tokens in the pool";
      if (request.stream) {
        return this.createErrorStream(request.model, errorMsg, requestId, createdTime);
      } else {
        throw new Error(errorMsg);
      }
    }

    // Get or create project and conversation
    const projectConversation = await this.getProjectAndConversation(token);
    if (!projectConversation) {
      this.stats.failedRequests++;
      await tokenManager.markTokenFailed(token, "Failed to get project or conversation");
      const errorMsg = "Failed to get project or conversation";
      if (request.stream) {
        return this.createErrorStream(request.model, errorMsg, requestId, createdTime);
      } else {
        throw new Error(errorMsg);
      }
    }

    const { projectId, conversationId } = projectConversation;

    // Step 1: Send message to conversation
    const messageSent = await this.sendMessage(token, conversationId, projectId, messageContent);
    if (!messageSent) {
      this.stats.failedRequests++;
      await tokenManager.markTokenFailed(token, "Failed to send message");
      const errorMsg = "Failed to send message";
      if (request.stream) {
        return this.createErrorStream(request.model, errorMsg, requestId, createdTime);
      } else {
        throw new Error(errorMsg);
      }
    }

    // Step 2: Prepare chat request
    const headers = {
      ...config.defaultHeaders,
      "referer": `https://www.orionai.asia/project/${projectId}/conversation/${conversationId}`,
      "cookie": `token=${token}`,
    };

    const payload = {
      conversationId,
      mode: modelName,
    };

    // Execute request with retries
    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      try {
        logger.info(`Forwarding ${request.stream ? "streaming" : "non-streaming"} request (attempt ${attempt + 1}/${config.maxRetries}) to ${config.targetApiUrl}`);

        const response = await fetch(config.targetApiUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(config.timeout),
        });

        logger.info(`Response status: ${response.status}`);

        if (response.ok) {
          await tokenManager.markTokenSuccess(token);
          this.stats.successfulRequests++;

          if (request.stream) {
            return this.handleStreamResponse(response, requestId, request.model, createdTime);
          } else {
            return await this.handleNonStreamResponse(response, request.model, requestId);
          }
        } else if (response.status === 401 || response.status === 403) {
          // Auth error, mark token failed and try next token
          await tokenManager.markTokenFailed(token, `Auth error: ${response.status}`);
          const newToken = await tokenManager.getToken();
          if (!newToken) break;
          
          // Update token and retry
          headers.cookie = `token=${newToken}`;
          continue;
        } else if (response.status === 429 || response.status >= 500) {
          // Temporary error, retry
          if (attempt < config.maxRetries - 1) {
            const waitTime = config.retryDelay * Math.pow(2, attempt);
            logger.warning(`Temporary error ${response.status}, retrying in ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

        // Other errors
        const errorMsg = `HTTP ${response.status}: ${await response.text()}`;
        logger.error(errorMsg);
        this.stats.failedRequests++;

        if (request.stream) {
          return this.createErrorStream(request.model, errorMsg, requestId, createdTime);
        } else {
          throw new Error(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Request error (attempt ${attempt + 1}): ${error.message}`;
        logger.error(errorMsg);
        
        if (attempt < config.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
          continue;
        }

        this.stats.failedRequests++;
        if (request.stream) {
          return this.createErrorStream(request.model, errorMsg, requestId, createdTime);
        } else {
          throw new Error(errorMsg);
        }
      }
    }

    // All retries failed
    this.stats.failedRequests++;
    const errorMsg = "All retry attempts failed";
    if (request.stream) {
      return this.createErrorStream(request.model, errorMsg, requestId, createdTime);
    } else {
      throw new Error(errorMsg);
    }
  }

  private async handleNonStreamResponse(
    response: Response,
    model: string,
    requestId: string,
  ): Promise<ChatCompletionResponse> {
    try {
      const responseData = await response.json();
      return this.convertToOpenAIResponse(model, responseData, requestId);
    } catch (error) {
      logger.error(`Failed to parse response: ${error.message}`);
      throw new Error(`Failed to parse response: ${error.message}`);
    }
  }

  private handleStreamResponse(
    response: Response,
    requestId: string,
    model: string,
    createdTime: number
  ): ReadableStream<Uint8Array> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    // Bind methods to maintain context
    const parseSSELine = this.parseSSELine.bind(this);
    const convertStreamToOpenAI = this.convertStreamToOpenAI.bind(this);

    return new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        let streamClosed = false;
        let clientDisconnected = false;
        
        const safeEnqueue = (data: Uint8Array) => {
          try {
            if (!streamClosed && !clientDisconnected) {
              controller.enqueue(data);
            }
          } catch (error) {
            logger.error(`Failed to enqueue data: ${error.message}`);
            streamClosed = true;
            clientDisconnected = true;
          }
        };

        const safeClose = () => {
          try {
            if (!streamClosed) {
              controller.close();
              streamClosed = true;
            }
          } catch (error) {
            // Silently handle close errors in Docker environment
            streamClosed = true;
            logger.error(`Failed to close stream: ${error.message}`);
          }
        };

        // Add abort signal handling for client disconnection
        const abortController = new AbortController();
        const signal = abortController.signal;
        
        signal.addEventListener('abort', () => {
          clientDisconnected = true;
          streamClosed = true;
        });
        
        try {
          while (true && !clientDisconnected) {
            const { done, value } = await reader.read();
            if (done || clientDisconnected) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (clientDisconnected) break;
              if (!line.trim()) continue;

              const parsed = parseSSELine(line);
              if (!parsed) continue;

              if (parsed.type === "done") {
                safeEnqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                safeClose();
                return;
              } else if (parsed.type === "data") {
                const openaiChunk = convertStreamToOpenAI(parsed.data, requestId, model, createdTime);
                const chunkData = `data: ${JSON.stringify(openaiChunk)}\n\n`;
                safeEnqueue(new TextEncoder().encode(chunkData));
              }
            }
          }
        } catch (error) {
          if (!clientDisconnected) {
            logger.error(`Stream processing error: ${error.message}`);
            if (!streamClosed) {
              const errorChunk = createStreamChunk(model, `Error: ${error.message}`, requestId, createdTime, "error");
              safeEnqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
              safeEnqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            }
          }
        } finally {
          safeClose();
        }
      }
    });
  }

  private parseSSELine(line: string): { type: "data" | "done"; data?: string } | null {
    if (!line.trim()) return null;

    // Handle SSE format: "message\t{json_data}\t"
    if (line.startsWith("message\t")) {
      try {
        const jsonPart = line.slice(8).replace(/\t$/, "");
        if (jsonPart === "[DONE]") {
          return { type: "done" };
        }
        const data = JSON.parse(jsonPart);
        return { type: "data", data };
      } catch {
        return null;
      }
    }

    // Handle standard SSE format: "data: {json_data}"
    if (line.startsWith("data: ")) {
      try {
        const jsonPart = line.slice(6);
        if (jsonPart.trim() === "[DONE]") {
          return { type: "done" };
        }
        const data = JSON.parse(jsonPart);
        return { type: "data", data };
      } catch {
        return null;
      }
    }

    return null;
  }

  private convertStreamToOpenAI(
    data: Record<string, unknown> | string | undefined, 
    requestId: string, 
    model: string, 
    createdTime: number
  ): ChatCompletionStreamResponse {
    // 如果data是undefined或string，返回空内容的chunk
    if (typeof data === 'undefined' || typeof data === 'string') {
      return createStreamChunk(model, "", requestId, createdTime);
    }

    // 现在data被确认为Record<string, unknown>类型
    const dataObj = data as Record<string, unknown>;
    const choices = dataObj.choices as Array<Record<string, unknown>> || [];
    
    if (!Array.isArray(choices) || choices.length === 0) {
      return createStreamChunk(model, "", requestId, createdTime);
    }

    const choice = choices[0];
    const delta = choice.delta as Record<string, unknown> || {};
    const content = (delta.content as string) || "";
    const finishReason = choice.finish_reason as string;

    return createStreamChunk(model, content, requestId, createdTime, finishReason);
  }

  private convertToOpenAIResponse(
    model: string,
    responseData: Record<string, unknown>,
    requestId: string,
  ): ChatCompletionResponse {
    // Extract content from response
    const choices = responseData.choices as Array<{ message?: { content?: string }; text?: string }>;
    let content = "";
    
    if (choices.length > 0) {
      const choice = choices[0];
      content = choice.message?.content || choice.text || "";
    }

    return createChatCompletionResponse(model, content, requestId);
  }

  private createErrorStream(model: string, errorMsg: string, requestId: string, createdTime: number): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start(controller) {
        const errorChunk = createStreamChunk(model, `Error: ${errorMsg}`, requestId, createdTime, "error");
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      }
    });
  }

  getStats(): RequestStats & { successRate: number; uptime: number } {
    const uptime = Date.now() - this.stats.startTime.getTime();
    const successRate = this.stats.totalRequests > 0 
      ? (this.stats.successfulRequests / this.stats.totalRequests) * 100 
      : 0;

    return {
      ...this.stats,
      successRate,
      uptime,
    };
  }
}

// Global proxy service instance
export const proxyService = new ProxyService();
